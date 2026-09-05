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
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters');
}

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const appHtml = indexHtml.includes('/auth-bridge.js')
  ? (indexHtml.includes('/campaign-api.js') ? indexHtml : indexHtml.replace('</body>', '<script src="/campaign-api.js"></script>\n</body>'))
  : indexHtml.replace('</body>', '<script src="/auth-bridge.js"></script>\n<script src="/campaign-api.js"></script>\n</body>');

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
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8
  }
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

function ensureCsrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(32).toString('hex');
  res.setHeader('X-CSRF-Token', req.session.csrf);
  next();
}

function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!req.session.csrf || req.get('X-CSRF-Token') !== req.session.csrf) {
    return res.status(403).json({ error: 'CSRF validation failed' });
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

async function getUserWorkspace(userId) {
  const result = await pool.query(
    `SELECT b.id, b.name, b.category, b.address, b.phone, b.instagram, b.monthly_budget, m.role
     FROM businesses b
     JOIN memberships m ON m.business_id = b.id
     WHERE m.user_id = $1
     ORDER BY b.created_at ASC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

app.use(ensureCsrf);
app.use(requireCsrf);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'marketing-hub', database: 'connected' });
  } catch (error) {
    res.status(503).json({ ok: false, service: 'marketing-hub', database: 'unavailable' });
  }
});

app.get('/api/auth/csrf', (req, res) => {
  res.json({ csrfToken: req.session.csrf });
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ authenticated: false });
  const workspace = await getUserWorkspace(req.session.user.id);
  res.json({ authenticated: true, user: req.session.user, workspace });
});

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { name, email, password, businessName, category } = req.body || {};
  if (!name || !email || !password || !businessName) {
    return res.status(400).json({ error: 'name, email, password and businessName are required' });
  }
  if (String(password).length < 10) {
    return res.status(400).json({ error: 'Password must contain at least 10 characters' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await client.query('SELECT 1 FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(String(password), 12);
    const user = (await client.query(
      'INSERT INTO users(email, password_hash, name) VALUES($1,$2,$3) RETURNING id,email,name',
      [normalizedEmail, passwordHash, String(name).trim()]
    )).rows[0];
    const business = (await client.query(
      'INSERT INTO businesses(name, category) VALUES($1,$2) RETURNING id,name,category',
      [String(businessName).trim(), String(category || 'Negocio').trim()]
    )).rows[0];
    await client.query('INSERT INTO memberships(user_id, business_id, role) VALUES($1,$2,$3)', [user.id, business.id, 'owner']);
    await client.query('COMMIT');
    await new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
    req.session.user = { id: user.id, email: user.email, name: user.name, businessId: business.id };
    req.session.csrf = crypto.randomBytes(32).toString('hex');
    res.status(201).json({ user, workspace: business });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('register error:', error.message);
    res.status(500).json({ error: 'Unable to create account' });
  } finally {
    client.release();
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  try {
    const userResult = await pool.query('SELECT id,email,name,password_hash FROM users WHERE email = $1', [String(email).trim().toLowerCase()]);
    const user = userResult.rows[0];
    if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const workspace = await getUserWorkspace(user.id);
    if (!workspace) return res.status(403).json({ error: 'User has no business workspace' });
    await new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
    req.session.user = { id: user.id, email: user.email, name: user.name, businessId: workspace.id };
    req.session.csrf = crypto.randomBytes(32).toString('hex');
    res.json({ user: req.session.user, workspace });
  } catch (error) {
    console.error('login error:', error.message);
    res.status(500).json({ error: 'Unable to sign in' });
  }
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  req.session.destroy(error => {
    if (error) return res.status(500).json({ error: 'Unable to sign out' });
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
});

app.get('/api/workspace', requireAuth, async (req, res) => {
  const workspace = await getUserWorkspace(req.session.user.id);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  res.json(workspace);
});

app.patch('/api/workspace', requireAuth, async (req, res) => {
  const workspace = await getUserWorkspace(req.session.user.id);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  const allowed = ['name', 'category', 'address', 'phone', 'instagram', 'monthly_budget'];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
      values.push(key === 'monthly_budget' ? Number(req.body[key]) || 0 : req.body[key]);
      updates.push(`${key} = $${values.length}`);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(workspace.id);
  const result = await pool.query(
    `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING id,name,category,address,phone,instagram,monthly_budget`,
    values
  );
  res.json(result.rows[0]);
});

async function campaignBusinessId(req) {
  const workspace = await getUserWorkspace(req.session.user.id);
  return workspace?.id || null;
}

app.get('/api/campaigns', requireAuth, async (req, res) => {
  try {
    const businessId = await campaignBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Workspace not found' });
    const result = await pool.query(
      `SELECT id, name, platform, objective, budget, spent, leads, sales, status, start_date, end_date, created_at
       FROM campaigns WHERE business_id = $1 ORDER BY created_at DESC, id DESC`,
      [businessId]
    );
    res.json({ campaigns: result.rows });
  } catch (error) {
    console.error('campaign list error:', error.message);
    res.status(500).json({ error: 'Unable to load campaigns' });
  }
});

app.post('/api/campaigns', requireAuth, async (req, res) => {
  try {
    const businessId = await campaignBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Workspace not found' });
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const platform = String(body.platform || '').trim();
    const objective = String(body.objective || '').trim();
    const budget = Number(body.budget);
    if (!name || !platform || !objective || !Number.isFinite(budget) || budget < 0) {
      return res.status(400).json({ error: 'name, platform, objective and a valid budget are required' });
    }
    const result = await pool.query(
      `INSERT INTO campaigns(business_id, name, platform, objective, budget, spent, leads, sales, status, start_date, end_date)
       VALUES($1,$2,$3,$4,$5,0,0,0,$6,$7,$8)
       RETURNING id, name, platform, objective, budget, spent, leads, sales, status, start_date, end_date, created_at`,
      [businessId, name, platform, objective, budget, String(body.status || 'active'), body.start_date || null, body.end_date || null]
    );
    res.status(201).json({ campaign: result.rows[0] });
  } catch (error) {
    console.error('campaign create error:', error.message);
    res.status(500).json({ error: 'Unable to create campaign' });
  }
});

app.patch('/api/campaigns/:id', requireAuth, async (req, res) => {
  try {
    const businessId = await campaignBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Workspace not found' });
    const allowed = ['name', 'platform', 'objective', 'budget', 'spent', 'leads', 'sales', 'status', 'start_date', 'end_date'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (!Object.prototype.hasOwnProperty.call(req.body || {}, key)) continue;
      let value = req.body[key];
      if (['budget', 'spent'].includes(key)) value = Number(value);
      if (['leads', 'sales'].includes(key)) value = Number.parseInt(value, 10);
      if (['budget', 'spent'].includes(key) && (!Number.isFinite(value) || value < 0)) return res.status(400).json({ error: `${key} must be a non-negative number` });
      if (['leads', 'sales'].includes(key) && (!Number.isInteger(value) || value < 0)) return res.status(400).json({ error: `${key} must be a non-negative integer` });
      if (['name', 'platform', 'objective', 'status'].includes(key)) value = String(value).trim();
      updates.push(`${key} = $${values.length + 1}`);
      values.push(value === '' ? null : value);
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    values.push(businessId, req.params.id);
    const result = await pool.query(
      `UPDATE campaigns SET ${updates.join(', ')} WHERE business_id = $${values.length - 1} AND id = $${values.length}
       RETURNING id, name, platform, objective, budget, spent, leads, sales, status, start_date, end_date, created_at`,
      values
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ campaign: result.rows[0] });
  } catch (error) {
    console.error('campaign update error:', error.message);
    res.status(500).json({ error: 'Unable to update campaign' });
  }
});

app.delete('/api/campaigns/:id', requireAuth, async (req, res) => {
  try {
    const businessId = await campaignBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Workspace not found' });
    const result = await pool.query('DELETE FROM campaigns WHERE business_id = $1 AND id = $2 RETURNING id', [businessId, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Campaign not found' });
    res.status(204).end();
  } catch (error) {
    console.error('campaign delete error:', error.message);
    res.status(500).json({ error: 'Unable to delete campaign' });
  }
});

app.get('/', (req, res) => res.type('html').send(appHtml));
app.get('/app', (req, res) => res.type('html').send(appHtml));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: isProduction ? '1d' : 0 }));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

(async () => {
  await initDb();
  await seedDemo();
  app.listen(PORT, () => console.log(`Marketing Hub API running on port ${PORT}`));
})().catch(error => {
  console.error(error);
  process.exit(1);
});
