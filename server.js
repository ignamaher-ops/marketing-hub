require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pool, initDb, seedDemo } = require('./db');

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = '<script src="/auth-bridge.js"></script>\n<script src="/campaign-api.js"></script>\n<script src="/mvp-api.js"></script>\n';
const appHtml = indexHtml.includes('/auth-bridge.js')
  ? indexHtml.replace('</body>', scripts + '</body>')
  : indexHtml.replace('</body>', scripts + '</body>');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(session({
  store: new pgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: isProduction, maxAge: 1000 * 60 * 60 * 8 }
}));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
function ensureCsrf(req, res, next) { if (!req.session.csrf) req.session.csrf = crypto.randomBytes(32).toString('hex'); res.setHeader('X-CSRF-Token', req.session.csrf); next(); }
function requireCsrf(req, res, next) { if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next(); if (!req.session.csrf || req.get('X-CSRF-Token') !== req.session.csrf) return res.status(403).json({ error: 'CSRF validation failed' }); next(); }
function requireAuth(req, res, next) { if (!req.session.user) return res.status(401).json({ error: 'Authentication required' }); next(); }

async function getUserWorkspace(userId) {
  const result = await pool.query(`SELECT b.id, b.name, b.category, b.address, b.phone, b.instagram, b.monthly_budget, m.role FROM businesses b JOIN memberships m ON m.business_id = b.id WHERE m.user_id = $1 ORDER BY b.created_at ASC LIMIT 1`, [userId]);
  return result.rows[0] || null;
}
async function workspaceId(req) { const workspace = await getUserWorkspace(req.session.user.id); return workspace?.id || null; }
function asyncRoute(handler) { return async (req, res) => { try { await handler(req, res); } catch (error) { console.error(`${req.method} ${req.path}:`, error.message); res.status(500).json({ error: 'Unable to complete request' }); } }; }
function parseNonNegativeNumber(value) { const n = Number(value); return Number.isFinite(n) && n >= 0 ? n : null; }
function parseNonNegativeInt(value) { const n = Number.parseInt(value, 10); return Number.isInteger(n) && n >= 0 ? n : null; }

app.use(ensureCsrf);
app.use(requireCsrf);
app.get('/health', asyncRoute(async (req, res) => { await pool.query('SELECT 1'); res.json({ ok: true, service: 'marketing-hub', database: 'connected' }); }));
app.get('/api/auth/csrf', (req, res) => res.json({ csrfToken: req.session.csrf }));
app.get('/api/auth/me', asyncRoute(async (req, res) => { if (!req.session.user) return res.status(401).json({ authenticated: false }); const workspace = await getUserWorkspace(req.session.user.id); res.json({ authenticated: true, user: req.session.user, workspace }); }));

