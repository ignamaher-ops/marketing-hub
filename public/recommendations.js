(() => {
  'use strict';
  if (window.__mhDashboardV2Loaded) return;
  window.__mhDashboardV2Loaded = true;

  const money = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR');
  const num = n => Number(n) || 0;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function getData() {
    const d = window.DB || {};
    const campaigns = Array.isArray(d.campaigns) ? d.campaigns : [];
    const customers = Array.isArray(d.customers) ? d.customers : [];
    const reviews = Array.isArray(d.reviews) ? d.reviews : [];
    const content = Array.isArray(d.content) ? d.content : [];
    const spend = campaigns.reduce((a,c) => a + num(c.spent), 0);
    const sales = campaigns.reduce((a,c) => a + num(c.sales), 0);
    const queries = campaigns.reduce((a,c) => a + num(c.queries ?? c.leads), 0);
    const conversion = queries ? sales / queries * 100 : 0;
    const pending = reviews.filter(r => /pending|sin responder/i.test(String(r.status || ''))).length;
    const inactive = customers.filter(c => /inactive|inactivo/i.test(String(c.status || ''))).length;
    return { d, campaigns, customers, reviews, content, spend, sales, queries, conversion, pending, inactive };
  }

  function css() {
    if (document.getElementById('mh-dashboard-v2-style')) return;
    const s = document.createElement('style');
    s.id = 'mh-dashboard-v2-style';
    s.textContent = `
      #mh-dashboard-v2{--p:#5b4cf5;--p2:#eeeaff;--ink:#17182e;--muted:#74758b;--line:#e7e7f0;--bg:#f6f6fa;display:grid;gap:18px}
      #mh-dashboard-v2 *{box-sizing:border-box}
      .mhv-hero{position:relative;overflow:hidden;background:linear-gradient(135deg,#17182e,#30295b 62%,#5b4cf5);color:#fff;border-radius:24px;padding:28px 30px;display:flex;justify-content:space-between;gap:25px;align-items:flex-end;box-shadow:0 18px 42px rgba(35,29,85,.16)}
      .mhv-hero:after{content:'';position:absolute;width:220px;height:220px;border-radius:50%;right:-70px;top:-100px;background:rgba(255,255,255,.07)}
      .mhv-copy{position:relative;z-index:1}.mhv-kicker{font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;opacity:.68}.mhv-hero h1{font-family:Sora,sans-serif;font-size:28px;line-height:1.15;margin-top:7px}.mhv-hero p{font-size:13px;line-height:1.55;opacity:.8;max-width:650px;margin-top:9px}.mhv-status{display:inline-flex;align-items:center;gap:7px;margin-top:16px;padding:7px 10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.1);border-radius:999px;font-size:10px;font-weight:800}.mhv-dot{width:7px;height:7px;border-radius:50%;background:#ffd36b}.mhv-actions{position:relative;z-index:1;display:flex;gap:8px;flex-wrap:wrap}.mhv-btn{border:0;border-radius:11px;padding:11px 14px;font-size:11px;font-weight:800;cursor:pointer}.mhv-btn.primary{background:#fff;color:#29244e}.mhv-btn.ghost{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:#fff}
      .mhv-heading{display:flex;justify-content:space-between;align-items:end;gap:15px;margin-bottom:11px}.mhv-heading h2{font-family:Sora,sans-serif;font-size:17px}.mhv-heading p{font-size:11px;color:var(--muted);margin-top:4px}.mhv-info{width:18px;height:18px;border:1px solid #c9c9dc;border-radius:50%;display:inline-grid;place-items:center;font-size:10px;color:#68697e;background:#fff;margin-left:5px;cursor:help}
      .mhv-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}.mhv-kpi{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;transition:.18s ease}.mhv-kpi:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(20,21,43,.07)}.mhv-label{font-size:10px;font-weight:800;color:var(--muted)}.mhv-value{font-family:Sora,sans-serif;font-size:25px;font-weight:800;margin-top:8px}.mhv-value.good{color:#17845b}.mhv-value.warn{color:#b87310}.mhv-foot{font-size:10px;color:var(--muted);margin-top:5px}
      .mhv-grid{display:grid;grid-template-columns:1.45fr .85fr;gap:16px}.mhv-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:19px}.mhv-card-title{font-family:Sora,sans-serif;font-size:15px;font-weight:800}.mhv-card-sub{font-size:11px;color:var(--muted);margin-top:4px}.mhv-list{display:grid;gap:9px;margin-top:15px}
      .mhv-campaign{border:1px solid var(--line);border-radius:13px;padding:13px;cursor:pointer;transition:.18s ease}.mhv-campaign:hover,.mhv-campaign.open{border-color:#d1ccff;background:#fcfbff}.mhv-camp-top{display:flex;justify-content:space-between;gap:12px}.mhv-camp-name{font-size:12px;font-weight:800}.mhv-camp-meta{font-size:10px;color:var(--muted);margin-top:4px}.mhv-camp-result{font-size:11px;font-weight:800}.mhv-bar{height:7px;background:#f0f0f5;border-radius:99px;overflow:hidden;margin-top:10px}.mhv-bar span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#9a8fff,#5b4cf5)}.mhv-detail{display:none;border-top:1px solid var(--line);margin-top:10px;padding-top:10px;font-size:10px;line-height:1.5;color:var(--muted)}.mhv-campaign.open .mhv-detail{display:block}.mhv-detail button{margin-top:8px;border:0;border-radius:9px;background:var(--p2);color:var(--p);padding:7px 9px;font-size:10px;font-weight:800;cursor:pointer}
      .mhv-insight{border:1px solid var(--line);border-radius:13px;padding:14px;margin-top:10px;cursor:pointer}.mhv-insight:first-child{margin-top:15px}.mhv-insight:hover{background:#faf9ff;border-color:#d7d2ff}.mhv-insight-label{font-size:9px;text-transform:uppercase;letter-spacing:.07em;font-weight:800;color:var(--p)}.mhv-insight strong{display:block;font-size:12px;margin-top:4px}.mhv-insight p{font-size:10px;line-height:1.5;color:var(--muted);margin-top:5px}.mhv-insight-action{font-size:10px;font-weight:800;color:var(--p);margin-top:8px}
      .mhv-recs{display:grid;gap:9px}.mhv-rec{display:grid;grid-template-columns:29px 1fr auto;gap:10px;align-items:start;border:1px solid var(--line);border-radius:13px;padding:13px;transition:.18s ease}.mhv-rec:hover{border-color:#d0cbff;background:#fcfbff}.mhv-num{width:29px;height:29px;border-radius:9px;background:var(--p2);color:var(--p);display:grid;place-items:center;font-size:11px;font-weight:900}.mhv-rec strong{font-size:12px}.mhv-rec p{font-size:10px;line-height:1.45;color:var(--muted);margin-top:4px}.mhv-rec button{border:0;background:var(--p2);color:var(--p);border-radius:9px;padding:8px 10px;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap}.mhv-rec button:hover{background:var(--p);color:#fff}
      .mhv-ai{background:linear-gradient(135deg,#f0edff,#fff);border:1px solid #ddd8ff;border-radius:18px;padding:19px;display:flex;justify-content:space-between;align-items:center;gap:20px}.mhv-ai h2{font-family:Sora,sans-serif;font-size:15px}.mhv-ai p{font-size:11px;line-height:1.5;color:var(--muted);margin-top:5px}.mhv-prompts{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.mhv-prompt{border:1px solid #d9d5ff;background:#fff;color:#4d42c9;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:700;cursor:pointer}.mhv-prompt:hover{background:var(--p);border-color:var(--p);color:#fff}.mhv-ai-open{border:0;background:var(--p);color:#fff;border-radius:11px;padding:11px 14px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
      .mhv-next{background:#fff;border:1px solid var(--line);border-radius:18px;padding:19px}.mhv-next-row{display:grid;grid-template-columns:32px 1fr auto;gap:11px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}.mhv-next-row:last-child{border-bottom:0;padding-bottom:0}.mhv-next-num{width:30px;height:30px;border-radius:9px;background:#f3f2f8;display:grid;place-items:center;font-size:11px;font-weight:900}.mhv-next strong{font-size:11px}.mhv-next span{display:block;font-size:10px;color:var(--muted);margin-top:3px}.mhv-next button{border:0;background:#f3f1ff;color:var(--p);border-radius:8px;padding:7px 9px;font-size:10px;font-weight:800;cursor:pointer}
      @media(max-width:1050px){.mhv-kpis{grid-template-columns:repeat(2,1fr)}.mhv-grid{grid-template-columns:1fr}}
      @media(max-width:650px){.mhv-hero{display:block;padding:22px}.mhv-hero h1{font-size:23px}.mhv-actions{margin-top:17px}.mhv-kpis{grid-template-columns:1fr 1fr}.mhv-card,.mhv-next{padding:15px}.mhv-rec{grid-template-columns:29px 1fr}.mhv-rec button{grid-column:2;justify-self:start}.mhv-ai{display:block}.mhv-ai-open{margin-top:14px}.mhv-heading{display:block}.mhv-heading>div:last-child{margin-top:9px}}
    `;
    document.head.appendChild(s);
  }

  function openAI(prompt) {
    const trigger = document.querySelector('#marketing-agent-trigger,[data-action="open-marketing-agent"]');
    if (!trigger) return;
    trigger.click();
    setTimeout(() => {
      const input = document.querySelector('#marketing-agent-input,#ai-message');
      if (input && prompt) { input.value = prompt; input.focus(); }
    }, 180);
  }

  function render() {
    if (typeof currentPage === 'undefined' || currentPage !== 'dashboard') return;
    const view = document.getElementById('view');
    if (!view || !window.DB || !Array.isArray(DB.campaigns) || view.querySelector('#mh-dashboard-v2')) return;

    const x = getData();
    const business = x.d?.business?.name || x.d?.businessName || 'tu negocio';
    const sorted = [...x.campaigns].sort((a,b) => num(b.sales) - num(a.sales));
    const best = sorted.find(c => num(c.sales) > 0);
    const weak = x.campaigns.find(c => num(c.spent) > 0 && num(c.sales) === 0);
    const status = weak ? 'Encontramos algo que conviene revisar' : x.pending ? 'Hay tareas pendientes que pueden mejorar el negocio' : 'Marketing Hub está monitoreando el negocio';
    const maxSales = Math.max(...x.campaigns.map(c => num(c.sales)), 1);

    const recs = [];
    if (best) recs.push({title:`Potenciá “${best.name}”`,text:`Generó ${best.sales} ventas con ${money(best.spent)} de inversión.`,prompt:`¿Por qué conviene potenciar la campaña ${best.name}?`});
    if (weak) recs.push({title:`Revisá “${weak.name}”`,text:`Gastó ${money(weak.spent)} y todavía no registra ventas.`,prompt:`Analizá la campaña ${weak.name} y decime qué debería corregir.`});
    if (x.pending) recs.push({title:'Respondé las reseñas pendientes',text:`Hay ${x.pending} reseña${x.pending === 1 ? '' : 's'} sin responder.`,prompt:'¿Cómo debería manejar las reseñas pendientes?'});
    if (x.inactive && recs.length < 3) recs.push({title:'Reactivá clientes inactivos',text:`Hay ${x.inactive} cliente${x.inactive === 1 ? '' : 's'} que ya conocen el negocio.`,prompt:'¿Cómo puedo reactivar mis clientes inactivos?'});
    if (!recs.length) recs.push({title:'Seguí registrando resultados',text:'Todavía no hay una señal suficientemente fuerte para priorizar una acción.',prompt:'¿Qué datos debería empezar a medir?'});

    const campaigns = x.campaigns.slice().sort((a,b) => num(b.sales) - num(a.sales)).map(c => {
      const sales = num(c.sales), spent = num(c.spent), queries = num(c.queries ?? c.leads);
      const cost = sales ? spent / sales : 0;
      const width = Math.max(5, Math.min(100, sales / maxSales * 100));
      return `<div class="mhv-campaign" tabindex="0" data-campaign="${esc(c.name)}"><div class="mhv-camp-top"><div><div class="mhv-camp-name">${esc(c.name)}</div><div class="mhv-camp-meta">${money(spent)} invertidos · ${queries} consultas</div></div><div class="mhv-camp-result">${sales} ventas</div></div><div class="mhv-bar"><span style="width:${width}%"></span></div><div class="mhv-detail">${sales ? `Cada venta costó aproximadamente ${money(cost)} en publicidad.` : 'La campaña consumió presupuesto sin registrar ventas todavía.'}<br><button data-mhv-ai="Analizá la campaña ${esc(c.name)} y decime qué debería hacer.">Preguntarle a la IA</button></div></div>`;
    }).join('');

    const recHtml = recs.slice(0,3).map((r,i) => `<div class="mhv-rec"><div class="mhv-num">${i+1}</div><div><strong>${esc(r.title)}</strong><p>${esc(r.text)}</p></div><button data-mhv-ai="${esc(r.prompt)}">Ver por qué</button></div>`).join('');

    view.innerHTML = `<div id="mh-dashboard-v2">
      <section class="mhv-hero"><div class="mhv-copy"><div class="mhv-kicker">Resumen del negocio</div><h1>Hola. Así está ${esc(business)}.</h1><p>Revisamos tus resultados y te mostramos primero lo que puede mover el negocio. No necesitás saber marketing para entenderlo.</p><div class="mhv-status"><span class="mhv-dot"></span>${esc(status)}</div></div><div class="mhv-actions"><button class="mhv-btn primary" data-mhv-ai="¿Qué debería hacer hoy para mejorar el negocio?">¿Qué hago hoy?</button><button class="mhv-btn ghost" data-mhv-scroll="mhv-campaign-card">Ver campañas</button></div></section>

      <section><div class="mhv-heading"><div><h2>Tu negocio en números <span class="mhv-info" title="Estos datos sirven como punto de partida para las recomendaciones.">i</span></h2><p>Solo lo que necesitás para saber cómo viene el negocio.</p></div></div><div class="mhv-kpis">
        <div class="mhv-kpi"><div class="mhv-label">Ventas</div><div class="mhv-value ${x.sales ? 'good' : ''}">${x.sales}</div><div class="mhv-foot">ventas registradas</div></div>
        <div class="mhv-kpi"><div class="mhv-label">Consultas</div><div class="mhv-value ${x.queries ? 'good' : ''}">${x.queries}</div><div class="mhv-foot">personas interesadas</div></div>
        <div class="mhv-kpi"><div class="mhv-label">Inversión</div><div class="mhv-value warn">${money(x.spend)}</div><div class="mhv-foot">en campañas</div></div>
        <div class="mhv-kpi"><div class="mhv-label">De consulta a venta</div><div class="mhv-value ${x.conversion >= 25 ? 'good' : 'warn'}">${x.conversion.toFixed(1)}%</div><div class="mhv-foot">de las consultas registradas</div></div>
      </div></section>

      <section class="mhv-grid"><div class="mhv-card" id="mhv-campaign-card"><div class="mhv-card-title">¿Qué está funcionando?</div><div class="mhv-card-sub">Tocá una campaña para entender el resultado.</div><div class="mhv-list">${campaigns || '<div class="mhv-insight"><strong>Todavía no hay campañas registradas.</strong><p>Cuando conectemos una fuente de publicidad, Marketing Hub podrá empezar a comparar resultados.</p></div>'}</div></div>
        <div class="mhv-card"><div class="mhv-card-title">¿Qué merece atención?</div><div class="mhv-card-sub">Las señales que Marketing Hub priorizaría.</div>
          ${weak ? `<div class="mhv-insight" data-mhv-ai="Analizá la campaña ${esc(weak.name)} y explicame qué problema ves."><div class="mhv-insight-label">Atención</div><strong>${esc(weak.name)} no está generando ventas</strong><p>Ya gastó ${money(weak.spent)} y todavía no registra ventas.</p><div class="mhv-insight-action">Entender el problema →</div></div>` : ''}
          ${x.pending ? `<div class="mhv-insight" data-mhv-ai="¿Qué debería hacer con mis ${x.pending} reseñas pendientes?"><div class="mhv-insight-label">Reputación</div><strong>${x.pending} reseñas esperan respuesta</strong><p>Responderlas puede ayudarte a cuidar la relación con tus clientes.</p><div class="mhv-insight-action">Ver qué hacer →</div></div>` : ''}
          ${x.inactive ? `<div class="mhv-insight" data-mhv-ai="¿Cómo puedo reactivar mis clientes inactivos?"><div class="mhv-insight-label">Oportunidad</div><strong>${x.inactive} clientes están inactivos</strong><p>Ya conocen el negocio: pueden ser una oportunidad de reactivación.</p><div class="mhv-insight-action">Ver oportunidad →</div></div>` : ''}
          ${!weak && !x.pending && !x.inactive ? `<div class="mhv-insight"><div class="mhv-insight-label">Estado</div><strong>No hay alertas fuertes por ahora.</strong><p>Seguí registrando resultados para que Marketing Hub pueda detectar oportunidades.</p></div>` : ''}
        </div></section>

      <section class="mhv-card"><div class="mhv-heading"><div><h2>Recomendaciones <span class="mhv-info" title="Marketing Hub cruza tus datos y prioriza acciones según el posible impacto comercial.">i</span></h2><p>Qué conviene hacer ahora.</p></div></div><div class="mhv-recs">${recHtml}</div></section>

      <section class="mhv-next"><div class="mhv-heading"><div><h2>¿Qué haría primero?</h2><p>Un orden simple para no perder tiempo.</p></div></div>
        ${recs.slice(0,3).map((r,i)=>`<div class="mhv-next-row"><div class="mhv-next-num">${i+1}</div><div><strong>${esc(r.title)}</strong><span>${esc(r.text)}</span></div><button data-mhv-ai="${esc(r.prompt)}">Preguntar</button></div>`).join('')}
      </section>

      <section class="mhv-ai"><div><h2>Marketing Manager AI</h2><p>¿No entendés por qué aparece una recomendación? Preguntale. El agente cruza los datos del negocio y te explica qué está pasando.</p><div class="mhv-prompts"><button class="mhv-prompt" data-mhv-ai="¿Qué problema ves en mis ventas?">Problema en ventas</button><button class="mhv-prompt" data-mhv-ai="¿Cuál es mi mejor campaña y por qué?">Mejor campaña</button><button class="mhv-prompt" data-mhv-ai="¿Qué debería hacer esta semana?">Plan semanal</button></div></div><button class="mhv-ai-open" data-mhv-ai="¿Qué debería hacer hoy para mejorar el negocio?">Hablar con el agente</button></section>
    </div>`;

    view.querySelectorAll('[data-mhv-ai]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); openAI(el.dataset.mhvAi); }));
    view.querySelectorAll('.mhv-campaign').forEach(el => el.addEventListener('click', () => el.classList.toggle('open')));
    view.querySelectorAll('[data-mhv-scroll]').forEach(el => el.addEventListener('click', () => document.getElementById(el.dataset.mhvScroll)?.scrollIntoView({behavior:'smooth',block:'start'})));
  }

  function start() {
    css();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
  const observer = new MutationObserver(() => render());
  observer.observe(document.body, {childList:true, subtree:true});
})();
