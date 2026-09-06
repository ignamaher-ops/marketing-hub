(() => {
  'use strict';
  if (window.__mhExplainabilityBooted) return;
  window.__mhExplainabilityBooted = true;

  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const num = v => Number(v) || 0;
  const money = v => '$' + Math.round(num(v)).toLocaleString('es-AR');
  const lower = v => String(v ?? '').toLowerCase();

  const css = document.createElement('style');
  css.textContent = `
    .mh-info{display:inline-grid;place-items:center;width:18px;height:18px;margin-left:6px;border:1px solid #a6a7bc;border-radius:50%;font:800 10px/1 Inter,sans-serif;color:#6b6c86;background:#fff;cursor:help;vertical-align:middle;position:relative;z-index:100;outline:none;flex:0 0 18px}
    .mh-info:hover,.mh-info:focus{border-color:#5b4cf5;color:#5b4cf5;background:#efedff}
    .mh-info::after{content:attr(data-info);position:absolute;left:50%;bottom:calc(100% + 9px);transform:translateX(-50%);width:330px;padding:12px 13px;border-radius:10px;background:#14152b;color:#fff;font:500 11px/1.55 Inter,sans-serif;box-shadow:0 14px 35px rgba(20,21,43,.25);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s,visibility .12s;text-align:left;white-space:normal}
    .mh-info:hover::after,.mh-info:focus::after{opacity:1;visibility:visible}
    .mh-info.mh-info-right::after{left:auto;right:0;transform:none}
    .mh-explainable-title{display:flex;align-items:center;flex-wrap:wrap;gap:2px}
    .mh-analysis-card{margin-bottom:16px;background:linear-gradient(135deg,#f8f7ff,#fff);border-color:#ddd8ff}
    .mh-analysis-intro{font-size:12px;color:#3a3b57;line-height:1.55;margin:-4px 0 14px}
    .mh-analysis-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
    .mh-analysis-stat{padding:12px;border:1px solid #e4e4f0;border-radius:11px;background:#fff}
    .mh-analysis-label{font-size:10px;font-weight:800;color:#6b6c86;text-transform:uppercase;letter-spacing:.04em;display:flex;align-items:center;flex-wrap:wrap}
    .mh-analysis-value{font:800 19px Sora,Inter,sans-serif;margin-top:5px}
    .mh-analysis-note{font-size:10px;color:#6b6c86;line-height:1.4;margin-top:4px}
    .mh-analysis-conclusion{padding:13px;border-radius:11px;background:#f5f5fb;border:1px solid #e4e4f0;font-size:11px;color:#3a3b57;line-height:1.6}
    .mh-rec-list{display:grid;gap:10px}
    .mh-rec{display:flex;gap:11px;padding:13px;border:1px solid #e4e4f0;border-radius:12px;background:#fff}
    .mh-rec-icon{width:32px;height:32px;flex:0 0 32px;border-radius:9px;background:#efedff;color:#5b4cf5;display:grid;place-items:center;font-weight:800}
    .mh-rec-title{font-size:13px;font-weight:800;color:#14152b;display:flex;align-items:center;flex-wrap:wrap}
    .mh-rec-reason{font-size:11px;color:#6b6c86;line-height:1.5;margin-top:5px}
    .mh-rec-action{font-size:11px;color:#3a3b57;line-height:1.5;margin-top:7px}
    .mh-rec-action strong{color:#5b4cf5}
    @media(max-width:900px){.mh-analysis-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:560px){.mh-analysis-grid{grid-template-columns:1fr 1fr}.mh-info::after{width:250px;left:0;transform:none}.mh-info.mh-info-right::after{left:0;right:auto;transform:none}}
  `;
  document.head.appendChild(css);

  const info = (text, right = false) => `<span class="mh-info${right ? ' mh-info-right' : ''}" tabindex="0" role="button" data-info="${esc(text)}" aria-label="Ver explicación">i</span>`;

  function chartExplanation(chart) {
    if (!chart || !chart.data) return 'Este gráfico organiza los datos de marketing para que puedas detectar cambios, diferencias y oportunidades. La explicación se genera a partir de los datos que muestra.';
    const labels = chart.data.labels || [];
    const datasets = chart.data.datasets || [];
    const points = datasets.flatMap(ds => (ds.data || []).map(v => num(v)));
    if (!points.length) return 'El gráfico todavía no tiene suficientes datos para sacar una conclusión. A medida que registres resultados, Marketing Hub podrá comparar períodos y detectar tendencias.';
    const max = Math.max(...points), min = Math.min(...points), total = points.reduce((a,b) => a+b, 0);
    const maxIndex = points.indexOf(max);
    const label = labels[maxIndex] ?? 'uno de los períodos';
    const first = points[0], last = points[points.length - 1];
    let trend = 'Los valores se mantienen relativamente estables.';
    if (points.length > 1) {
      if (last > first * 1.05) trend = `El último valor es superior al primero (${first.toLocaleString('es-AR')} → ${last.toLocaleString('es-AR')}), una señal de crecimiento.`;
      else if (last < first * 0.95) trend = `El último valor es inferior al primero (${first.toLocaleString('es-AR')} → ${last.toLocaleString('es-AR')}), una señal que conviene investigar.`;
    }
    return `Analizamos los valores que muestra este gráfico. El punto más alto es ${max.toLocaleString('es-AR')} en ${label}; el más bajo es ${min.toLocaleString('es-AR')}. En total se acumulan ${total.toLocaleString('es-AR')}. ${trend} Esto sirve para decidir dónde conviene concentrar la atención, en vez de mirar un número aislado.`;
  }

  function explainCharts(root = document) {
    root.querySelectorAll('.chart-card').forEach(card => {
      if (card.dataset.mhExplained === '1') return;
      const title = card.querySelector('h2,h3');
      if (!title) return;
      let explanation = 'Este gráfico resume datos de marketing para ayudarte a detectar tendencias, diferencias y oportunidades.';
      const canvas = card.querySelector('canvas');
      if (canvas && window.Chart) {
        const chart = Chart.getChart(canvas);
        explanation = chartExplanation(chart);
      }
      title.insertAdjacentHTML('beforeend', info(explanation));
      card.dataset.mhExplained = '1';
    });
  }

  function explainKpis(root = document) {
    const definitions = {
      'inversión':'Cuánto dinero se destinó a las campañas registradas. Sirve para relacionar el gasto con las consultas y ventas obtenidas.',
      'consultas':'Personas que mostraron interés. Las consultas indican que el marketing consiguió atención, pero no significan necesariamente una venta.',
      'ventas':'Ventas registradas como resultado de las campañas. Es el resultado final que usamos para evaluar si la inversión está generando negocio.',
      'costo por venta':'Cuánto se gastó, en promedio, para conseguir cada venta registrada. Se calcula dividiendo la inversión entre las ventas.',
      'clientes':'Cantidad de clientes registrados en el sistema. Ayuda a medir el tamaño de la base que el negocio ya tiene.',
      'reseñas':'Cantidad o valoración de reseñas registradas. Sirve para entender la reputación y detectar problemas recurrentes.'
    };
    root.querySelectorAll('.kpi').forEach(card => {
      if (card.dataset.mhExplained === '1') return;
      const label = lower(card.querySelector('.kpi-top')?.innerText);
      const key = Object.keys(definitions).find(k => label.includes(k));
      if (key) {
        const target = card.querySelector('.kpi-top');
        target?.insertAdjacentHTML('beforeend', info(definitions[key], true));
      }
      card.dataset.mhExplained = '1';
    });
  }

  async function loadData() {
    try {
      const get = async url => { const r = await fetch(url, {credentials:'same-origin'}); if (!r.ok) throw new Error(url); return r.json(); };
      const [dashboard,campaigns,customers,reviews,content,promotions] = await Promise.all([
        get('/api/dashboard'),get('/api/campaigns'),get('/api/customers'),get('/api/reviews'),get('/api/content'),get('/api/promotions')
      ]);
      return {metrics:dashboard.metrics||{},campaigns:campaigns.campaigns||[],customers:customers.customers||[],reviews:reviews.reviews||[],content:content.content||[],promotions:promotions.promotions||[]};
    } catch(e) { console.warn('Marketing Hub: no se pudo analizar los datos', e); return null; }
  }

  function recommendations(d) {
    const out=[]; const add=(p,icon,title,reason,action)=>out.push({p,icon,title,reason,action});
    const {campaigns,customers,reviews,content,promotions}=d;
    const pending=reviews.filter(r=>['pending','sin responder'].includes(lower(r.status))).length;
    const inactive=customers.filter(c=>['inactive','inactivo'].includes(lower(c.status))).length;
    const spend=campaigns.reduce((a,c)=>a+num(c.spent),0), budget=campaigns.reduce((a,c)=>a+num(c.budget),0);
    const leads=campaigns.reduce((a,c)=>a+num(c.leads),0), sales=campaigns.reduce((a,c)=>a+num(c.sales),0);
    const published=content.filter(c=>['published','publicado'].includes(lower(c.status))).length;
    const scheduled=content.filter(c=>['scheduled','programado'].includes(lower(c.status))).length;
    const avg=reviews.length?reviews.reduce((a,r)=>a+num(r.rating),0)/reviews.length:0;
    if(pending) add(1,'★','Respondé tus reseñas pendientes',`Detectamos ${pending} reseña${pending===1?'':'s'} sin responder. Una reseña pendiente es una oportunidad de atención al cliente que todavía no aprovechaste.`,`Respondé primero las más recientes y las de 3 estrellas o menos.`);
    if(inactive) add(2,'↻',`Reactivá ${inactive} clientes inactivos`,`Son personas que ya conocen tu negocio. Recuperar un cliente existente es una oportunidad distinta de conseguir uno nuevo desde cero.`,`Probá una oferta de regreso y medí cuántos vuelven a comprar.`);
    if(campaigns.length){
      const ranked=campaigns.map(c=>({...c,eff:num(c.spent)?num(c.sales)/num(c.spent):0})).sort((a,b)=>b.eff-a.eff);
      const best=ranked[0], weakest=ranked.find(c=>num(c.spent)>0&&num(c.sales)===0);
      if(best&&num(best.sales)>0) add(1,'↗',`Potenciá “${best.name}”`,`Generó ${num(best.sales)} ventas con ${money(best.spent)} de inversión y tiene la mejor relación ventas/inversión entre las campañas cargadas.`,`Aumentá el presupuesto gradualmente un 10–20% y comprobá que siga siendo eficiente.`);
      if(weakest) add(1,'!','Revisá una campaña que no convierte',`“${weakest.name}” ya gastó ${money(weakest.spent)} y registra 0 ventas. Aumentar el gasto sin corregir el problema puede desperdiciar presupuesto.`,`Revisá la oferta, el público y qué pasa después de que llega la consulta.`);
      if(budget>0&&spend/budget>=.8) add(1,'$','Cuidá el presupuesto restante',`Ya utilizaste ${Math.round(spend/budget*100)}% del presupuesto registrado (${money(spend)} de ${money(budget)}).`,`Concentrá el saldo en las acciones que ya demostraron generar resultados.`);
      if(leads>0&&sales===0) add(1,'◎','Convertí las consultas en ventas',`Las campañas generaron ${leads} consultas pero todavía no registran ventas. El cuello de botella parece estar después de captar el interés.`,`Revisá tiempos de respuesta, propuesta comercial y seguimiento.`);
      if(leads>0&&sales>0&&sales/leads<.1) add(1,'◎','Mejorá la conversión de consultas',`Solo se convierten ${(sales/leads*100).toFixed(1)}% de las consultas en ventas. Conseguir interés no es el único desafío: también hay que trabajar el cierre.`,`Analizá qué consultas tienen mejor calidad y cómo se están atendiendo.`);
    }
    if(published<3) add(2,'✦','Aumentá la frecuencia de contenido',`Hay ${published} publicación${published===1?'':'es'} publicada${published===1?'':'s'} registrada${published===1?'':'s'}. Con poca actividad hay menos oportunidades de atraer y aprender de tu audiencia.`,`Planificá contenido útil, comercial y de interacción durante la semana.`);
    if(content.length&&scheduled===0) add(2,'◷','Programá contenido con anticipación','No hay contenido programado. Eso aumenta el riesgo de pasar días sin publicar.','Dejá preparadas las próximas piezas de la semana.');
    if(avg>0&&avg<4) add(1,'!','Prestá atención a la reputación',`El promedio de tus ${reviews.length} reseñas es ${avg.toFixed(1)}/5. La valoración está por debajo de 4 y conviene detectar qué problemas se repiten.`,`Leé primero las reseñas negativas y buscá temas que aparezcan más de una vez.`);
    if(promotions.length){const p=[...promotions].sort((a,b)=>num(b.uses)-num(a.uses))[0];if(p&&num(p.uses)>0)add(3,'%','Replicá tu promoción más usada',`“${p.name||p.title}” acumula ${p.uses} usos, más que las demás promociones registradas.`,`Creá una variante y medí si vuelve a superar al resto.`);}
    if(!out.length) add(2,'✦','Todavía no hay una acción urgente','Los datos actuales no muestran una señal suficientemente fuerte para priorizar una acción concreta.','Seguí cargando resultados: el análisis se volverá más preciso a medida que haya más información.');
    return out.sort((a,b)=>a.p-b.p).slice(0,5);
  }

  function renderAnalysis(d) {
    const view=document.getElementById('view');
    if(!view) return;
    view.querySelector('#mh-explainable-analysis')?.remove();
    const m=d.metrics||{}, cs=d.campaigns||[];
    const spend=num(m.campaignSpent), budget=num(m.campaignBudget), leads=num(m.leads), sales=num(m.sales);
    const conversion=leads?sales/leads*100:0, efficiency=spend?sales/spend:0;
    let conclusion='Todavía no hay suficientes datos para una conclusión fuerte.';
    if(leads&&sales===0) conclusion=`Detectamos un posible cuello de botella en la conversión: hay ${leads} consultas y 0 ventas registradas. Antes de invertir más, conviene entender por qué el interés no termina en compra.`;
    else if(leads&&sales) conclusion=`De cada 100 consultas, aproximadamente ${conversion.toFixed(1)} terminan en venta. Esto ayuda a distinguir si el problema está en atraer personas o en convertirlas.`;
    else if(budget&&spend/budget>=.8) conclusion=`Ya utilizaste ${Math.round(spend/budget*100)}% del presupuesto. La prioridad es cuidar el saldo y concentrarlo donde los resultados sean mejores.`;
    else if(cs.length) conclusion=`Hay ${cs.length} campaña${cs.length===1?'':'s'} para comparar. Marketing Hub analiza inversión, consultas y ventas para detectar oportunidades y problemas.`;
    const card=document.createElement('section');
    card.id='mh-explainable-analysis'; card.className='card mh-analysis-card';
    card.innerHTML=`<div class="section-title"><div><div class="mh-explainable-title"><h2>Tu analista de marketing</h2>${info('Marketing Hub no solo muestra números: relaciona inversión, consultas, ventas y actividad del negocio para encontrar problemas u oportunidades.')}</div><p>Te explicamos qué está pasando y por qué importa.</p></div><span class="badge success">ANÁLISIS</span></div><p class="mh-analysis-intro">Pensalo como tu departamento de marketing: mira los resultados, encuentra problemas u oportunidades y te dice cuál debería ser el próximo paso.</p><div class="mh-analysis-grid"><div class="mh-analysis-stat"><div class="mh-analysis-label">Inversión ${info('Dinero gastado en las campañas registradas.')}</div><div class="mh-analysis-value">${money(spend)}</div><div class="mh-analysis-note">${budget?Math.round(spend/budget*100)+'% del presupuesto':''}</div></div><div class="mh-analysis-stat"><div class="mh-analysis-label">Consultas ${info('Personas que mostraron interés. Una consulta no equivale automáticamente a una venta.')}</div><div class="mh-analysis-value">${leads}</div><div class="mh-analysis-note">Interés generado</div></div><div class="mh-analysis-stat"><div class="mh-analysis-label">Ventas ${info('Ventas registradas como resultado de las campañas.')}</div><div class="mh-analysis-value">${sales}</div><div class="mh-analysis-note">${leads?`Conversión ${conversion.toFixed(1)}%`:'Sin consultas'}</div></div><div class="mh-analysis-stat"><div class="mh-analysis-label">Ventas / inversión ${info('Medida simple de eficiencia: ventas registradas por cada unidad monetaria invertida.')}</div><div class="mh-analysis-value">${efficiency?efficiency.toFixed(3):'—'}</div><div class="mh-analysis-note">Siempre hay que interpretarla junto con el contexto.</div></div></div><div class="mh-analysis-conclusion"><strong>🔎 Qué detectamos:</strong> ${esc(conclusion)} ${info(conclusion)}</div>`;
    const anchor=view.querySelector('.grid.kpis')||view.firstElementChild;
    anchor?.parentNode?.insertBefore(card,anchor.nextSibling);
  }

  function renderRecommendations(d) {
    const view=document.getElementById('view');
    if(!view) return;
    view.querySelector('#mh-explainable-recommendations')?.remove();
    const recs=recommendations(d);
    const card=document.createElement('section'); card.id='mh-explainable-recommendations'; card.className='card mh-analysis-card';
    card.innerHTML=`<div class="section-title"><div><div class="mh-explainable-title"><h2>Recomendaciones para tu negocio</h2>${info('Cada recomendación se genera a partir de señales encontradas en tus datos. Abrí el icono i de cada acción para entender exactamente qué detectamos y por qué la proponemos.')}</div><p>No hace falta saber marketing: te decimos qué hacer y por qué.</p></div><span class="badge warning">PRIORIDADES</span></div><div class="mh-rec-list">${recs.map(r=>`<div class="mh-rec"><div class="mh-rec-icon">${r.icon}</div><div><div class="mh-rec-title">${esc(r.title)} ${info(`La recomendamos porque: ${r.reason} Acción sugerida: ${r.action}`)}</div><div class="mh-rec-reason"><strong>Por qué:</strong> ${esc(r.reason)}</div><div class="mh-rec-action"><strong>Qué hacer:</strong> ${esc(r.action)}</div></div></div>`).join('')}</div>`;
    const analysis=view.querySelector('#mh-explainable-analysis');
    if(analysis) analysis.insertAdjacentElement('afterend',card);
    else { const anchor=view.querySelector('.grid.kpis')||view.firstElementChild; anchor?.parentNode?.insertBefore(card,anchor.nextSibling); }
  }

  let lastView = null;
  async function enhance() {
    const view=document.getElementById('view');
    if(!view) return;
    explainCharts(view); explainKpis(view);
    if(view!==lastView || !view.querySelector('#mh-explainable-analysis')) {
      lastView=view;
      const data=await loadData();
      if(data) { renderAnalysis(data); renderRecommendations(data); explainCharts(view); explainKpis(view); }
    }
  }

  const observer=new MutationObserver(() => { clearTimeout(window.__mhExplainTimer); window.__mhExplainTimer=setTimeout(enhance,80); });
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',enhance);
  window.addEventListener('load',enhance);
  setTimeout(enhance,300);
})();
