require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const path = require('path');
const { pool, initDb, seedDemo } = require('./db');

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) throw new Error('SESSION_SECRET must be at least 32 characters in production');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));
app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.urlencoded({extended:false,limit:'100kb'}));
app.use(express.json({limit:'100kb'}));
app.use(express.static(path.join(__dirname,'public'),{maxAge:process.env.NODE_ENV==='production'?'1d':0}));
app.use(session({store:new pgSession({pool,tableName:'user_sessions',createTableIfMissing:true}),secret:process.env.SESSION_SECRET,resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:1000*60*60*8}}));
const loginLimiter=rateLimit({windowMs:15*60*1000,max:20,standardHeaders:true,legacyHeaders:false});
function csrf(req,res,next){if(!req.session.csrf)req.session.csrf=crypto.randomBytes(32).toString('hex');res.locals.csrf=req.session.csrf;next();}
function requireCsrf(req,res,next){if(req.method==='GET')return next();if(!req.body||req.body._csrf!==req.session.csrf)return res.status(403).send('CSRF validation failed');next();}
function auth(req,res,next){if(!req.session.user)return res.redirect('/login');next();}
async function businessFor(req){const r=await pool.query('SELECT b.* FROM businesses b JOIN memberships m ON m.business_id=b.id WHERE m.user_id=$1 AND b.id=$2',[req.session.user.id,req.session.user.businessId]);return r.rows[0];}
async function dashboardData(bid){const [campaigns,customers,reviews,content,promotions,totals]=await Promise.all([pool.query('SELECT * FROM campaigns WHERE business_id=$1 ORDER BY id DESC',[bid]),pool.query('SELECT * FROM customers WHERE business_id=$1 ORDER BY id DESC',[bid]),pool.query('SELECT * FROM reviews WHERE business_id=$1 ORDER BY id DESC',[bid]),pool.query('SELECT * FROM content WHERE business_id=$1 ORDER BY scheduled_date ASC NULLS LAST',[bid]),pool.query('SELECT * FROM promotions WHERE business_id=$1 ORDER BY id DESC',[bid]),pool.query('SELECT COALESCE(SUM(spent),0) spent,COALESCE(SUM(leads),0) leads,COALESCE(SUM(sales),0) sales FROM campaigns WHERE business_id=$1',[bid])]);const t=totals.rows[0];return{campaigns:campaigns.rows,customers:customers.rows,reviews:reviews.rows,content:content.rows,promotions:promotions.rows,totals:t,costPerSale:t.sales?Number(t.spent)/Number(t.sales):0};}
app.use(csrf);
app.use(requireCsrf);
app.get('/health',async(req,res)=>{try{await pool.query('SELECT 1');res.json({ok:true,service:'marketing-hub'});}catch(e){res.status(503).json({ok:false});}});
app.get('/',(req,res)=>res.redirect(req.session.user?'/dashboard':'/login'));
app.get('/login',(req,res)=>res.render('login',{mode:'login',error:null}));
app.post('/login',loginLimiter,async(req,res)=>{try{const{email,password}=req.body;if(!email||!password)return res.status(400).render('login',{mode:'login',error:'Completá email y contraseña.'});const u=(await pool.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1)',[email.trim()])).rows[0];if(!u||!(await bcrypt.compare(password,u.password_hash)))return res.status(401).render('login',{mode:'login',error:'Email o contraseña incorrectos.'});const m=(await pool.query('SELECT business_id FROM memberships WHERE user_id=$1 ORDER BY business_id LIMIT 1',[u.id])).rows[0];if(!m)return res.status(403).render('login',{mode:'login',error:'Tu usuario no tiene una empresa asociada.'});req.session.regenerate(err=>{if(err)return res.status(500).send('Session error');req.session.user={id:u.id,email:u.email,name:u.name,businessId:m.business_id};req.session.csrf=crypto.randomBytes(32).toString('hex');res.redirect('/dashboard');});}catch(e){console.error(e);res.status(500).send('Error de servidor');}});
app.get('/register',(req,res)=>res.render('login',{mode:'register',error:null}));
app.post('/register',loginLimiter,async(req,res)=>{const client=await pool.connect();try{const{name,email,password,business_name,category}=req.body;if(!name||!email||!password||!business_name)return res.status(400).render('login',{mode:'register',error:'Completá todos los campos obligatorios.'});if(password.length<10)return res.status(400).render('login',{mode:'register',error:'La contraseña debe tener al menos 10 caracteres.'});await client.query('BEGIN');const exists=await client.query('SELECT 1 FROM users WHERE LOWER(email)=LOWER($1)',[email.trim()]);if(exists.rowCount)throw new Error('EMAIL_EXISTS');const hash=await bcrypt.hash(password,12);const u=(await client.query('INSERT INTO users(email,password_hash,name) VALUES($1,$2,$3) RETURNING id,email,name',[email.trim().toLowerCase(),hash,name.trim()])).rows[0];const b=(await client.query('INSERT INTO businesses(name,category) VALUES($1,$2) RETURNING id',[business_name.trim(),category||'Negocio'])).rows[0];await client.query('INSERT INTO memberships(user_id,business_id,role) VALUES($1,$2,$3)',[u.id,b.id,'owner']);await client.query('COMMIT');req.session.user={id:u.id,email:u.email,name:u.name,businessId:b.id};res.redirect('/dashboard');}catch(e){await client.query('ROLLBACK');if(e.message==='EMAIL_EXISTS')return res.status(409).render('login',{mode:'register',error:'Ese email ya está registrado.'});console.error(e);res.status(500).send('Error de servidor');}finally{client.release();}});
app.post('/logout',(req,res)=>req.session.destroy(()=>res.redirect('/login')));
app.get('/dashboard',auth,async(req,res)=>{const biz=await businessFor(req);const d=await dashboardData(biz.id);res.render('dashboard',{biz,user:req.session.user,...d});});
app.get('/campaigns',auth,async(req,res)=>{const biz=await businessFor(req);const d=await dashboardData(biz.id);res.render('campaigns',{biz,campaigns:d.campaigns});});
app.post('/campaigns',auth,async(req,res)=>{const b=await businessFor(req);const{name,platform,objective,budget,start_date,end_date}=req.body;await pool.query('INSERT INTO campaigns(business_id,name,platform,objective,budget,start_date,end_date) VALUES($1,$2,$3,$4,$5,$6,$7)',[b.id,name,platform,objective,Number(budget)||0,start_date||null,end_date||null]);res.redirect('/campaigns');});
app.post('/campaigns/:id/delete',auth,async(req,res)=>{const b=await businessFor(req);await pool.query('DELETE FROM campaigns WHERE id=$1 AND business_id=$2',[req.params.id,b.id]);res.redirect('/campaigns');});
app.get('/customers',auth,async(req,res)=>{const b=await businessFor(req);const d=await dashboardData(b.id);res.render('customers',{biz:b,customers:d.customers});});
app.post('/customers',auth,async(req,res)=>{const b=await businessFor(req);const{name,phone,email,status}=req.body;await pool.query('INSERT INTO customers(business_id,name,phone,email,status) VALUES($1,$2,$3,$4,$5)',[b.id,name,phone||null,email||null,status||'new']);res.redirect('/customers');});
app.get('/content',auth,async(req,res)=>{const b=await businessFor(req);const d=await dashboardData(b.id);res.render('content',{biz:b,content:d.content});});
app.post('/content',auth,async(req,res)=>{const b=await businessFor(req);const{title,type,platform,scheduled_date,copy}=req.body;await pool.query('INSERT INTO content(business_id,title,type,platform,scheduled_date,copy) VALUES($1,$2,$3,$4,$5,$6)',[b.id,title,type,platform,scheduled_date||null,copy||null]);res.redirect('/content');});
app.post('/content/:id/delete',auth,async(req,res)=>{const b=await businessFor(req);await pool.query('DELETE FROM content WHERE id=$1 AND business_id=$2',[req.params.id,b.id]);res.redirect('/content');});
app.get('/reviews',auth,async(req,res)=>{const b=await businessFor(req);const d=await dashboardData(b.id);res.render('reviews',{biz:b,reviews:d.reviews});});
app.post('/reviews/:id/respond',auth,async(req,res)=>{const b=await businessFor(req);await pool.query("UPDATE reviews SET response=$1,status='answered' WHERE id=$2 AND business_id=$3",[req.body.response||'',req.params.id,b.id]);res.redirect('/reviews');});
app.get('/promotions',auth,async(req,res)=>{const b=await businessFor(req);const d=await dashboardData(b.id);res.render('promotions',{biz:b,promotions:d.promotions});});
app.post('/promotions',auth,async(req,res)=>{const b=await businessFor(req);const{title,code,discount,start_date,end_date}=req.body;await pool.query('INSERT INTO promotions(business_id,title,code,discount,start_date,end_date) VALUES($1,$2,$3,$4,$5,$6)',[b.id,title,code,discount,start_date||null,end_date||null]);res.redirect('/promotions');});
app.get('/settings',auth,async(req,res)=>res.render('settings',{biz:await businessFor(req)}));
app.post('/settings',auth,async(req,res)=>{const b=await businessFor(req);const{name,category,address,phone,instagram,monthly_budget}=req.body;await pool.query('UPDATE businesses SET name=$1,category=$2,address=$3,phone=$4,instagram=$5,monthly_budget=$6 WHERE id=$7',[name,category,address||null,phone||null,instagram||null,Number(monthly_budget)||0,b.id]);res.redirect('/settings');});
app.get('/api/stats',auth,async(req,res)=>{const b=await businessFor(req);const d=await dashboardData(b.id);res.json({totals:d.totals,campaigns:d.campaigns});});
app.use((req,res)=>res.status(404).send('Not found'));
(async()=>{await initDb();await seedDemo();app.listen(PORT,()=>console.log(`Marketing Hub running on ${PORT}`));})().catch(e=>{console.error(e);process.exit(1)});