app.post('/api/auth/register', authLimiter, asyncRoute(async (req, res) => {
  const { name, email, password, businessName, category } = req.body || {};
  if (!name || !email || !password || !businessName) return res.status(400).json({ error: 'name, email, password and businessName are required' });
  if (String(password).length < 10) return res.status(400).json({ error: 'Password must contain at least 10 characters' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const normalizedEmail = String(email).trim().toLowerCase();
    if ((await client.query('SELECT 1 FROM users WHERE email = $1', [normalizedEmail])).rowCount) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Email already registered' }); }
    const passwordHash = await bcrypt.hash(String(password), 12);
    const user = (await client.query('INSERT INTO users(email,password_hash,name) VALUES($1,$2,$3) RETURNING id,email,name', [normalizedEmail, passwordHash, String(name).trim()])).rows[0];
    const business = (await client.query('INSERT INTO businesses(name,category) VALUES($1,$2) RETURNING id,name,category', [String(businessName).trim(), String(category || 'Negocio').trim()])).rows[0];
    await client.query('INSERT INTO memberships(user_id,business_id,role) VALUES($1,$2,$3)', [user.id, business.id, 'owner']);
    await client.query('COMMIT');
    await new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
    req.session.user = { id: user.id, email: user.email, name: user.name, businessId: business.id }; req.session.csrf = crypto.randomBytes(32).toString('hex');
    res.status(201).json({ user, workspace: business });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

app.post('/api/auth/login', authLimiter, asyncRoute(async (req, res) => {
  const { email, password } = req.body || {}; if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const user = (await pool.query('SELECT id,email,name,password_hash FROM users WHERE email=$1', [String(email).trim().toLowerCase()])).rows[0];
  if (!user || !(await bcrypt.compare(String(password), user.password_hash))) return res.status(401).json({ error: 'Invalid email or password' });
  const workspace = await getUserWorkspace(user.id); if (!workspace) return res.status(403).json({ error: 'User has no business workspace' });
  await new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
  req.session.user = { id: user.id, email: user.email, name: user.name, businessId: workspace.id }; req.session.csrf = crypto.randomBytes(32).toString('hex');
  res.json({ user: req.session.user, workspace });
}));
app.post('/api/auth/logout', requireAuth, (req, res) => req.session.destroy(error => { if (error) return res.status(500).json({ error: 'Unable to sign out' }); res.clearCookie('connect.sid'); res.status(204).end(); }));

app.get('/api/workspace', requireAuth, asyncRoute(async (req, res) => { const workspace = await getUserWorkspace(req.session.user.id); if (!workspace) return res.status(404).json({ error: 'Workspace not found' }); res.json(workspace); }));
app.patch('/api/workspace', requireAuth, asyncRoute(async (req, res) => {
  const id = await workspaceId(req); if (!id) return res.status(404).json({ error: 'Workspace not found' });
  const allowed = ['name','category','address','phone','instagram','monthly_budget']; const updates=[]; const values=[];
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) { let value=req.body[key]; if (key==='monthly_budget') value=parseNonNegativeNumber(value); if (key==='monthly_budget' && value===null) return res.status(400).json({ error:'monthly_budget must be a non-negative number' }); updates.push(`${key}=$${values.length+1}`); values.push(value); }
  if (!updates.length) return res.status(400).json({ error:'No fields to update' }); values.push(id);
  const result=await pool.query(`UPDATE businesses SET ${updates.join(',')} WHERE id=$${values.length} RETURNING id,name,category,address,phone,instagram,monthly_budget`, values); res.json(result.rows[0]);
}));

app.get('/api/campaigns', requireAuth, asyncRoute(async (req,res)=>{ const id=await workspaceId(req); if(!id)return res.status(404).json({error:'Workspace not found'}); const r=await pool.query('SELECT id,name,platform,objective,budget,spent,leads,sales,status,start_date,end_date,created_at FROM campaigns WHERE business_id=$1 ORDER BY created_at DESC,id DESC',[id]); res.json({campaigns:r.rows}); }));
app.post('/api/campaigns', requireAuth, asyncRoute(async (req,res)=>{ const id=await workspaceId(req); if(!id)return res.status(404).json({error:'Workspace not found'}); const b=req.body||{}, name=String(b.name||'').trim(), platform=String(b.platform||'').trim(), objective=String(b.objective||'').trim(), budget=parseNonNegativeNumber(b.budget); if(!name||!platform||!objective||budget===null)return res.status(400).json({error:'name, platform, objective and a valid budget are required'}); const r=await pool.query(`INSERT INTO campaigns(business_id,name,platform,objective,budget,spent,leads,sales,status,start_date,end_date) VALUES($1,$2,$3,$4,$5,0,0,0,$6,$7,$8) RETURNING id,name,platform,objective,budget,spent,leads,sales,status,start_date,end_date,created_at`,[id,name,platform,objective,budget,String(b.status||'active'),b.start_date||null,b.end_date||null]); res.status(201).json({campaign:r.rows[0]}); }));
app.patch('/api/campaigns/:id', requireAuth, asyncRoute(async(req,res)=>{ const id=await workspaceId(req); if(!id)return res.status(404).json({error:'Workspace not found'}); const allowed=['name','platform','objective','budget','spent','leads','sales','status','start_date','end_date']; const u=[],v=[]; for(const key of allowed)if(Object.prototype.hasOwnProperty.call(req.body||{},key)){let x=req.body[key]; if(['budget','spent'].includes(key)){x=parseNonNegativeNumber(x);if(x===null)return res.status(400).json({error:`${key} must be a non-negative number`});} if(['leads','sales'].includes(key)){x=parseNonNegativeInt(x);if(x===null)return res.status(400).json({error:`${key} must be a non-negative integer`});} if(['name','platform','objective','status'].includes(key))x=String(x).trim();u.push(`${key}=$${v.length+1}`);v.push(x);} if(!u.length)return res.status(400).json({error:'No fields to update'});v.push(id,req.params.id);const r=await pool.query(`UPDATE campaigns SET ${u.join(',')} WHERE business_id=$${v.length-1} AND id=$${v.length} RETURNING id,name,platform,objective,budget,spent,leads,sales,status,start_date,end_date,created_at`,v);if(!r.rowCount)return res.status(404).json({error:'Campaign not found'});res.json({campaign:r.rows[0]}); }));
app.delete('/api/campaigns/:id',requireAuth,asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const r=await pool.query('DELETE FROM campaigns WHERE business_id=$1 AND id=$2 RETURNING id',[id,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'Campaign not found'});res.status(204).end();}));

app.get('/api/customers', requireAuth, asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const r=await pool.query('SELECT id,name,phone,email,status,purchases,total_spent,last_purchase,created_at FROM customers WHERE business_id=$1 ORDER BY created_at DESC,id DESC',[id]);res.json({customers:r.rows});}));
app.post('/api/customers', requireAuth, asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const b=req.body||{},name=String(b.name||'').trim();if(!name)return res.status(400).json({error:'name is required'});const r=await pool.query(`INSERT INTO customers(business_id,name,phone,email,status,purchases,total_spent,last_purchase) VALUES($1,$2,$3,$4,$5,0,0,$6) RETURNING id,name,phone,email,status,purchases,total_spent,last_purchase,created_at`,[id,name,b.phone||null,b.email||null,String(b.status||'new').toLowerCase(),b.last_purchase||new Date().toISOString().slice(0,10)]);res.status(201).json({customer:r.rows[0]});}));
app.patch('/api/customers/:id',requireAuth,asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const allowed=['name','phone','email','status','purchases','total_spent','last_purchase'],u=[],v=[];for(const key of allowed)if(Object.prototype.hasOwnProperty.call(req.body||{},key)){let x=req.body[key];if(key==='purchases'){x=parseNonNegativeInt(x);if(x===null)return res.status(400).json({error:'purchases must be a non-negative integer'});}if(key==='total_spent'){x=parseNonNegativeNumber(x);if(x===null)return res.status(400).json({error:'total_spent must be a non-negative number'});}if(['name','phone','email','status'].includes(key)&&x!==null)x=String(x).trim();u.push(`${key}=$${v.length+1}`);v.push(x||null);}if(!u.length)return res.status(400).json({error:'No fields to update'});v.push(id,req.params.id);const r=await pool.query(`UPDATE customers SET ${u.join(',')} WHERE business_id=$${v.length-1} AND id=$${v.length} RETURNING id,name,phone,email,status,purchases,total_spent,last_purchase,created_at`,v);if(!r.rowCount)return res.status(404).json({error:'Customer not found'});res.json({customer:r.rows[0]});}));
app.delete('/api/customers/:id',requireAuth,asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const r=await pool.query('DELETE FROM customers WHERE business_id=$1 AND id=$2 RETURNING id',[id,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'Customer not found'});res.status(204).end();}));

