/*
 * Marketing Manager AI backend.
 * Loaded before server.js so the existing Express app can stay small and stable.
 * The route is inserted immediately before the final 404 middleware.
 */
const express = require('express');
const { pool } = require('./db');

if (express.application.__marketingAiPatched) return;
express.application.__marketingAiPatched = true;

const MAX_HISTORY = 8;
const MAX_MESSAGE = 2000;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

function clean(value, max = 240) {
  const s = String(value ?? '').trim();
  return s.length > max ? s.slice(0, max) : s;
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildDemoAnswer(question, data) {
  const q = question.toLowerCase();
  const { workspace, campaigns, customers, content, reviews, promotions } = data;
  const spend = campaigns.reduce((a, c) => a + num(c.spent), 0);
  const sales = campaigns.reduce((a, c) => a + num(c.sales), 0);
  const leads = campaigns.reduce((a, c) => a + num(c.leads), 0);
  const budget = campaigns.reduce((a, c) => a + num(c.budget), 0);
  const pending = reviews.filter(r => r.status === 'pending').length;
  const inactive = customers.filter(c => c.status === 'inactive').length;
  const conversion = leads ? (sales / leads) * 100 : 0;
  const best = [...campaigns].sort((a, b) => (num(b.sales) / Math.max(num(b.spent), 1)) - (num(a.sales) / Math.max(num(a.spent), 1)))[0];

  if (q.includes('venta') || q.includes('ventas')) {
    return `En ${workspace.name}, las campañas registran ${sales} ventas a partir de ${leads} consultas, una conversión aproximada de ${conversion.toFixed(1)}%. Se invirtieron $${Math.round(spend).toLocaleString('es-AR')} sobre un presupuesto de $${Math.round(budget).toLocaleString('es-AR')}. ${best ? `La campaña con mejor relación ventas/inversión es “${best.name}”, con ${best.sales} ventas y $${Math.round(best.spent).toLocaleString('es-AR')} gastados.` : ''}\n\nMi lectura: antes de aumentar presupuesto, conviene identificar qué parte del proceso convierte mejor y replicarla.`;
  }
  if (q.includes('contenido') || q.includes('instagram') || q.includes('public') || q.includes('reel')) {
    const published = content.filter(c => c.status === 'published').length;
    const scheduled = content.filter(c => c.status === 'scheduled').length;
    return `Hay ${content.length} piezas de contenido registradas: ${published} publicadas y ${scheduled} programadas. El dato importante no es solo publicar más, sino relacionar cada pieza con alcance, consultas y ventas cuando conectemos las redes reales.\n\nRecomendación: mantené una cadencia semanal y medí qué formatos generan acciones comerciales, no solamente likes.`;
  }
  if (q.includes('cliente') || q.includes('fidel') || q.includes('reactiv')) {
    return `Hay ${customers.length} clientes registrados y ${inactive} marcados como inactivos. Es una oportunidad porque ya existe una relación previa con esas personas.\n\nRecomendación: crear una campaña de reactivación con una oferta específica y medir compras recuperadas, costo por reactivación y ticket promedio.`;
  }
  if (q.includes('reseña') || q.includes('reput')) {
    return `Hay ${reviews.length} reseñas y ${pending} pendientes de respuesta. Una reseña sin responder es una oportunidad de atención que todavía no aprovechaste.\n\nPrioridad: responder primero las negativas o de 3 estrellas o menos y detectar temas que se repitan.`;
  }
  if (q.includes('campaña') || q.includes('publicidad') || q.includes('ads')) {
    const weak = campaigns.find(c => num(c.spent) > 0 && num(c.sales) === 0);
    return `${campaigns.length} campañas están registradas. La inversión acumulada es $${Math.round(spend).toLocaleString('es-AR')} y generó ${leads} consultas y ${sales} ventas. ${weak ? `Hay una alerta: “${weak.name}” ya gastó $${Math.round(weak.spent).toLocaleString('es-AR')} y registra 0 ventas.` : 'No detecto una campaña sin ventas en los datos disponibles.'}\n\nRecomendación: distribuir presupuesto según ventas generadas y no solo según cantidad de consultas.`;
  }
  return `Soy el Marketing Manager de ${workspace.name}. Puedo analizar campañas, ventas, clientes, contenido, reseñas y promociones.\n\nCon los datos actuales veo ${campaigns.length} campañas, ${sales} ventas, ${leads} consultas, ${customers.length} clientes y ${pending} reseñas pendientes.\n\nPreguntame, por ejemplo: “¿por qué debería aumentar el presupuesto de una campaña?”, “¿qué problema ves en mis ventas?” o “¿qué debería hacer esta semana?”.`;
}

async function loadContext(userId) {
  const workspaceResult = await pool.query(`SELECT b.id,b.name,b.category,b.monthly_budget FROM businesses b JOIN memberships m ON m.business_id=b.id WHERE m.user_id=$1 ORDER BY b.created_at ASC LIMIT 1`, [userId]);
  const workspace = workspaceResult.rows[0];
  if (!workspace) return null;
  const [campaigns, customers, content, reviews, promotions] = await Promise.all([
    pool.query(`SELECT name,platform,objective,budget,spent,leads,sales,status,start_date,end_date FROM campaigns WHERE business_id=$1 ORDER BY created_at DESC LIMIT 30`, [workspace.id]),
    pool.query(`SELECT name,status,purchases,total_spent,last_purchase FROM customers WHERE business_id=$1 ORDER BY created_at DESC LIMIT 50`, [workspace.id]),
    pool.query(`SELECT title,type,platform,scheduled_date,status FROM content WHERE business_id=$1 ORDER BY created_at DESC LIMIT 50`, [workspace.id]),
    pool.query(`SELECT customer_name,rating,comment,status,response FROM reviews WHERE business_id=$1 ORDER BY created_at DESC LIMIT 30`, [workspace.id]),
    pool.query(`SELECT title,code,discount,uses,status,start_date,end_date FROM promotions WHERE business_id=$1 ORDER BY created_at DESC LIMIT 30`, [workspace.id])
  ]);
  return { workspace, campaigns: campaigns.rows, customers: customers.rows, content: content.rows, reviews: reviews.rows, promotions: promotions.rows };
}

async function callOpenAI(question, history, data) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { answer: buildDemoAnswer(question, data), source: 'demo', model: null };

  const system = `Sos Marketing Manager, el director de marketing virtual de un pequeño negocio. Respondé siempre en español rioplatense claro y profesional. No inventes datos. Tu trabajo es cruzar datos y explicar: DATO -> ANÁLISIS -> CONCLUSIÓN -> RECOMENDACIÓN -> PRÓXIMA ACCIÓN. Si faltan datos, decilo explícitamente. Priorizá ventas, rentabilidad, clientes, conversión y oportunidades accionables por sobre métricas de vanidad. El usuario puede preguntar sobre estrategia, campañas, contenido, clientes, reputación y presupuesto. Negocio y datos actuales:\n${JSON.stringify(data)}`;
  const messages = [
    ...history.slice(-MAX_HISTORY).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: clean(m.content, 3000) })),
    { role: 'user', content: clean(question, MAX_MESSAGE) }
  ];

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      instructions: system,
      input: messages,
      store: false,
      max_output_tokens: 900
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('OpenAI Marketing Agent error:', response.status, detail.slice(0, 500));
    return { answer: buildDemoAnswer(question, data), source: 'demo-fallback', model: null };
  }
  const payload = await response.json();
  const answer = String(payload.output_text || '').trim();
  if (!answer) return { answer: buildDemoAnswer(question, data), source: 'demo-fallback', model: null };
  return { answer, source: 'openai', model: DEFAULT_MODEL };
}

const originalUse = express.application.use;
express.application.use = function patchedUse(...args) {
  const maybeFinal404 = args.length === 1 && typeof args[0] === 'function' && args[0].length === 2;
  if (maybeFinal404 && !this.__marketingAiRouteAdded) {
    this.__marketingAiRouteAdded = true;
    this.post('/api/ai/marketing', async (req, res) => {
      try {
        if (!req.session?.user) return res.status(401).json({ error: 'Authentication required' });
        const question = clean(req.body?.message, MAX_MESSAGE);
        if (!question) return res.status(400).json({ error: 'message is required' });
        const history = Array.isArray(req.body?.history) ? req.body.history : [];
        const data = await loadContext(req.session.user.id);
        if (!data) return res.status(404).json({ error: 'Workspace not found' });
        const result = await callOpenAI(question, history, data);
        res.json({ ...result, business: data.workspace.name });
      } catch (error) {
        console.error('Marketing Agent:', error.message);
        res.status(500).json({ error: 'No pude analizar los datos en este momento.' });
      }
    });
  }
  return originalUse.apply(this, args);
};
