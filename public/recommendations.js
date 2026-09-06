(() => {
  'use strict';
  const MH=window.MarketingHubRecommendations={};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('es-AR');
  const num=n=>Number(n)||0;
  const status=(v,...values)=>values.some(x=>String(v??'').toLowerCase()===String(x).toLowerCase());

  const css=`
  .mh-ai-card{margin-bottom:16px;background:linear-gradient(135deg,#f8f7ff,#fff);border-color:#ddd8ff}
  .mh-ai-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
  .mh-ai-stat{padding:12px;border:1px solid #e4e4f0;border-radius:11px;background:#fff}
  .mh-ai-stat-label{font-size:10px;font-weight:800;color:#6b6c86;text-transform:uppercase;letter-spacing:.04em}
  .mh-ai-stat-value{font:800 19px Sora,Inter,sans-serif;margin-top:5px}
  .mh-ai-stat-note{font-size:10px;color:#6b6c86;line-height:1.4;margin-top:4px}
  .mh-ai-analysis{padding:12px 13px;border-radius:11px;background:#f5f5fb;border:1px solid #e4e4f0;font-size:11px;color:#3a3b57;line-height:1.55}
  .mh-ai-analysis strong{color:#14152b}
  .mh-recommendations-card{margin-bottom:16px;background:linear-gradient(135deg,#f8f7ff,#fff);border-color:#ddd8ff}
  .mh-rec-list{display:grid;gap:10px}.mh-rec{display:flex;gap:11px;padding:13px;border:1px solid #e4e4f0;border-radius:12px;background:#fff}
  .mh-rec-icon{width:32px;height:32px;flex:0 0 32px;border-radius:9px;background:#efedff;color:#5b4cf5;display:grid;place-items:center;font-weight:800}
  .mh-rec-title{font-size:13px;font-weight:800;color:#14152b}.mh-rec-reason{font-size:11px;color:#6b6c86;line-height:1.5;margin-top:5px}
  .mh-rec-action{font-size:11px;color:#3a3b57;line-height:1.5;margin-top:7px}.mh-rec-action strong{color:#5b4cf5}
  .mh-info{display:inline-grid;place-items:center;width:18px;height:18px;margin-left:5px;border:1px solid #a6a7bc;border-radius:50%;font:800 10px/1 Inter,sans-serif;color:#6b6c86;cursor:help;vertical-align:middle;position:relative;outline:none;background:#fff}
  .mh-info:hover,.mh-info:focus{border-color:#5b4cf5;color:#5b4cf5;background:#efedff}
  .mh-info::after{content:attr(data-info);position:absolute;z-index:9999;left:50%;bottom:calc(100% + 9px);transform:translateX(-50%);width:310px;padding:12px 13px;border-radius:10px;background:#14152b;color:#fff;font:500 11px/1.55 Inter,sans-serif;box-shadow:0 14px 35px rgba(20,21,43,.25);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s,visibility .12s;text-align:left}
  .mh-info:hover::after,.mh-info:focus::after{opacity:1;visibility:visible}
  .mh-info-bottom::after{top:calc(100% + 9px);bottom:auto}
  .priority-1 .mh-rec-icon{background:#fdeaeb;color:#e0454b}.priority-2 .mh-rec-icon{background:#fcf1df;color:#d98a1f}
  @media(max-width:900px){.mh-ai-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:560px){.mh-ai-grid{grid-template-columns:1fr 1fr}.mh-info::after{width:250px;left:0;transform:none}}
  `;
  const style=document.createElement('style');style.id='mh-recommendations-style';style.textContent=css;document.head.appendChild(style);

  async function getData(){
    try{
      const get=async url=>{const r=await fetch(url,{credentials:'same-origin'});if(!r.ok)throw new Error('request failed');return r.json()};
      const [dashboard,campaigns,customers,reviews,content,promotions]=await Promise.all([
        get('/api/dashboard'),get('/api/campaigns'),get('/api/customers'),get('/api/reviews'),get('/api/content'),get('/api/promotions')
      ]);
      return {metrics:dashboard.metrics||{},campaigns:campaigns.campaigns||[],customers:customers.customers||[],reviews:reviews.reviews||[],content:content.content||[],promotions:promotions.promotions||[]};
    }catch(e){console.warn('Marketing Hub analysis unavailable',e);return null}
  }

  function analyze(d){
    const {campaigns,customers,reviews,content,promotions}=d;
    const recs=[]; const add=(priority,icon,title,reason,action)=>recs.push({priority,icon,title,reason,action});
    const pending=reviews.filter(r=>status(r.status,'pending','Sin responder')).length;
    const inactive=customers.filter(c=>status(c.status,'inactive','Inactivo')).length;
    const spend=campaigns.reduce((a,c)=>a+num(c.spent),0);
    const budget=campaigns.reduce((a,c)=>a+num(c.budget),0);
    const sales=campaigns.reduce((a,c)=>a+num(c.sales),0);
    const leads=campaigns.reduce((a,c)=>a+num(c.leads,c.queries),0);
    const published=content.filter(c=>status(c.status,'published','Publicado')).length;
    const scheduled=content.filter(c=>status(c.status,'scheduled','Programado')).length;
    const avg=reviews.length?reviews.reduce((a,r)=>a+num(r.rating),0)/reviews.length:0;

    if(pending) add(1,'★','Respondé tus reseñas pendientes',`Detectamos ${pending} reseña${pending===1?'':'s'} sin responder. Es una señal de atención al cliente que todavía requiere una acción concreta.`,`Respondé primero las más recientes y cualquier reseña de 3 estrellas o menos.`);
    if(inactive) add(2,'↻',`Reactivá ${inactive} clientes inactivos`,`Hay ${inactive} clientes marcados como inactivos. Son personas que ya conocen tu negocio, así que existe una oportunidad de retorno antes de gastar para conseguir nuevos clientes.`,`Creá una oferta de regreso y contactalos por WhatsApp o email.`);
    if(campaigns.length){
      const ranked=campaigns.map(c=>({...c,eff:num(c.sales)/Math.max(num(c.spent),1)})).sort((a,b)=>b.eff-a.eff);
      const best=ranked[0], weakest=ranked[ranked.length-1];
      if(num(best.sales)>0) add(1,'↗',`Potenciá “${best.name}”`,`Generó ${best.sales} ventas con ${money(best.spent)} de inversión. Su relación ventas/inversión es la mejor entre las campañas cargadas.`,`Aumentá el presupuesto de forma gradual (10–20%) y verificá que la eficiencia se mantenga.`);
      if(weakest&&ranked.length>1&&num(weakest.spent)>0&&num(weakest.sales)===0) add(1,'!','Revisá la campaña que no convierte',`“${weakest.name}” ya tiene ${money(weakest.spent)} de gasto pero registra 0 ventas. La señal principal no es falta de presupuesto sino falta de conversión.`,`Revisá objetivo, segmentación y oferta antes de invertir más.`);
      if(budget>0&&spend/budget>=.8) add(1,'$','Cuidá el presupuesto restante',`Ya utilizaste ${Math.round(spend/budget*100)}% del presupuesto registrado: ${money(spend)} de ${money(budget)}.`,`Reservá el saldo para las campañas que realmente generan ventas.`);
      if(leads>0&&sales>0){const rate=sales/leads*100;add(2,'◎','Mejorá la conversión de consultas a ventas',`Hay ${leads} consultas y ${sales} ventas: una conversión aproximada del ${rate.toFixed(1)}%. El mayor margen puede estar después de captar la consulta.`,`Analizá qué campaña trae consultas de mejor calidad y mejorá el seguimiento comercial.`)}
      if(leads>0&&sales===0) add(1,'◎','Convertí las consultas en ventas',`Tus campañas generaron ${leads} consultas pero todavía no registran ventas. El cuello de botella parece estar después de conseguir el interés.`,`Revisá tiempos de respuesta, oferta y seguimiento de cada consulta.`);
    }
    if(published<3) add(2,'✦','Aumentá la frecuencia de contenido',`Solo hay ${published} publicación${published===1?'':'es'} registrada${published===1?'':'s'} como publicada. Con poca actividad hay menos oportunidades de generar alcance y aprender qué funciona.`,`Planificá contenido útil, comercial y de interacción durante la semana.`);
    if(content.length&&scheduled===0) add(2,'◷','Programá contenido con anticipación','No hay contenido marcado como programado. Eso aumenta el riesgo de tener días sin publicaciones.','Dejá preparadas las próximas piezas de la semana.');
    if(avg>0&&avg<4) add(1,'!','Prestá atención a la reputación',`El promedio de las ${reviews.length} reseñas es ${avg.toFixed(1)}/5. La valoración está por debajo de 4 y merece una revisión de los comentarios negativos.`,`Identificá problemas repetidos y respondé primero las reseñas con menor puntuación.`);
    if(promotions.length){const best=[...promotions].sort((a,b)=>num(b.uses)-num(a.uses))[0];if(best&&num(best.uses)>0)add(3,'%','Replicá tu promoción más usada',`“${best.name||best.title}” acumula ${best.uses} usos, la mayor cantidad entre las promociones cargadas.`,`Creá una variante de esa oferta y medí si vuelve a superar al resto.`)}
    if(!recs.length) add(2,'✦','Necesitamos más datos para recomendarte acciones','Todavía no hay suficientes señales en campañas, clientes, contenido, reseñas o promociones para detectar un problema concreto.','Cargá resultados reales y Marketing Hub irá generando recomendaciones más específicas.');
    return recs.sort((a,b)=>a.priority-b.priority).slice(0,5);
  }

  const info=text=>`<span class="mh-info" tabindex="0" data-info="${esc(text)}" aria-label="Ver explicación">i</span>`;

  function renderAnalysis(d){
    const view=document.getElementById('view'); if(!view)return;
    view.querySelector('#mh-data-analysis')?.remove();
    const m=d.metrics||{}, campaigns=d.campaigns;
    const spend=num(m.campaignSpent),budget=num(m.campaignBudget),leads=num(m.leads),sales=num(m.sales),customers=d.customers.length,reviews=d.reviews.length;
    const conversion=leads?sales/leads*100:0;
    const efficiency=spend?sales/spend:0;
    let conclusion='No hay suficientes resultados para emitir una conclusión fuerte todavía.';
    if(leads&&sales===0) conclusion=`El principal problema detectado es la conversión: hay ${leads} consultas pero 0 ventas registradas. Conviene optimizar el seguimiento antes de aumentar inversión.`;
    else if(leads&&sales) conclusion=`La conversión actual es ${conversion.toFixed(1)}% (${sales} ventas sobre ${leads} consultas). Antes de gastar más, conviene identificar qué campaña genera las consultas de mayor calidad.`;
    else if(budget&&spend/budget>=.8) conclusion=`El gasto está en ${Math.round(spend/budget*100)}% del presupuesto. La prioridad es proteger el saldo y concentrarlo en lo que mejor funciona.`;
    else if(customers) conclusion=`Hay ${customers} clientes registrados. Cuantos más datos de compras y actividad cargues, más preciso será el análisis de recurrencia y reactivación.`;
    const card=document.createElement('section');card.id='mh-data-analysis';card.className='card mh-ai-card';
    card.innerHTML=`<div class="section-title"><div><h2>Análisis de tus datos ${info('Esta sección no muestra solo números: calcula relaciones entre inversión, consultas, ventas y clientes para detectar dónde está la oportunidad.')}</h2><p>Lectura automática de lo que está pasando en tu negocio.</p></div><span class="badge success">ANÁLISIS</span></div><div class="mh-ai-grid"><div class="mh-ai-stat"><div class="mh-ai-stat-label">Inversión</div><div class="mh-ai-stat-value">${money(spend)}</div><div class="mh-ai-stat-note">${budget?Math.round(spend/budget*100)+'% del presupuesto':''}</div></div><div class="mh-ai-stat"><div class="mh-ai-stat-label">Consultas</div><div class="mh-ai-stat-value">${leads}</div><div class="mh-ai-stat-note">Interés generado</div></div><div class="mh-ai-stat"><div class="mh-ai-stat-label">Ventas</div><div class="mh-ai-stat-value">${sales}</div><div class="mh-ai-stat-note">${leads?'Conversión '+conversion.toFixed(1)+'%':'Sin consultas suficientes'}</div></div><div class="mh-ai-stat"><div class="mh-ai-stat-label">Eficiencia</div><div class="mh-ai-stat-value">${efficiency?efficiency.toFixed(3):'—'}</div><div class="mh-ai-stat-note">Ventas por $1 invertido</div></div></div><div class="mh-ai-analysis"><strong>🔎 Qué detecta Marketing Hub:</strong> ${esc(conclusion)} ${info(conclusion)}</div>`;
    const firstCard=view.querySelector('.card');
    if(firstCard?.parentElement)firstCard.parentElement.insertBefore(card,firstCard.nextSibling);else view.prepend(card);
  }

  function renderRecommendations(d){
    const view=document.getElementById('view');if(!view)return;
    view.querySelector('#mh-recommendations')?.remove();
    const recs=analyze(d),panel=document.createElement('section');panel.id='mh-recommendations';panel.className='card mh-recommendations-card';
    panel.innerHTML=`<div class="section-title"><div><h2>Recomendaciones inteligentes ${info('Estas acciones se generan a partir de tus datos actuales. Cada recomendación incluye el dato que la dispara y una acción concreta.')}</h2><p>No son sugerencias fijas: cambian cuando cambian tus resultados.</p></div><span class="badge success">PERSONALIZADO</span></div><div class="mh-rec-list">${recs.map(r=>`<article class="mh-rec priority-${r.priority}"><div class="mh-rec-icon">${r.icon}</div><div><div class="mh-rec-title">${esc(r.title)} ${info(r.reason)}</div><div class="mh-rec-reason"><strong>Por qué:</strong> ${esc(r.reason)}</div><div class="mh-rec-action"><strong>Qué hacer:</strong> ${esc(r.action)}</div></div></article>`).join('')}</div>`;
    const staticCard=[...view.querySelectorAll('.card')].find(c=>c!==panel&&c.textContent.includes('Acciones recomendadas'));
    if(staticCard)staticCard.remove();
    const analysis=view.querySelector('#mh-data-analysis');
    if(analysis?.parentElement)analysis.parentElement.insertBefore(panel,analysis.nextSibling);
    else view.prepend(panel);
  }

  function addMetricTooltips(){
    const view=document.getElementById('view');if(!view)return;
    const defs={
      'Inversión publicitaria':'Total gastado por tus campañas. Se compara con el presupuesto para saber cuánto margen queda.',
      'Consultas generadas':'Consultas o leads registrados por las campañas. Es la cantidad de personas que mostraron interés.',
      'Ventas atribuidas':'Ventas registradas en relación con tus campañas. Marketing Hub las compara con consultas e inversión.',
      'ROAS estimado':'Indicador orientativo de eficiencia publicitaria. En esta versión usa los datos cargados y no reemplaza la atribución de Meta o Google.',
      'Rendimiento':'Muestra cómo evolucionan ventas y consultas. Buscá diferencias entre ambas para encontrar problemas de conversión.',
      'Distribución del presupuesto':'Muestra cómo se reparte la inversión entre canales y cuánto presupuesto queda.'
    };
    view.querySelectorAll('.kpi-top span:first-child,.section-title h2').forEach(el=>{const key=el.textContent.trim();if(defs[key]&&!el.querySelector('.mh-info'))el.insertAdjacentHTML('beforeend',' '+info(defs[key]));});
  }

  async function refresh(){
    const view=document.getElementById('view');
    if(!view||!view.querySelector('.kpi'))return;
    const d=await getData();if(!d)return;
    renderAnalysis(d);renderRecommendations(d);addMetricTooltips();
  }
  MH.refresh=refresh;
  let timer=null;
  const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>refresh(),120)});
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('mh:data-updated',refresh);
  setTimeout(refresh,700);
})();