app.get('/api/content',requireAuth,asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const r=await pool.query('SELECT id,title,type,platform,scheduled_date,status,copy,created_at FROM content WHERE business_id=$1 ORDER BY scheduled_date NULLS LAST,created_at DESC,id DESC',[id]);res.json({content:r.rows});}));
app.post('/api/content',requireAuth,asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const b=req.body||{},title=String(b.title||'').trim(),type=String(b.type||b.format||'Post').trim(),platform=String(b.platform||'').trim();if(!title||!platform)return res.status(400).json({error:'title and platform are required'});const r=await pool.query(`INSERT INTO content(business_id,title,type,platform,scheduled_date,status,copy) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,title,type,platform,scheduled_date,status,copy,created_at`,[id,title,type,platform,b.scheduled_date||b.date||null,String(b.status||'draft').toLowerCase(),b.copy||null]);res.status(201).json({content:r.rows[0]});}));
app.patch('/api/content/:id',requireAuth,asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const allowed=['title','type','platform','scheduled_date','status','copy'],u=[],v=[];for(const key of allowed)if(Object.prototype.hasOwnProperty.call(req.body||{},key)){u.push(`${key}=$${v.length+1}`);v.push(req.body[key]===null?'':req.body[key]);}if(!u.length)return res.status(400).json({error:'No fields to update'});v.push(id,req.params.id);const r=await pool.query(`UPDATE content SET ${u.join(',')} WHERE business_id=$${v.length-1} AND id=$${v.length} RETURNING id,title,type,platform,scheduled_date,status,copy,created_at`,v);if(!r.rowCount)return res.status(404).json({error:'Content not found'});res.json({content:r.rows[0]});}));
app.delete('/api/content/:id',requireAuth,asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const r=await pool.query('DELETE FROM content WHERE business_id=$1 AND id=$2 RETURNING id',[id,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'Content not found'});res.status(204).end();}));

