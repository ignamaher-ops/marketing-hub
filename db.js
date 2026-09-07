const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS businesses (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Negocio', address TEXT, phone TEXT, instagram TEXT, monthly_budget NUMERIC(12,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS users (id BIGSERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS memberships (user_id BIGINT REFERENCES users(id) ON DELETE CASCADE, business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE, role TEXT NOT NULL DEFAULT 'owner', PRIMARY KEY(user_id,business_id));
    CREATE TABLE IF NOT EXISTS campaigns (id BIGSERIAL PRIMARY KEY, business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE NOT NULL, name TEXT NOT NULL, platform TEXT NOT NULL, objective TEXT NOT NULL, budget NUMERIC(12,2) NOT NULL DEFAULT 0, spent NUMERIC(12,2) NOT NULL DEFAULT 0, leads INTEGER NOT NULL DEFAULT 0, sales INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', start_date DATE, end_date DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS customers (id BIGSERIAL PRIMARY KEY, business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE NOT NULL, name TEXT NOT NULL, phone TEXT, email TEXT, status TEXT NOT NULL DEFAULT 'new', purchases INTEGER NOT NULL DEFAULT 0, total_spent NUMERIC(12,2) NOT NULL DEFAULT 0, last_purchase DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS content (id BIGSERIAL PRIMARY KEY, business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE NOT NULL, title TEXT NOT NULL, type TEXT NOT NULL, platform TEXT NOT NULL, scheduled_date DATE, status TEXT NOT NULL DEFAULT 'draft', copy TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS reviews (id BIGSERIAL PRIMARY KEY, business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE NOT NULL, customer_name TEXT NOT NULL, rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), comment TEXT, status TEXT NOT NULL DEFAULT 'pending', response TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS promotions (id BIGSERIAL PRIMARY KEY, business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE NOT NULL, title TEXT NOT NULL, code TEXT NOT NULL, discount TEXT NOT NULL, start_date DATE, end_date DATE, uses INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE INDEX IF NOT EXISTS idx_campaigns_business ON campaigns(business_id);
    CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
    CREATE INDEX IF NOT EXISTS idx_content_business ON content(business_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
    CREATE INDEX IF NOT EXISTS idx_promotions_business ON promotions(business_id);
  `);
}

async function seedDemo() {
  if (process.env.SEED_DEMO !== 'true') return;
  const existing = await pool.query('SELECT id FROM users WHERE email=$1', ['demo@marketinghub.local']);
  if (existing.rowCount) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash('MarketingHubDemo!2026', 12);
    const u = (await client.query('INSERT INTO users(email,password_hash,name) VALUES($1,$2,$3) RETURNING id', ['demo@marketinghub.local', hash, 'Demo Admin'])).rows[0];
    const b = (await client.query('INSERT INTO businesses(name,category,monthly_budget) VALUES($1,$2,$3) RETURNING id', ['La Esquina','Restaurante',230000])).rows[0];
    await client.query('INSERT INTO memberships(user_id,business_id,role) VALUES($1,$2,$3)', [u.id,b.id,'owner']);

    const campaigns = [
      ['20% OFF clientes nuevos','Instagram','Conseguir clientes',90000,72400,93,27,'active','2026-09-01','2026-09-30'],
      ['Delivery general','Facebook','Ventas',70000,58500,51,14,'active','2026-09-01','2026-09-30'],
      ['Alcance zona norte','Instagram','Reconocimiento',40000,38000,8,2,'active','2026-09-01','2026-09-30'],
      ['Promo viernes - video','Facebook','Ventas',30000,27500,4,0,'paused','2026-09-03','2026-09-12']
    ];
    for (const c of campaigns) {
      await client.query('INSERT INTO campaigns(business_id,name,platform,objective,budget,spent,leads,sales,status,start_date,end_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[b.id,...c]);
    }

    const customers = [
      ['Juan Pérez','+54 11 4444-1111','juan@email.com','frequent',8,184000,'2026-09-01'],
      ['Pedro López','+54 11 4444-3333','pedro@email.com','inactive',5,92000,'2026-06-12'],
      ['Mariana Ruiz','+54 11 4444-2222','mariana@email.com','active',4,76000,'2026-08-28'],
      ['Sofía García','+54 11 4444-5555','sofia@email.com','frequent',7,158000,'2026-09-03'],
      ['Lucas Fernández','+54 11 4444-6666','lucas@email.com','inactive',3,51000,'2026-05-20'],
      ['Carla Gómez','+54 11 4444-7777','carla@email.com','active',2,39000,'2026-08-22'],
      ['Nicolás Díaz','+54 11 4444-8888','nico@email.com','new',1,18000,'2026-09-05'],
      ['Valentina Torres','+54 11 4444-9999','vale@email.com','inactive',4,67000,'2026-06-30']
    ];
    for (const c of customers) {
      await client.query('INSERT INTO customers(business_id,name,phone,email,status,purchases,total_spent,last_purchase) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[b.id,...c]);
    }

    const content = [
      ['Reel: plato estrella','Reel','Instagram','2026-09-04','published'],
      ['Story: cocina en vivo','Story','Instagram','2026-09-05','published'],
      ['Post: menú de la semana','Post','Instagram','2026-09-06','published'],
      ['Promo delivery','Post','Facebook','2026-09-08','scheduled'],
      ['Reel: detrás de escena','Reel','Instagram','2026-09-10','scheduled'],
      ['Story: encuesta de sabores','Story','Instagram','2026-09-11','scheduled'],
      ['Mensaje: clientes inactivos','Mensaje','WhatsApp','2026-09-12','draft'],
      ['Post: reseñas de clientes','Post','Instagram','2026-09-13','draft']
    ];
    for (const c of content) {
      await client.query('INSERT INTO content(business_id,title,type,platform,scheduled_date,status) VALUES($1,$2,$3,$4,$5,$6)',[b.id,...c]);
    }

    const reviews = [
      ['Martín',4,'Muy rico, volvería.','pending',null],
      ['Sofía',5,'Excelente comida y atención.','answered','¡Muchas gracias, Sofía!'],
      ['Agustina',3,'La comida estuvo bien pero tardaron bastante.','pending',null],
      ['Tomás',2,'El pedido llegó frío.','pending',null],
      ['Valeria',5,'Todo excelente, especialmente la atención.','answered','¡Gracias por elegirnos, Valeria!']
    ];
    for (const r of reviews) {
      await client.query('INSERT INTO reviews(business_id,customer_name,rating,comment,status,response) VALUES($1,$2,$3,$4,$5,$6)',[b.id,...r]);
    }

    const promotions = [
      ['20% primera compra','NUEVO20','20%','2026-09-01','2026-09-30',27,'active'],
      ['2x1 viernes','VIERNES2X1','2x1','2026-09-05','2026-09-30',11,'active']
    ];
    for (const p of promotions) {
      await client.query('INSERT INTO promotions(business_id,title,code,discount,start_date,end_date,uses,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[b.id,...p]);
    }

    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
module.exports = { pool, initDb, seedDemo };