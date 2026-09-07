(() => {
  'use strict';
  if (!document.querySelector('script[data-mh-dashboard-redesign]')) {
    const script = document.createElement('script');
    script.src = '/dashboard-redesign.js?v=6d2bc567';
    script.dataset.mhDashboardRedesign = 'true';
    document.head.appendChild(script);
  }
  if (window.__mhRecommendationsLoaded) return;
  window.__mhRecommendationsLoaded = true;

  const money = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR');
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  function buildRecommendations() {
    if (!window.DB || !Array.isArray(DB.campaigns)) return [];
    const campaigns = DB.campaigns;
    const reviews = DB.reviews || [];
    const customers = DB.customers || [];
    const content = DB.content || [];
    const recs = [];
    const spend = campaigns.reduce((a, c) => a + (Number(c.spent) || 0), 0);
    const pendingReviews = reviews.filter(r => r.status === 'Sin responder').length;
    const inactive = customers.filter(c => c.status === 'Inactivo').length;
    const published = content.filter(c => c.status === 'Publicado').length;
    const ranked = [...campaigns].sort((a, b) => ((Number(b.sales) || 0) / Math.max(Number(b.spent) || 0, 1)) - ((Number(a.sales) || 0) / Math.max(Number(a.spent) || 0, 1)));
    const best = ranked.find(c => (Number(c.sales) || 0) > 0);
    const weak = campaigns.find(c => (Number(c.spent) || 0) > 0 && (Number(c.sales) || 0) === 0);
    if (best) recs.push({priority:1,title:`Potenciá “${best.name}”`,text:`Es la campaña con mejor relación entre ventas e inversión: ${best.sales} ventas con ${money(best.spent)} gastados.`,action:'Aumentá el presupuesto de forma gradual y verificá que mantenga el rendimiento.'});
    if (weak) recs.push({priority:1,title:`Revisá “${weak.name}”`,text:`Ya gastó ${money(weak.spent)} y todavía no registra ventas. Seguir invirtiendo sin corregirla puede desperdiciar presupuesto.`,action:'Revisá oferta, público y qué sucede después de recibir una consulta.'});
    if (pendingReviews) recs.push({priority:2,title:'Respondé las reseñas pendientes',text:`Hay ${pendingReviews} reseña${pendingReviews === 1 ? '' : 's'} esperando respuesta.`,action:'Respondé primero las más recientes y las de menor valoración.'});
    if (inactive) recs.push({priority:2,title:`Reactivá ${inactive} cliente${inactive === 1 ? '' : 's'} inactivo${inactive === 1 ? '' : 's'}`,text:'Son personas que ya conocen el negocio y pueden ser más fáciles de recuperar que un cliente nuevo.',action:'Probá una oferta de regreso y medí cuántos vuelven a comprar.'});
    if (published < 2) recs.push({priority:3,title:'Prepará más contenido',text:`Hay ${published} publicación${published === 1 ? '' : 'es'} publicada${published === 1 ? '' : 's'} registrada${published === 1 ? '' : 's'} en el período.`,action:'Dejá preparado contenido útil y comercial para los próximos días.'});
    if (!recs.length) recs.push({priority:3,title:'Seguí registrando resultados',text:'Todavía no hay una señal suficientemente fuerte para priorizar una acción.',action:'A medida que haya más datos, Marketing Hub podrá detectar oportunidades con mayor precisión.'});
    return recs.sort((a,b)=>a.priority-b.priority).slice(0,3);
  }

  function addStyles() {
    if (document.getElementById('mh-recommendations-style')) return;
    const style = document.createElement('style'); style.id='mh-recommendations-style';
    style.textContent=`#mh-recommendations{margin-bottom:16px}.mh-recommendations-list{display:grid;gap:10px}.mh-recommendation-item{display:flex;align-items:flex-start;gap:12px;padding:14px;border:1px solid var(--border);border-radius:12px;background:#fff}.mh-recommendation-number{width:30px;height:30px;flex:0 0 30px;border-radius:9px;background:var(--violet-tint);color:var(--violet);display:grid;place-items:center;font-family:Sora,sans-serif;font-weight:800}.mh-recommendation-content{min-width:0}.mh-recommendation-content strong{display:block;font-size:13px;line-height:1.35}.mh-recommendation-content p{font-size:11px;color:var(--ink-500);line-height:1.5;margin-top:4px}.mh-recommendation-action{font-size:11px;color:var(--ink-700);line-height:1.5;margin-top:7px}.mh-recommendation-action b{color:var(--violet)}@media(max-width:560px){.mh-recommendation-item{padding:12px}.mh-recommendation-content strong{font-size:12px}}`;
    document.head.appendChild(style);
  }

  function render() {
    if (typeof currentPage === 'undefined' || currentPage !== 'dashboard') return;
    const view = document.getElementById('view'); if (!view || !window.DB || !Array.isArray(DB.campaigns)) return;
    const oldGrid=[...view.querySelectorAll('.grid.two')].find(grid=>/Acciones recomendadas/i.test(grid.querySelector('h2')?.textContent||''));
    if(!oldGrid||view.querySelector('#mh-recommendations')) return;
    const campaigns=DB.campaigns, queries=campaigns.reduce((a,c)=>a+(Number(c.queries)||0),0), sales=campaigns.reduce((a,c)=>a+(Number(c.sales)||0),0), spend=campaigns.reduce((a,c)=>a+(Number(c.spent)||0),0), conversion=queries?((sales/queries)*100).toFixed(1):'0.0', recs=buildRecommendations();
    const section=document.createElement('div'); section.id='mh-recommendations'; section.className='card'; section.dataset.explain='true'; section.dataset.explainTitle='Recomendaciones'; section.dataset.explainAnalysis=`Marketing Hub cruza las campañas, ${queries} consultas, ${sales} ventas y ${money(spend)} de inversión, además de clientes, reseñas y contenido.`; section.dataset.explainConclusion=`La conversión actual es ${conversion}%. Las recomendaciones se priorizan según señales concretas y posible impacto comercial.`; section.dataset.explainWhy='Cada recomendación responde a un dato detectado y propone una acción concreta. No se muestran recomendaciones genéricas si no hay una señal suficiente.'; section.dataset.explainSource='Datos registrados en Marketing Hub.';
    section.innerHTML=`<div class="section-title"><div><h2>Recomendaciones</h2><p>Qué conviene hacer ahora para mejorar el negocio.</p></div></div><div class="mh-recommendations-list">${recs.map((r,i)=>`<div class="mh-recommendation-item" data-explainable="false"><div class="mh-recommendation-number">${i+1}</div><div class="mh-recommendation-content"><strong>${esc(r.title)}</strong><p>${esc(r.text)}</p><div class="mh-recommendation-action"><b>Qué hacer:</b> ${esc(r.action)}</div></div></div>`).join('')}</div>`;
    oldGrid.replaceWith(section);
  }
  function start(){addStyles();render()}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  const observer=new MutationObserver(()=>{if(typeof currentPage!=='undefined'&&currentPage==='dashboard')render()}); observer.observe(document.body,{childList:true,subtree:true});
})();