app.get('/api/reviews',requireAuth,asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const r=await pool.query('SELECT id,customer_name,rating,comment,status,response,created_at FROM reviews WHERE business_id=$1 ORDER BY created_at DESC,id DESC',[id]);res.json({reviews:r.rows});}));
app.patch('/api/reviews/:id',requireAuth,asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const response=String(req.body?.response??'').trim();if(!response)return res.status(400).json({error:'response is required'});const r=await pool.query(`UPDATE reviews SET response=$1,status='answered' WHERE business_id=$2 AND id=$3 RETURNING id,customer_name,rating,comment,status,response,created_at`,[response,id,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'Review not found'});res.json({review:r.rows[0]});}));

app.get('/api/promotions',requireAuth,asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const r=await pool.query('SELECT id,title,code,discount,start_date,end_date,uses,status,created_at FROM promotions WHERE business_id=$1 ORDER BY created_at DESC,id DESC',[id]);res.json({promotions:r.rows});}));
app.post('/api/promotions',requireAuth,asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const b=req.body||{},title=String(b.title||b.name||'').trim(),code=String(b.code||'').trim().toUpperCase(),discount=String(b.discount||'').trim();if(!title||!code||!discount)return res.status(400).json({error:'title, code and discount are required'});const r=await pool.query(`INSERT INTO promotions(business_id,title,code,discount,start_date,end_date,uses,status) VALUES($1,$2,$3,$4,$5,$6,0,$7) RETURNING id,title,code,discount,start_date,end_date,uses,status,created_at`,[id,title,code,discount,b.start_date||b.start||null,b.end_date||b.end||null,String(b.status||'active').toLowerCase()]);res.status(201).json({promotion:r.rows[0]});}));
app.delete('/api/promotions/:id',requireAuth,asyncRoute(async(req,res)=>{const id=await workspaceId(req);if(!id)return res.status(404).json({error:'Workspace not found'});const r=await pool.query('DELETE FROM promotions WHERE business_id=$1 AND id=$2 RETURNING id',[id,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'Promotion not found'});res.status(204).end();}));

app.get('/',(req,res)=>res.type('html').send(appHtml));
app.get('/app',(req,res)=>res.type('html').send(appHtml));
app.use(express.static(path.join(__dirname,'public'),{maxAge:isProduction?'1d':0}));
app.use((req,res)=>res.status(404).json({error:'Not found'}));

(async()=>{await initDb();await seedDemo();app.listen(PORT,()=>console.log(`Marketing Hub API running on port ${PORT}`));})().catch(error=>{console.error(error);process.exit(1);});
