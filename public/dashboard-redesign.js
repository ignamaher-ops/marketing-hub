(() => {
  'use strict';
  if (window.__mhDashboardRedesignLoaded) return;
  window.__mhDashboardRedesignLoaded = true;

  const money = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR');
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const num = n => Number(n) || 0;

  function css() {
    if (document.getElementById('mh-dashboard-redesign-style')) return;
    const style = document.createElement('style');
    style.id = 'mh-dashboard-redesign-style';
    style.textContent = `
      #mh-dashboard{--mh-purple:#5b4cf5;--mh-purple2:#eeeaff;--mh-ink:#17182e;--mh-muted:#74758b;--mh-line:#e8e8f1;--mh-bg:#f7f7fb;display:grid;gap:18px}
      #mh-dashboard *{box-sizing:border-box}
      .mh-hero{background:linear-gradient(135deg,#17182e 0%,#29244e 58%,#5b4cf5 100%);color:#fff;border-radius:22px;padding:27px 29px;display:flex;justify-content:space-between;gap:24px;align-items:flex-end;box-shadow:0 18px 45px rgba(38,31,100,.16)}
      .mh-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.1em;opacity:.7;font-weight:800;margin-bottom:7px}.mh-hero h1{font-size:27px;line-height:1.15;margin:0}.mh-hero p{font-size:13px;line-height:1.55;opacity:.8;margin-top:8px;max-width:620px}.mh-status{display:inline-flex;align-items:center;gap:7px;margin-top:17px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:7px 10px;font-size:11px;font-weight:800}.mh-status-dot{width:7px;height:7px;border-radius:50%;background:#ffcf66}.mh-hero-actions{display:flex;gap:9px;flex-wrap:wrap}.mh-hero-btn{border:0;border-radius:11px;padding:11px 14px;font-weight:800;font-size:12px}.mh-hero-btn.primary{background:#fff;color:#29244e}.mh-hero-btn.ghost{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2)}
      .mh-section-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:12px}.mh-section-head h2{font-size:17px;margin:0}.mh-section-head p{font-size:11px;color:var(--mh-muted);margin-top:4px}.mh-info{width:19px;height:19px;border:1px solid #c9c9dc;background:#fff;color:#696a80;border-radius:50%;display:inline-grid;place-items:center;font-size:10px;font-weight:800;margin-left:5px;vertical-align:middle;cursor:help}
      .mh-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.mh-kpi{background:#fff;border:1px solid var(--mh-line);border-radius:16px;padding:17px;transition:.18s ease}.mh-kpi:hover{transform:translateY(-2px);box-shadow:0 12px 25px rgba(20,21,43,.07);border-color:#d9d7ef}.mh-kpi-label{font-size:11px;color:var(--mh-muted);font-weight:700}.mh-kpi-value{font-family:Sora,sans-serif;font-size:24px;font-weight:800;margin-top:8px}.mh-kpi-foot{font-size:10px;color:var(--mh-muted);margin-top:5px}.mh-kpi.good .mh-kpi-value{color:#16845b}.mh-kpi.warn .mh-kpi-value{color:#b87310}.mh-kpi.neutral .mh-kpi-value{color:var(--mh-ink)}
      .mh-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(320px,.85fr);gap:16px}.mh-panel{background:#fff;border:1px solid var(--mh-line);border-radius:18px;padding:19px}.mh-panel-title{font-family:Sora,sans-serif;font-size:15px;font-weight:800}.mh-panel-sub{font-size:11px;color:var(--mh-muted);margin-top:4px}.mh-campaign-list{display:grid;gap:9px;margin-top:16px}.mh-campaign{border:1px solid var(--mh-line);border-radius:13px;padding:13px;cursor:pointer;transition:.18s ease}.mh-campaign:hover{border-color:#cfcafc;background:#fcfbff;transform:translateX(2px)}.mh-campaign-top{display:flex;justify-content:space-between;gap:10px}.mh-campaign-name{font-weight:800;font-size:12px}.mh-campaign-result{font-size:11px;font-weight:800}.mh-campaign-meta{font-size:10px;color:var(--mh-muted);margin-top:4px}.mh-bar{height:7px;background:#f0f0f5;border-radius:99px;overflow:hidden;margin-top:10px}.mh-bar span{height:100%;display:block;border-radius:inherit;background:linear-gradient(90deg,#9a8fff,#5b4cf5)}
      .mh-insights{display:grid;gap:9px;margin-top:16px}.mh-insight{border:1px solid var(--mh-line);border-radius:13px;padding:13px;cursor:pointer;transition:.18s ease}.mh-insight:hover{background:#faf9ff;border-color:#d6d2ff}.mh-insight strong{font-size:12px}.mh-insight p{font-size:10px;line-height:1.5;color:var(--mh-muted);margin-top:5px}.mh-insight .mh-action{font-size:10px;font-weight:800;color:var(--mh-purple);margin-top:8px}
      .mh-recommendations{display:grid;gap:9px}.mh-rec{display:grid;grid-template-columns:27px 1fr auto;gap:10px;align-items:start;padding:12px;border:1px solid var(--mh-line);border-radius:13px;transition:.18s ease}.mh-rec:hover{border-color:#cec9ff;background:#fcfbff}.mh-rec-num{width:27px;height:27px;border-radius:8px;background:var(--mh-purple2);color:var(--mh-purple);display:grid;place-items:center;font-weight:900;font-size:11px}.mh-rec strong{font-size:12px}.mh-rec p{font-size:10px;line-height:1.45;color:var(--mh-muted);margin-top:4px}.mh-rec button{border:0;background:#f3f1ff;color:var(--mh-purple);border-radius:9px;padding:7px 9px;font-size:10px;font-weight:800;white-space:nowrap}.mh-rec button:hover{background:var(--mh-purple);color:#fff}
      .mh-ai{background:linear-gradient(135deg,#f1efff,#fff);border:1px solid #ddd8ff;border-radius:18px;padding:20px;display:flex;align-items:center;justify-content:space-between;gap:18px}.mh-ai-copy strong{font-family:Sora,sans-serif;font-size:15px}.mh-ai-copy p{font-size:11px;color:var(--mh-muted);line-height:1.5;margin-top:5px}.mh-ai-prompts{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.mh-ai-prompt{border:1px solid #d9d5ff;background:#fff;color:#4e42cc;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:700;cursor:pointer}.mh-ai-prompt:hover{background:#5b4cf5;color:#fff;border-color:#5b4cf5}.mh-ai-open{border:0;background:#5b4cf5;color:#fff;border-radius:11px;padding:11px 14px;font-size:11px;font-weight:800;white-space:nowrap}
      .mh-detail{display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--mh-line);font-size:10px;color:var(--mh-muted);line-height:1.55}.mh-campaign.open .mh-detail{display:block}.mh-filter{display:flex;gap:5px;background:#f5f5fa;border:1px solid var(--mh-line);border-radius:10px;padding:3px}.mh-filter button{border:0;background:transparent;color:var(--mh-muted);padding:6px 9px;border-radius:7px;font-size:10px;font-weight:800}.mh-filter button.active{background:#fff;color:var(--mh-ink);box-shadow:0 1px 4px rgba(20,21,43,.08)}
      @media(max-width:1050px){.mh-kpis{grid-template-columns:repeat(2,1fr)}.mh-layout{grid-template-columns:1fr}.mh-hero{align-items:flex-start}}
      @media(max-width:650px){.mh-hero{padding:21px;display:block}.mh-hero h1{font-size:22px}.mh-hero-actions{margin-top:17px}.mh-kpis{grid-template-columns:1fr 1fr}.mh-panel{padding:15px}.mh-rec{grid-template-columns:27px 1fr}.mh-rec button{grid-column:2;justify-self:start}.mh-ai{display:block}.mh-ai-open{margin-top:14px}}
    `;
    document.head.appendChild(style);
  }

  function openAI(prompt) {
    const button = document.querySelector('#marketing-agent-trigger, [data-action="open-marketing-agent"]');
    if (button) { button.click(); setTimeout(() => { const input = document.querySelector('#marketing-agent-input, #ai-message'); if (input && prompt) { input.value = prompt; input.focus(); } }, 150); }
  }

  function data() {
    const d = window.DB || {};
    const campaigns = Array.isArray(d.campaigns) ? d.campaigns : [];
    const customers = Array.isArray(d.customers) ? d.customers : [];
    const reviews = Array.isArray(d.reviews) ? d.reviews : [];
    const content = Array.isArray(d.content) ? d.content : [];
    const spend = campaigns.reduce((a,c)=>a+num(c.spent),0);
    const sales = campaigns.reduce((a,c)=>a+num(c.sales),0);
    const queries = campaigns.reduce((a,c)=>a+num(c.queries ?? c.leads),0);
    const conversion = queries ? sales/queries*100 : 0;
    const pending = reviews.filter(r => /pending|sin responder/i.test(String(r.status||''))).length;
    const inactive = customers.filter(c => /inactive|inactivo/i.test(String(c.status||''))).length;
    const published = content.filter(c => /published|publicado/i.test(String(c.status||''))).length;
    return {d,campaigns,customers,reviews,content,spend,sales,queries,conversion,pending,inactive,published};
  }

  function render() {
    if (typeof currentPage === 'undefined' || currentPage !== 'dashboard') return;
    const view = document.getElementById('view');
    if (!view || !window.DB || !Array.isArray(DB.campaigns)) return;
    if (view.querySelector('#mh-dashboard')) return;

    const x = data();
    const sorted = [...x.campaigns].sort((a,b)=>num(b.sales)-num(a.sales));
    const best = sorted.find(c=>num(c.sales)>0);
    const weak = x.campaigns.find(c=>num(c.spent)>0 && num(c.sales)===0);
    const business = x.d?.business?.name || x.d?.businessName || 'tu negocio';
    const statusText = weak ? 'Hay una campaña que necesita atención' : x.pending ? 'Hay tareas pendientes para mejorar el negocio' : 'El negocio se está monitoreando';

    const recs = [];
    if (best) recs.push({title:`Potenciá “${best.name}”`,text:`Generó ${best.sales} ventas con ${money(best.spent)} de inversión.`,prompt:`¿Por qué conviene potenciar la campaña ${best.name}?`});
    if (weak) recs.push({title:`Revisá “${weak.name}”`,text:`Gastó ${money(weak.spent)} y todavía no registra ventas.`,prompt:`Analizá la campaña ${weak.name} y decime qué debería corregir.`});
    if (x.pending) recs.push({title:'Respondé las reseñas pendientes',text:`Hay ${x.pending} reseña${x.pending===1?'':'s'} sin responder.`,prompt:'¿Cómo debería manejar las reseñas pendientes?'});
    if (x.inactive && recs.length<3) recs.push({title:`Reactivá clientes inactivos`,text:`Hay ${x.inactive} cliente${x.inactive===1?'':'s'} que ya conocen el negocio.`,prompt:'¿Cómo puedo reactivar mis clientes inactivos?'});
    if (!recs.length) recs.push({title:'Seguí registrando resultados',text:'Todavía no hay suficientes señales para priorizar una acción.',prompt:'¿Qué datos debería empezar a medir?'});

    const maxSales = Math.max(...x.campaigns.map(c=>num(c.sales)),1);
    const campaignRows = x.campaigns.slice().sort((a,b)=>num(b.sales)-num(a.sales)).map((c,i)=>{
      const sales=num(c.sales), spent=num(c.spent), conv=spent?((sales/spent)*100).toFixed(1):'0.0';
      return `<div class="mh-campaign" tabindex="0" data-campaign="${esc(c.name)}"><div class="mh-campaign-top"><div><div class="mh-campaign-name">${esc(c.name)}</div><div class="mh-campaign-meta">${money(spent)} invertidos · ${num(c.queries ?? c.leads)} consultas</div></div><div class="mh-campaign-result">${sales} ventas</div></div><div class="mh-bar"><span style="width:${Math.max(5,Math.min(100,sales/maxSales*100))}%"></span></div><div class="mh-detail">Relación ventas / inversión: ${conv}% · Hacé clic para ver el detalle y preguntarle a la IA.</div></div>`;
    }).join('');

    view.innerHTML = `<div id="mh-dashboard">
      <section class="mh-hero">
        <div><div class="mh-kicker">Resumen del negocio</div><h1>Hola. Así está ${esc(business)}.</h1><p>Marketing Hub revisó tus campañas, consultas, ventas, clientes y reseñas para mostrarte qué merece atención primero.</p><div class="mh-status"><span class="mh-status-dot"></span>${esc(statusText)}</div></div>
        <div class="mh-hero-actions"><button class="mh-hero-btn primary" data-mh-ai="¿Qué debería hacer hoy para mejorar el negocio?">¿Qué hago hoy?</button><button class="mh-hero-btn ghost" data-mh-scroll="mh-campaign-panel">Ver campañas</button></div>
      </section>

      <section><div class="mh-section-head"><div><h2>Tu negocio en números <span class="mh-info" title="Son los principales datos del período. Las recomendaciones se basan en ellos y en el contexto del negocio.">i</span></h2><p>Lo esencial, sin métricas innecesarias.</p></div><div class="mh-filter"><button class="active">30 días</button><button>90 días</button></div></div>
        <div class="mh-kpis">
          <div class="mh-kpi ${x.sales?'good':'neutral'}"><div class="mh-kpi-label">Ventas</div><div class="mh-kpi-value">${x.sales}</div><div class="mh-kpi-foot">ventas registradas</div></div>
          <div class="mh-kpi ${x.queries?'good':'neutral'}"><div class="mh-kpi-label">Consultas</div><div class="mh-kpi-value">${x.queries}</div><div class="mh-kpi-foot">personas interesadas</div></div>
          <div class="mh-kpi warn"><div class="mh-kpi-label">Inversión</div><div class="mh-kpi-value">${money(x.spend)}</div><div class="mh-kpi-foot">en campañas</div></div>
          <div class="mh-kpi ${x.conversion>=25?'good':'warn'}"><div class="mh-kpi-label">De consulta a venta</div><div class="mh-kpi-value">${x.conversion.toFixed(1)}%</div><div class="mh-kpi-foot">aprox. de cada 100 consultas</div></div>
        </div>
      </section>

      <div class="mh-layout">
        <section class="mh-panel" id="mh-campaign-panel"><div class="mh-panel-title">¿Qué está funcionando?</div><div class="mh-panel-sub">Tus campañas ordenadas por ventas. Tocá una para entenderla.</div><div class="mh-campaign-list">${campaignRows || '<div class="empty">Todavía no hay campañas.</div>'}</div></section>
        <section class="mh-panel"><div class="mh-panel-title">Lo más importante <span class="mh-info" title="Estas señales se priorizan por impacto comercial, no por cantidad de métricas.">i</span></div><div class="mh-panel-sub">Tres cosas que miraría primero.</div><div class="mh-insights">
          ${recs.map((r,i)=>`<div class="mh-insight" data-mh-ai="${esc(r.prompt)}"><strong>${i+1}. ${esc(r.title)}</strong><p>${esc(r.text)}</p><div class="mh-action">Preguntarle a Marketing Manager AI →</div></div>`).join('')}
        </div></section>
      </div>

      <section class="mh-panel"><div class="mh-section-head"><div><div class="mh-panel-title">Recomendaciones</div><div class="mh-panel-sub">Acciones concretas, en orden de prioridad.</div></div></div><div class="mh-recommendations">${recs.map((r,i)=>`<div class="mh-rec"><div class="mh-rec-num">${i+1}</div><div><strong>${esc(r.title)}</strong><p>${esc(r.text)}</p></div><button data-mh-ai="${esc(r.prompt)}">Preguntar por qué</button></div>`).join('')}</div></section>

      <section class="mh-ai"><div class="mh-ai-copy"><strong>¿Querés entender el porqué?</strong><p>Marketing Manager AI cruza tus datos y te explica qué está pasando antes de recomendarte una acción.</p><div class="mh-ai-prompts"><button class="mh-ai-prompt" data-mh-ai="¿Por qué bajaron mis ventas?">¿Por qué bajaron mis ventas?</button><button class="mh-ai-prompt" data-mh-ai="¿Cuál es mi mejor campaña y por qué?">¿Cuál es mi mejor campaña?</button><button class="mh-ai-prompt" data-mh-ai="Armame un plan para esta semana.">Plan para esta semana</button></div></div><button class="mh-ai-open" data-mh-ai="¿Qué debería hacer hoy para mejorar el negocio?">Abrir Marketing Manager AI</button></section>
    </div>`;

    view.querySelectorAll('[data-mh-ai]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();openAI(btn.dataset.mhAi)}));
    view.querySelectorAll('[data-mh-scroll]').forEach(btn=>btn.addEventListener('click',()=>document.getElementById(btn.dataset.mhScroll)?.scrollIntoView({behavior:'smooth',block:'center'})));
    view.querySelectorAll('.mh-campaign').forEach(card=>card.addEventListener('click',()=>card.classList.toggle('open')));
    view.querySelectorAll('.mh-filter button').forEach(btn=>btn.addEventListener('click',()=>{view.querySelectorAll('.mh-filter button').forEach(b=>b.classList.remove('active'));btn.classList.add('active')}));
  }

  function start(){css();render();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  const observer=new MutationObserver(()=>{if(typeof currentPage!=='undefined'&&currentPage==='dashboard')render()});
  observer.observe(document.body,{childList:true,subtree:true});
})();