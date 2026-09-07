(() => {
  'use strict';
  if (window.__mhDashboardV3Loaded) return;
  window.__mhDashboardV3Loaded = true;

  const money = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR');
  const num = n => Number(n) || 0;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function data() {
    const d = window.DB || {};
    const campaigns = Array.isArray(d.campaigns) ? d.campaigns : [];
    const customers = Array.isArray(d.customers) ? d.customers : [];
    const reviews = Array.isArray(d.reviews) ? d.reviews : [];
    const spend = campaigns.reduce((a,c) => a + num(c.spent), 0);
    const sales = campaigns.reduce((a,c) => a + num(c.sales), 0);
    const queries = campaigns.reduce((a,c) => a + num(c.queries ?? c.leads), 0);
    const pending = reviews.filter(r => /pending|sin responder/i.test(String(r.status || ''))).length;
    const inactive = customers.filter(c => /inactive|inactivo/i.test(String(c.status || ''))).length;
    return {d,campaigns,customers,reviews,spend,sales,queries,pending,inactive};
  }

  function injectCss() {
    if (document.getElementById('mh-dashboard-v3-style')) return;
    const s = document.createElement('style');
    s.id = 'mh-dashboard-v3-style';
    s.textContent = `
      :root{--mh-z-sticky:20;--mh-z-nav:30;--mh-z-popover:60;--mh-z-modal:80;--mh-z-agent:100}
      .container{padding-bottom:48px}
      .page-head{min-width:0}.page-head .actions{min-width:0}
      .btn,.icon-btn,.nav button,.sidebar-bottom button{min-height:40px}
      .modal-overlay{z-index:var(--mh-z-modal)}
      .search-results{z-index:var(--mh-z-popover)}
      #mh-dashboard-v3{display:grid;gap:18px;max-width:1320px;margin:0 auto}
      #mh-dashboard-v3 *{box-sizing:border-box}
      .mhv-hero{background:linear-gradient(135deg,#17182e,#30295b 62%,#5b4cf5);color:#fff;border-radius:22px;padding:28px 30px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;box-shadow:0 14px 35px rgba(35,29,85,.14)}
      .mhv-copy{min-width:0}.mhv-kicker{font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;opacity:.68}.mhv-hero h1{font-family:Sora,sans-serif;font-size:27px;line-height:1.15;margin-top:7px}.mhv-hero p{font-size:13px;line-height:1.55;opacity:.82;max-width:650px;margin-top:9px}.mhv-status{display:inline-flex;align-items:center;gap:7px;margin-top:15px;padding:7px 10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.1);border-radius:999px;font-size:10px;font-weight:800}.mhv-dot{width:7px;height:7px;border-radius:50%;background:#ffd36b}.mhv-actions{display:flex;gap:8px;flex-wrap:wrap;flex:0 0 auto}.mhv-btn{border:0;border-radius:10px;padding:11px 14px;font-size:11px;font-weight:800;cursor:pointer}.mhv-btn.primary{background:#fff;color:#29244e}.mhv-btn.ghost{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff}
      .mhv-heading{display:flex;justify-content:space-between;align-items:end;gap:12px}.mhv-heading h2{font-family:Sora,sans-serif;font-size:17px}.mhv-heading p{font-size:11px;color:#74758b;margin-top:4px}.mhv-info{width:18px;height:18px;border:1px solid #c9c9dc;border-radius:50%;display:inline-grid;place-items:center;font-size:10px;color:#68697e;background:#fff;margin-left:5px;cursor:help;vertical-align:2px}
      .mhv-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-top:11px}.mhv-kpi{background:#fff;border:1px solid #e7e7f0;border-radius:15px;padding:16px;min-width:0}.mhv-label{font-size:10px;font-weight:800;color:#74758b}.mhv-value{font-family:Sora,sans-serif;font-size:25px;font-weight:800;margin-top:8px}.mhv-value.good{color:#17845b}.mhv-value.warn{color:#b87310}.mhv-foot{font-size:10px;color:#74758b;margin-top:5px}
      .mhv-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.85fr);gap:16px}.mhv-card,.mhv-next{background:#fff;border:1px solid #e7e7f0;border-radius:17px;padding:18px;min-width:0}.mhv-card-title{font-family:Sora,sans-serif;font-size:15px;font-weight:800}.mhv-card-sub{font-size:11px;color:#74758b;margin-top:4px}.mhv-list{display:grid;gap:9px;margin-top:14px}.mhv-campaign{border:1px solid #e7e7f0;border-radius:12px;padding:13px;cursor:pointer;transition:.15s ease}.mhv-campaign:hover,.mhv-campaign.open{border-color:#d1ccff;background:#fcfbff}.mhv-camp-top{display:flex;justify-content:space-between;gap:12px}.mhv-camp-name{font-size:12px;font-weight:800}.mhv-camp-meta{font-size:10px;color:#74758b;margin-top:4px}.mhv-camp-result{font-size:11px;font-weight:800;white-space:nowrap}.mhv-bar{height:7px;background:#f0f0f5;border-radius:99px;overflow:hidden;margin-top:10px}.mhv-bar span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#9a8fff,#5b4cf5)}.mhv-detail{display:none;border-top:1px solid #e7e7f0;margin-top:10px;padding-top:10px;font-size:10px;line-height:1.5;color:#74758b}.mhv-campaign.open .mhv-detail{display:block}.mhv-detail button,.mhv-rec button,.mhv-next button{margin-top:8px;border:0;border-radius:9px;background:#eeeaff;color:#5b4cf5;padding:8px 10px;font-size:10px;font-weight:800;cursor:pointer}.mhv-detail button:hover,.mhv-rec button:hover,.mhv-next button:hover{background:#5b4cf5;color:#fff}
      .mhv-insight{border:1px solid #e7e7f0;border-radius:12px;padding:13px;margin-top:9px;cursor:pointer}.mhv-insight:first-child{margin-top:14px}.mhv-insight:hover{background:#faf9ff;border-color:#d7d2ff}.mhv-insight-label{font-size:9px;text-transform:uppercase;letter-spacing:.07em;font-weight:800;color:#5b4cf5}.mhv-insight strong{display:block;font-size:12px;margin-top:4px}.mhv-insight p{font-size:10px;line-height:1.5;color:#74758b;margin-top:5px}.mhv-insight-action{font-size:10px;font-weight:800;color:#5b4cf5;margin-top:8px}
      .mhv-rec-wrap{background:#fff;border:1px solid #e7e7f0;border-radius:17px;padding:18px}.mhv-recs{display:grid;gap:9px;margin-top:12px}.mhv-rec{display:grid;grid-template-columns:29px minmax(0,1fr) auto;gap:10px;align-items:start;border:1px solid #e7e7f0;border-radius:12px;padding:12px}.mhv-num{width:29px;height:29px;border-radius:9px;background:#eeeaff;color:#5b4cf5;display:grid;place-items:center;font-size:11px;font-weight:900}.mhv-rec strong{font-size:12px}.mhv-rec p{font-size:10px;line-height:1.45;color:#74758b;margin-top:4px}.mhv-rec button{margin-top:0;white-space:nowrap}
      .mhv-ai{background:linear-gradient(135deg,#f0edff,#fff);border:1px solid #ddd8ff;border-radius:17px;padding:18px;display:flex;justify-content:space-between;align-items:center;gap:18px}.mhv-ai h2{font-family:Sora,sans-serif;font-size:15px}.mhv-ai p{font-size:11px;line-height:1.5;color:#74758b;margin-top:5px}.mhv-prompts{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.mhv-prompt{border:1px solid #d9d5ff;background:#fff;color:#4d42c9;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:700;cursor:pointer}.mhv-prompt:hover{background:#5b4cf5;border-color:#5b4cf5;color:#fff}.mhv-ai-open{border:0;background:#5b4cf5;color:#fff;border-radius:10px;padding:11px 14px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
      .mhv-next-row{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid #e7e7f0}.mhv-next-row:last-child{border-bottom:0;padding-bottom:0}.mhv-next-num{width:30px;height:30px;border-radius:9px;background:#f3f2f8;display:grid;place-items:center;font-size:11px;font-weight:900}.mhv-next strong{font-size:11px}.mhv-next span{display:block;font-size:10px;color:#74758b;margin-top:3px}
      .mh-toast{position:fixed;right:20px;top:84px;z-index:70;background:#17182e;color:#fff;border-radius:11px;padding:11px 14px;font-size:11px;font-weight:700;box-shadow:0 12px 30px rgba(20,21,43,.2);max-width:360px}
      @media(max-width:1050px){.mhv-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.mhv-grid{grid-template-columns:1fr}}
      @media(max-width:700px){.mhv-hero{display:block;padding:22px}.mhv-hero h1{font-size:23px}.mhv-actions{margin-top:16px}.mhv-kpis{grid-template-columns:1fr 1fr}.mhv-ai{display:block}.mhv-ai-open{margin-top:13px}.mhv-rec{grid-template-columns:29px minmax(0,1fr)}.mhv-rec button{grid-column:2;justify-self:start}.mhv-next-row{grid-template-columns:30px minmax(0,1fr)}.mhv-next-row button{grid-column:2;justify-self:start}.mhv-heading{display:block}}
      @media(max-width:480px){.mhv-kpis{grid-template-columns:1fr}.mhv-hero{border-radius:16px}.mhv-card,.mhv-rec-wrap,.mhv-next,.mhv-ai{padding:14px}}
    `;
    document.head.appendChild(s);
  }

  function toast(message) {
    document.querySelector('.mh-toast')?.remove();
    const el = document.createElement('div');
    el.className = 'mh-toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function openAI(prompt) {
    if (window.MarketingHubAI && typeof window.MarketingHubAI.open === 'function') {
      window.MarketingHubAI.open(prompt);
      return;
    }
    const launcher = document.querySelector('.mh-agent-launcher,[data-mh-agent-open]');
    if (launcher) { launcher.click(); setTimeout(() => { const input = document.querySelector('#mh-agent-input'); if (input) { input.value = prompt || ''; input.focus(); } }, 150); return; }
    toast('El agente de IA todavía está cargando. Probá de nuevo en un segundo.');
  }

  function connectAction(button) {
    const name = button.dataset.connect || 'esta plataforma';
    const connected = button.textContent.includes('Sincronizar');
    toast(connected ? `${name}: sincronización de demo actualizada.` : `${name}: la conexión real se abrirá con OAuth cuando la integración esté habilitada.`);
  }

  function globalFixes() {
    document.querySelectorAll('[data-connect]').forEach(el => {
      if (el.dataset.mhFixed === '1') return;
      el.dataset.mhFixed = '1';
      el.onclick = e => { e.preventDefault(); e.stopPropagation(); connectAction(el); };
    });
    const logout = document.getElementById('logout');
    if (logout && logout.dataset.mhFixed !== '1') {
      logout.dataset.mhFixed = '1';
      logout.onclick = async e => {
        e.preventDefault();
        if (window.MarketingHubAuth && typeof window.MarketingHubAuth.logout === 'function') return window.MarketingHubAuth.logout();
        try { await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}); } catch (_) {}
        location.reload();
      };
    }
    const review = document.getElementById('review-ai');
    if (review && review.dataset.mhFixed !== '1') { review.dataset.mhFixed='1'; review.onclick=()=>openAI('Analizá mis reseñas pendientes y decime cuáles debería responder primero y cómo.'); }
    const report = document.getElementById('report-ai');
    if (report && report.dataset.mhFixed !== '1') { report.dataset.mhFixed='1'; report.onclick=()=>openAI('Prepará un resumen ejecutivo de mi marketing: qué pasó, qué significa y qué debería hacer esta semana.'); }
  }

  function renderDashboard() {
    if (typeof currentPage === 'undefined' || currentPage !== 'dashboard') return;
    const view = document.getElementById('view');
    if (!view || !window.DB || !Array.isArray(DB.campaigns) || view.querySelector('#mh-dashboard-v3')) return;
    const x = data();
    const business = x.d?.business?.name || 'tu negocio';
    const sorted = [...x.campaigns].sort((a,b)=>num(b.sales)-num(a.sales));
    const best = sorted.find(c=>num(c.sales)>0);
    const weak = x.campaigns.find(c=>num(c.spent)>0 && num(c.sales)===0);
    const status = weak ? 'Encontramos algo que conviene revisar' : x.pending ? 'Hay tareas pendientes que pueden mejorar el negocio' : 'Marketing Hub está monitoreando el negocio';
    const maxSales = Math.max(...x.campaigns.map(c=>num(c.sales)),1);
    const recs=[];
    if(best) recs.push({title:`Potenciá “${best.name}”`,text:`Generó ${best.sales} ventas con ${money(best.spent)} de inversión.`,prompt:`¿Por qué conviene potenciar la campaña ${best.name}?`});
    if(weak) recs.push({title:`Revisá “${weak.name}”`,text:`Gastó ${money(weak.spent)} y todavía no registra ventas.`,prompt:`Analizá la campaña ${weak.name} y decime qué debería corregir.`});
    if(x.pending) recs.push({title:'Respondé las reseñas pendientes',text:`Hay ${x.pending} reseña${x.pending===1?'':'s'} sin responder.`,prompt:'¿Cómo debería manejar las reseñas pendientes?'});
    if(x.inactive && recs.length<3) recs.push({title:'Reactivá clientes inactivos',text:`Hay ${x.inactive} cliente${x.inactive===1?'':'s'} que ya conocen el negocio.`,prompt:'¿Cómo puedo reactivar mis clientes inactivos?'});
    if(!recs.length) recs.push({title:'Seguí registrando resultados',text:'Todavía no hay una señal fuerte para priorizar una acción.',prompt:'¿Qué datos debería empezar a medir?'});
    const campaigns=x.campaigns.slice().sort((a,b)=>num(b.sales)-num(a.sales)).map(c=>{const sales=num(c.sales),spent=num(c.spent),queries=num(c.queries??c.leads),cost=sales?spent/sales:0,width=Math.max(5,Math.min(100,sales/maxSales*100));return `<div class="mhv-campaign" tabindex="0"><div class="mhv-camp-top"><div><div class="mhv-camp-name">${esc(c.name)}</div><div class="mhv-camp-meta">${money(spent)} invertidos · ${queries} consultas</div></div><div class="mhv-camp-result">${sales} ventas</div></div><div class="mhv-bar"><span style="width:${width}%"></span></div><div class="mhv-detail">${sales?`Cada venta costó aproximadamente ${money(cost)} en publicidad.`:'La campaña consumió presupuesto sin registrar ventas todavía.'}<br><button data-mhv-ai="Analizá la campaña ${esc(c.name)} y decime qué debería hacer.">Preguntarle a la IA</button></div></div>`;}).join('');
    const recHtml=recs.slice(0,3).map((r,i)=>`<div class="mhv-rec"><div class="mhv-num">${i+1}</div><div><strong>${esc(r.title)}</strong><p>${esc(r.text)}</p></div><button data-mhv-ai="${esc(r.prompt)}">Ver por qué</button></div>`).join('');
    const insights=[weak?`<div class="mhv-insight" data-mhv-ai="Analizá la campaña ${esc(weak.name)} y decime qué corregiría primero."><div class="mhv-insight-label">Atención</div><strong>${esc(weak.name)} consume presupuesto sin ventas</strong><p>${money(weak.spent)} invertidos y 0 ventas.</p><div class="mhv-insight-action">Ver análisis →</div></div>`:'',x.pending?`<div class="mhv-insight" data-mhv-ai="Analizá mis reseñas pendientes y priorizalas."><div class="mhv-insight-label">Reputación</div><strong>${x.pending} reseña${x.pending===1?'':'s'} pendiente${x.pending===1?'':'s'}</strong><p>Responderlas ayuda a no dejar conversaciones abiertas.</p><div class="mhv-insight-action">Ver qué haría →</div></div>`:'',x.inactive?`<div class="mhv-insight" data-mhv-ai="Proponeme una campaña para reactivar clientes inactivos."><div class="mhv-insight-label">Oportunidad</div><strong>${x.inactive} cliente${x.inactive===1?'':'s'} inactivo${x.inactive===1?'':'s'}</strong><p>Ya conocen el negocio, por lo que pueden ser más fáciles de reactivar.</p><div class="mhv-insight-action">Ver oportunidad →</div></div>`:''].join('');
    const next=recs.slice(0,3).map((r,i)=>`<div class="mhv-next-row"><div class="mhv-next-num">${i+1}</div><div><strong>${esc(r.title)}</strong><span>${esc(r.text)}</span></div><button data-mhv-ai="${esc(r.prompt)}">Preguntar</button></div>`).join('');
    view.innerHTML=`<div id="mh-dashboard-v3">
      <section class="mhv-hero"><div class="mhv-copy"><div class="mhv-kicker">Resumen del negocio</div><h1>Hola. Así está ${esc(business)}.</h1><p>Revisamos tus resultados y te mostramos primero lo que puede mover el negocio. No necesitás saber marketing para entenderlo.</p><div class="mhv-status"><span class="mhv-dot"></span>${esc(status)}</div></div><div class="mhv-actions"><button class="mhv-btn primary" data-mhv-ai="¿Qué debería hacer hoy para mejorar el negocio?">¿Qué hago hoy?</button><button class="mhv-btn ghost" data-mhv-scroll="mhv-campaign-card">Ver campañas</button></div></section>
      <section><div class="mhv-heading"><div><h2>Tu negocio en números <span class="mhv-info" title="Estos datos son la base de las recomendaciones.">i</span></h2><p>Solo lo necesario para entender cómo viene el negocio.</p></div></div><div class="mhv-kpis"><div class="mhv-kpi"><div class="mhv-label">Ventas</div><div class="mhv-value ${x.sales?'good':''}">${x.sales}</div><div class="mhv-foot">ventas registradas</div></div><div class="mhv-kpi"><div class="mhv-label">Consultas</div><div class="mhv-value ${x.queries?'good':''}">${x.queries}</div><div class="mhv-foot">personas interesadas</div></div><div class="mhv-kpi"><div class="mhv-label">Inversión</div><div class="mhv-value warn">${money(x.spend)}</div><div class="mhv-foot">en campañas</div></div><div class="mhv-kpi"><div class="mhv-label">Conversión</div><div class="mhv-value ${x.queries&&x.sales?'good':''}">${x.queries?(x.sales/x.queries*100).toFixed(1):'0.0'}%</div><div class="mhv-foot">de consulta a venta</div></div></div></section>
      <section class="mhv-grid" id="mhv-campaign-card"><div class="mhv-card"><div class="mhv-card-title">¿Qué está funcionando?</div><div class="mhv-card-sub">Tocá una campaña para ver el detalle.</div><div class="mhv-list">${campaigns||'<div class="mhv-card-sub">Todavía no hay campañas cargadas.</div>'}</div></div><div class="mhv-card"><div class="mhv-card-title">¿Qué merece atención?</div><div class="mhv-card-sub">Señales que encontramos en tus datos.</div>${insights||'<div class="mhv-card-sub" style="margin-top:14px">No encontramos alertas fuertes por ahora.</div>'}</div></section>
      <section class="mhv-rec-wrap"><div class="mhv-heading"><div><h2>Recomendaciones <span class="mhv-info" title="Cada recomendación sale de los datos que ves arriba y se puede consultar con la IA.">i</span></h2><p>Qué haría primero y por qué.</p></div></div><div class="mhv-recs">${recHtml}</div></section>
      <section class="mhv-next"><div class="mhv-heading"><div><h2>¿Qué haría primero?</h2><p>Una lista corta para no perderte.</p></div></div>${next}</section>
      <section class="mhv-ai"><div><h2>Marketing Manager AI</h2><p>Preguntale por qué recomienda algo, qué significa un resultado o qué haría esta semana.</p><div class="mhv-prompts"><button class="mhv-prompt" data-mhv-ai="¿Qué problema ves en mis ventas?">Problema en ventas</button><button class="mhv-prompt" data-mhv-ai="¿Cuál es mi mejor campaña y por qué?">Mejor campaña</button><button class="mhv-prompt" data-mhv-ai="¿Qué debería hacer esta semana?">Plan semanal</button></div></div><button class="mhv-ai-open" data-mhv-ai="¿Qué debería hacer hoy para mejorar el negocio?">Hablar con el agente</button></section>
    </div>`;
    view.querySelectorAll('[data-mhv-ai]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();openAI(el.dataset.mhvAi)}));
    view.querySelectorAll('.mhv-campaign').forEach(el=>el.addEventListener('click',()=>el.classList.toggle('open')));
    view.querySelectorAll('[data-mhv-scroll]').forEach(el=>el.addEventListener('click',()=>document.getElementById(el.dataset.mhvScroll)?.scrollIntoView({behavior:'smooth',block:'start'})));
  }

  function run(){injectCss();globalFixes();renderDashboard();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  const observer=new MutationObserver(()=>{globalFixes();renderDashboard();});
  observer.observe(document.body,{childList:true,subtree:true});
})();