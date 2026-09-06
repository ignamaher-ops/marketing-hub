(() => {
  'use strict';
  if (window.__mhRecommendationsBooted) return;
  window.__mhRecommendationsBooted = true;

  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const n = v => Number(v) || 0;
  const money = v => '$' + Math.round(n(v)).toLocaleString('es-AR');
  const has = (v, ...xs) => xs.includes(String(v ?? '').toLowerCase());
  const info = text => `<span class="mh-info" tabindex="0" role="button" data-info="${esc(text)}" aria-label="Ver explicación">i</span>`;

  const style = document.createElement('style');
  style.id = 'mh-explainable-marketing-style';
  style.textContent = `
    .mh-ai-card,.mh-recommendations-card{margin-bottom:16px;background:linear-gradient(135deg,#f8f7ff,#fff);border-color:#ddd8ff}
    .mh-ai-intro{font-size:12px;color:#3a3b57;line-height:1.55;margin:-5px 0 14px}
    .mh-ai-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
    .mh-ai-stat{padding:12px;border:1px solid #e4e4f0;border-radius:11px;background:#fff}
    .mh-ai-stat-label{font-size:10px;font-weight:800;color:#6b6c86;text-transform:uppercase;letter-spacing:.04em}
    .mh-ai-stat-value{font:800 19px Sora,Inter,sans-serif;margin-top:5px}
    .mh-ai-stat-note{font-size:10px;color:#6b6c86;line-height:1.4;margin-top:4px}
    .mh-ai-analysis{padding:13px;border-radius:11px;background:#f5f5fb;border:1px solid #e4e4f0;font-size:11px;color:#3a3b57;line-height:1.6}
    .mh-ai-analysis strong{color:#14152b}
    .mh-campaign-analysis{display:grid;gap:8px;margin-top:12px}
    .mh-campaign-row{padding:10px 12px;border:1px solid #e4e4f0;border-radius:10px;background:#fff;font-size:11px;color:#3a3b57;line-height:1.5}
    .mh-campaign-row strong{color:#14152b}
    .mh-rec-list{display:grid;gap:10px}
    .mh-rec{display:flex;gap:11px;padding:13px;border:1px solid #e4e4f0;border-radius:12px;background:#fff}
    .mh-rec-icon{width:32px;height:32px;flex:0 0 32px;border-radius:9px;background:#efedff;color:#5b4cf5;display:grid;place-items:center;font-weight:800}
    .mh-rec-title{font-size:13px;font-weight:800;color:#14152b;display:flex;align-items:center;flex-wrap:wrap}
    .mh-rec-reason{font-size:11px;color:#6b6c86;line-height:1.5;margin-top:5px}
    .mh-rec-action{font-size:11px;color:#3a3b57;line-height:1.5;margin-top:7px}.mh-rec-action strong{color:#5b4cf5}
    .mh-info{display:inline-grid;place-items:center;width:18px;height:18px;margin-left:6px;border:1px solid #a6a7bc;border-radius:50%;font:800 10px/1 Inter,sans-serif;color:#6b6c86;cursor:help;vertical-align:middle;position:relative;outline:none;background:#fff;flex:0 0 18px}
    .mh-info:hover,.mh-info:focus{border-color:#5b4cf5;color:#5b4cf5;background:#efedff}
    .mh-info::after{content:attr(data-info);position:absolute;z-index:9999;left:50%;bottom:calc(100% + 9px);transform:translateX(-50%);width:320px;padding:12px 13px;border-radius:10px;background:#14152b;color:#fff;font:500 11px/1.55 Inter,sans-serif;box-shadow:0 14px 35px rgba(20,21,43,.25);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s,visibility .12s;text-align:left;white-space:normal}
    .mh-info:hover::after,.mh-info:focus::after{opacity:1;visibility:visible}
    .mh-ai-card .section-title,.mh-recommendations-card .section-title{margin-bottom:10px}
    .priority-1 .mh-rec-icon{background:#fdeaeb;color:#e0454b}.priority-2 .mh-rec-icon{background:#fcf1df;color:#d98a1f}
    @media(max-width:900px){.mh-ai-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:560px){.mh-ai-grid{grid-template-columns:1fr 1fr}.mh-info::after{width:250px;left:0;transform:none}}
  `;
  document.head.appendChild(style);

  async function getData() {
    try {
      const get = async url => { const r = await fetch(url,{credentials:'same-origin'}); if(!r.ok) throw new Error(url); return r.json(); };
      const [dashboard,campaigns,customers,reviews,content,promotions] = await Promise.all([
        get('/api/dashboard'), get('/api/campaigns'), get('/api/customers'), get('/api/reviews'), get('/api/content'), get('/api/promotions')
      ]);
      return {metrics:dashboard.metrics||{},campaigns:campaigns.campaigns||[],customers:customers.customers||[],reviews:reviews.reviews||[],content:content.content||[],promotions:promotions.promotions||[]};
    } catch(e) { console.warn('Marketing Hub: no se pudo analizar los datos',e); return null; }
  }

  function buildRecommendations(d) {
    const out=[]; const add=(p,icon,title,reason,action)=>out.push({p,icon,title,reason,action});
    const {campaigns,customers,reviews,content,promotions}=d;
    const pending=reviews.filter(r=>has(String(r.status).toLowerCase(),'pending','sin responder')).length;
    const inactive=customers.filter(c=>has(String(c.status).toLowerCase(),'inactive','inactivo')).length;
    const spend=campaigns.reduce((a,c)=>a+n(c.spent),0), budget=campaigns.reduce((a,c)=>a+n(c.budget),0);
    const leads=campaigns.reduce((a,c)=>a+n(c.leads),0), sales=campaigns.reduce((a,c)=>a+n(c.sales),0);
    const published=content.filter(c=>has(String(c.status).toLowerCase(),'published','publicado')).length;
    const scheduled=content.filter(c=>has(String(c.status).toLowerCase(),'scheduled','programado')).length;
    const avg=reviews.length?reviews.reduce((a,r)=>a+n(r.rating),0)/reviews.length:0;

    if(pending) add(1,'★','Respondé tus reseñas pendientes',`Detectamos ${pending} reseña${pending===1?'':'s'} sin responder. Una reseña pendiente es una oportunidad de atención al cliente que todavía no aprovechaste.`,`Respondé primero las más recientes y las de 3 estrellas o menos.`);
    if(inactive) add(2,'↻',`Reactivá ${inactive} clientes inactivos`,`Son personas que ya conocen tu negocio. Recuperar un cliente existente suele ser una oportunidad distinta de conseguir uno nuevo desde cero.`,`Probá una oferta de regreso y medí cuántos vuelven a comprar.`);
    if(campaigns.length) {
      const ranked=campaigns.map(c=>({...c,conversion:n(c.leads)?n(c.sales)/n(c.leads)*100:0,eff:n(c.spent)?n(c.sales)/n(c.spent):0})).sort((a,b)=>b.eff-a.eff);
      const best=ranked[0], weakest=[...ranked].sort((a,b)=>b.spent-a.spent).find(c=>c.spent>0&&c.sales===0);
      if(best && best.sales>0) add(1,'↗',`Potenciá “${best.name}”`,`Generó ${best.sales} ventas con ${money(best.spent)} de inversión y es la campaña con mejor relación ventas/inversión entre las cargadas.`,`Aumentá el presupuesto gradualmente un 10–20% y comprobá que siga siendo eficiente.`);
      if(weakest) add(1,'!','Revisá una campaña que no convierte',`“${weakest.name}” ya gastó ${money(weakest.spent)} y registra 0 ventas. Seguir aumentando el gasto sin corregir el problema puede desperdiciar presupuesto.`,`Revisá la oferta, el público y qué pasa después de que llega la consulta.`);
      if(budget>0&&spend/budget>=.8) add(1,'$','Cuidá el presupuesto restante',`Ya utilizaste ${Math.round(spend/budget*100)}% del presupuesto registrado (${money(spend)} de ${money(budget)}).`,`Concentrá el saldo en las acciones que ya demostraron generar resultados.`);
      if(leads>0&&sales===0) add(1,'◎','Convertí las consultas en ventas',`Las campañas generaron ${leads} consultas pero todavía no registran ventas. El problema parece estar después de captar el interés.`,`Revisá tiempos de respuesta, propuesta comercial y seguimiento.`);
      if(leads>0&&sales>0&&sales/leads<.1) add(1,'◎','Mejorá la conversión de consultas',`Solo se convierten ${ (sales/leads*100).toFixed(1) }% de las consultas en ventas. Eso indica que conseguir interés no es el único desafío: hay que trabajar el cierre.`,`Analizá qué consultas tienen mejor calidad y cómo se están atendiendo.`);
    }
    if(published<3) add(2,'✦','Aumentá la frecuencia de contenido',`Hay ${published} publicación${published===1?'':'es'} publicada${published===1?'':'s'} registrada${published===1?'':'s'}. Con poca actividad tenés menos oportunidades de atraer y aprender de tu audiencia.`,`Planificá contenido útil, comercial y de interacción durante la semana.`);
    if(content.length&&scheduled===0) add(2,'◷','Programá contenido con anticipación','No hay contenido programado. Eso aumenta el riesgo de pasar días sin publicar.','Dejá preparadas las próximas piezas de la semana.');
    if(avg>0&&avg<4) add(1,'!','Prestá atención a la reputación',`El promedio de tus ${reviews.length} reseñas es ${avg.toFixed(1)}/5. La valoración está por debajo de 4 y conviene detectar qué problemas se repiten.`,`Leé primero las reseñas negativas y buscá temas que aparezcan más de una vez.`);
    if(promotions.length){const p=[...promotions].sort((a,b)=>n(b.uses)-n(a.uses))[0];if(p&&n(p.uses)>0)add(3,'%','Replicá tu promoción más usada',`“${p.name||p.title}” acumula ${p.uses} usos, más que las demás promociones registradas.`,`Creá una variante y medí si vuelve a superar al resto.`);}
    if(!out.length) add(2,'✦','Todavía no hay una acción urgente','Los datos actuales no muestran una señal suficientemente fuerte para priorizar una acción concreta.','Seguí cargando resultados: el análisis se volverá más preciso a medida que haya más información.');
    return out.sort((a,b)=>a.p-b.p).slice(0,5);
  }

  function renderAnalysis(d) {
    const view=document.getElementById('view'); if(!view||!view.querySelector('.kpi')) return false;
    view.querySelector('#mh-data-analysis')?.remove();
    const m=d.metrics||{}, cs=d.campaigns;
    const spend=n(m.campaignSpent), budget=n(m.campaignBudget), leads=n(m.leads), sales=n(m.sales);
    const conversion=leads?sales/leads*100:0, roi=spend?sales/spend:0;
    let conclusion='Todavía no hay suficientes datos para una conclusión fuerte.';
    if(leads&&sales===0) conclusion=`Marketing Hub detecta un cuello de botella en la conversión: tenés ${leads} consultas pero 0 ventas registradas. Antes de invertir más, conviene entender por qué las consultas no terminan en compra.`;
    else if(leads&&sales) conclusion=`De cada 100 consultas, aproximadamente ${conversion.toFixed(1)} terminan en venta. Eso permite saber si el problema está en atraer personas o en convertirlas en clientes.`;
    else if(budget&&spend/budget>=.8) conclusion=`Ya usaste ${Math.round(spend/budget*100)}% del presupuesto. La prioridad es cuidar el saldo y concentrarlo donde los resultados sean mejores.`;
    else if(cs.length) conclusion=`Hay ${cs.length} campaña${cs.length===1?'':'s'} para comparar. Marketing Hub puede detectar cuál genera mejores resultados y cuál necesita ajustes.`;

    const rows=cs.slice().sort((a,b)=>n(b.sales)-n(a.sales)).slice(0,4).map(c=>{
      const cr=n(c.leads)?n(c.sales)/n(c.leads)*100:0;
      return `<div class="mh-campaign-row"><strong>${esc(c.name)}</strong>: invirtió ${money(c.spent)}, generó ${n(c.leads)} consultas y ${n(c.sales)} ventas. ${n(c.leads)?`Eso equivale a una conversión de ${cr.toFixed(1)}%.`: 'Todavía no tiene consultas registradas.'} ${info(`Analizamos esta campaña comparando inversión, consultas y ventas. La conversión se calcula dividiendo ventas por consultas.`)}</div>`;
    }).join('');

    const card=document.createElement('section'); card.id='mh-data-analysis'; card.className='card mh-ai-card';
    card.innerHTML=`<div class="section-title"><div><h2>Tu analista de marketing ${info('Marketing Hub lee los datos del negocio y busca relaciones útiles, no solo números aislados.')}</h2><p>Te explicamos qué está pasando y por qué importa.</p></div><span class="badge success">ANÁLISIS</span></div><p class="mh-ai-intro">Pensalo como tu departamento de marketing: mira los resultados, encuentra problemas u oportunidades y te dice cuál debería ser el próximo paso.</p><div class="mh-ai-grid"><div class="mh-ai-stat"><div class="mh-ai-stat-label">Inversión ${info('Cuánto dinero se gastó en las campañas registradas.')}</div><div class="mh-ai-stat-value">${money(spend)}</div><div class="mh-ai-stat-note">${budget?Math.round(spend/budget*100)+'% del presupuesto':''}</div></div><div class="mh-ai-stat"><div class="mh-ai-stat-label">Consultas ${info('Personas que mostraron interés según los datos de tus campañas.')}</div><div class="mh-ai-stat-value">${leads}</div><div class="mh-ai-stat-note">Interés generado</div></div><div class="mh-ai-stat"><div class="mh-ai-stat-label">Ventas ${info('Ventas atribuidas a las campañas registradas.')}</div><div class="mh-ai-stat-value">${sales}</div><div class="mh-ai-stat-note">${leads?`Conversión ${conversion.toFixed(1)}%`: 'Sin consultas'}</div></div><div class="mh-ai-stat"><div class="mh-ai-stat-label">Ventas / inversión ${info('Una medida simple de eficiencia: cuántas ventas se registraron por cada unidad monetaria invertida.')}</div><div class="mh-ai-stat-value">${roi?roi.toFixed(3):'—'}</div><div class="mh-ai-stat-note">Cuanto mayor, mejor, pero siempre hay que mirar el contexto.</div></div></div><div class="mh-ai-analysis"><strong>🔎 Qué detectamos:</strong> ${esc(conclusion)} ${info(conclusion)}</div>${rows?`<div class="mh-campaign-analysis"><div class="mh-ai-stat-label">Comparación de campañas ${info('Comparamos las campañas entre sí para encontrar qué está funcionando y dónde se está desperdiciando presupuesto.')}</div>${rows}</div>`:''}`;
    const first=view.querySelector('.card'); if(first?.parentElement) first.parentElement.insertBefore(card,first.nextSibling); else view.prepend(card);
    return true;
  }

  function renderRecommendations(d) {
    const view=document.getElementById('view'); if(!view||!view.querySelector('.kpi')) return false;
    view.querySelector('#mh-recommendations')?.remove();
    const recs=buildRecommendations(d), panel=document.createElement('section'); panel.id='mh-recommendations'; panel.className='card mh-recommendations-card';
    panel.innerHTML=`<div class="section-title"><div><h2>Acciones recomendadas ${info('Estas recomendaciones no están escritas de antemano. Se generan a partir de tus campañas, clientes, contenido, reseñas y promociones.')}</h2><p>Qué hacer → por qué → cómo actuar.</p></div><span class="badge success">PERSONALIZADO</span></div><div class="mh-rec-list">${recs.map(r=>`<article class="mh-rec priority-${r.p}"><div class="mh-rec-icon">${r.icon}</div><div><div class="mh-rec-title">${esc(r.title)} ${info(r.reason)}</div><div class="mh-rec-reason"><strong>Por qué te lo recomendamos:</strong> ${esc(r.reason)}</div><div class="mh-rec-action"><strong>Qué hacer:</strong> ${esc(r.action)}</div></div></article>`).join('')}</div>`;
    const old=[...view.querySelectorAll('.card')].find(c=>c!==panel&&/Acciones recomendadas/i.test(c.textContent)); if(old) old.remove();
    const analysis=view.querySelector('#mh-data-analysis'); if(analysis?.parentElement) analysis.parentElement.insertBefore(panel,analysis.nextSibling); else view.prepend(panel);
    return true;
  }

  function addKpiExplanations() {
    const view=document.getElementById('view'); if(!view) return;
    const defs={
      'Inversión':'Es el dinero que tus campañas ya gastaron. Sirve para saber cuánto estás poniendo para conseguir resultados.',
      'Consultas':'Son las personas que mostraron interés. No son ventas: una consulta significa que alguien avanzó un paso, pero todavía puede no comprar.',
      'Ventas':'Son las ventas que registraste como resultado de tus campañas. Las comparamos con las consultas para medir conversión.',
      'Clientes':'Cantidad de clientes registrados. También permite detectar oportunidades de recompra y reactivación.',
      'Reseñas':'Opiniones de clientes. Una caída en la valoración o muchas reseñas sin responder puede afectar la percepción del negocio.',
      'Contenido':'Publicaciones registradas. Marketing Hub mira la frecuencia para detectar si estás dejando pasar oportunidades de comunicación.',
      'Presupuesto':'Dinero disponible para invertir en campañas. No siempre conviene gastarlo todo: importa dónde genera mejores resultados.'
    };
    view.querySelectorAll('.kpi').forEach(k=>{
      const label=k.querySelector('.kpi-top'); if(!label||label.querySelector('.mh-info')) return;
      const key=Object.keys(defs).find(x=>label.textContent.trim().toLowerCase().includes(x.toLowerCase())); if(key) label.insertAdjacentHTML('beforeend',info(defs[key]));
    });
  }

  async function refresh() {
    const view=document.getElementById('view'); if(!view||!view.querySelector('.kpi')) return false;
    const data=await getData(); if(!data) return false;
    if(!renderAnalysis(data)) return false;
    renderRecommendations(data); addKpiExplanations();
    return true;
  }

  // No MutationObserver: el dashboard cambia el DOM al renderizar y observarlo provocaba ciclos.
  // Este pequeño ciclo hace que las tarjetas aparezcan aunque el dashboard termine de renderizar después.
  let lastDashboardText='';
  const tick=async()=>{
    const view=document.getElementById('view');
    if(!view||!view.querySelector('.kpi')) { lastDashboardText=''; return; }
    const signature=(view.querySelector('.page-title')?.textContent||'')+'|'+view.querySelector('.kpi')?.textContent.slice(0,500);
    if(signature!==lastDashboardText || !view.querySelector('#mh-recommendations') || !view.querySelector('#mh-data-analysis')) {
      lastDashboardText=signature;
      await refresh();
    }
  };
  setTimeout(tick,300); setTimeout(tick,1000); setTimeout(tick,2000); setInterval(tick,7000);
  window.addEventListener('mh:data-updated',()=>setTimeout(tick,150));
})();
