(() => {
  const MH = window.MarketingHubRecommendations = {};
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR');

  function analyze() {
    const db = window.DB || (typeof DB !== 'undefined' ? DB : null);
    if (!db) return [];
    const campaigns = Array.isArray(db.campaigns) ? db.campaigns : [];
    const customers = Array.isArray(db.customers) ? db.customers : [];
    const reviews = Array.isArray(db.reviews) ? db.reviews : [];
    const content = Array.isArray(db.content) ? db.content : [];
    const promos = Array.isArray(db.promotions) ? db.promotions : [];
    const recs = [];
    const add = (priority, icon, title, reason, action, type='data') => recs.push({priority,icon,title,reason,action,type});

    const pendingReviews = reviews.filter(r => r.status === 'Sin responder').length;
    const inactive = customers.filter(c => c.status === 'Inactivo').length;
    const spend = campaigns.reduce((a,c)=>a+(Number(c.spent)||0),0);
    const budget = campaigns.reduce((a,c)=>a+(Number(c.budget)||0),0);
    const sales = campaigns.reduce((a,c)=>a+(Number(c.sales)||0),0);
    const leads = campaigns.reduce((a,c)=>a+(Number(c.queries)||0),0);
    const published = content.filter(c=>c.status==='Publicado').length;
    const scheduled = content.filter(c=>c.status==='Programado').length;
    const avgRating = reviews.length ? reviews.reduce((a,r)=>a+(Number(r.rating)||0),0)/reviews.length : 0;

    if (pendingReviews > 0) add(1,'★','Respondé tus reseñas pendientes',`Tenés ${pendingReviews} reseña${pendingReviews===1?'':'s'} sin responder. Responderlas mantiene activa la conversación con clientes y te permite detectar problemas rápido.`,`Priorizá las reseñas más recientes y las que tienen 3 estrellas o menos.`,'reviews');
    if (inactive >= 2) add(2,'↻',`Reactivá ${inactive} clientes inactivos`,`Detectamos ${inactive} clientes marcados como inactivos. Ya conocieron tu negocio, por lo que una campaña de retorno puede requerir menos esfuerzo que captar público nuevo.`,`Creá una promoción exclusiva de regreso y contactalos por WhatsApp.`,'customers');
    if (campaigns.length) {
      const ranked = campaigns.map(c=>({...c, efficiency:(Number(c.sales)||0)/Math.max(Number(c.spent)||0,1)})).sort((a,b)=>b.efficiency-a.efficiency);
      const best = ranked[0];
      if ((best.sales||0)>0 && ranked.length>1) add(1,'↗',`Potenciá “${best.name}”`,`Es la campaña con mejor relación ventas/inversión de las que cargaste: ${best.sales} ventas con ${money(best.spent)} gastados.`,`Probá aumentar el presupuesto gradualmente un 10–20% y medí si mantiene la eficiencia.`,'campaign');
      if (budget>0 && spend/budget>=.8) add(1,'!', 'Revisá el presupuesto publicitario',`Ya utilizaste ${Math.round(spend/budget*100)}% del presupuesto registrado (${money(spend)} de ${money(budget)}).`,`Revisá qué campañas están generando ventas antes de asignar el saldo restante.`,'budget');
      if (leads>0 && sales>0) add(3,'◎','Mirá el recorrido de consulta a venta',`Tus campañas generaron ${leads} consultas y ${sales} ventas. La diferencia entre ambas métricas muestra cuánto margen existe para mejorar la conversión.`,`Compará qué campaña genera consultas de mayor calidad antes de aumentar inversión.`,'conversion');
    }
    if (published < 3) add(2,'✦','Aumentá la frecuencia de contenido',`Solo hay ${published} contenido${published===1?'':'s'} publicado${published===1?'':'s'} registrado${published===1?'':'s'} en el workspace. Con poca actividad es difícil sostener alcance y aprender qué formato funciona.`,`Planificá 3 piezas esta semana: un contenido útil, uno comercial y uno de interacción.`,'content');
    if (scheduled === 0 && content.length > 0) add(2,'◷','Programá contenido con anticipación','No hay contenido marcado como programado. Trabajar con anticipación reduce los días sin publicaciones y permite distribuir mejor las campañas.','Dejá preparadas las próximas publicaciones de la semana.','content');
    if (avgRating > 0 && avgRating < 4) add(1,'!', 'Prestá atención a la reputación',`El promedio de tus reseñas es ${avgRating.toFixed(1)}/5. Las reseñas por debajo de 4 estrellas pueden señalar puntos concretos para mejorar.`,`Revisá comentarios repetidos y respondé primero los casos con problemas.`,`reviews`);
    if (promos.length) {
      const bestPromo = [...promos].sort((a,b)=>(Number(b.uses)||0)-(Number(a.uses)||0))[0];
      if (bestPromo && Number(bestPromo.uses)>0) add(3,'%','Replicá lo que funciona',`“${bestPromo.name}” registra ${bestPromo.uses} usos, más que las otras promociones cargadas.`,`Probá una variante de esa oferta en lugar de crear otra promoción desde cero.`,'promotion');
    }
    if (!recs.length) add(2,'✦','Completá más datos para obtener recomendaciones','Todavía no hay suficientes señales en tu workspace para detectar patrones específicos.','Cargá campañas, clientes, contenido y resultados para que el análisis sea más preciso.','data');
    return recs.sort((a,b)=>a.priority-b.priority).slice(0,5);
  }

  function tooltip(text) { return `<span class="mh-info" tabindex="0" data-info="${esc(text)}" aria-label="Más información">i</span>`; }

  function renderPanel() {
    const view = document.getElementById('view');
    if (!view || document.getElementById('mh-recommendations')) return;
    const recs = analyze();
    const panel = document.createElement('div');
    panel.id='mh-recommendations';
    panel.className='card mh-recommendations-card';
    panel.innerHTML = `<div class="section-title"><div><h2>Recomendaciones inteligentes ${tooltip('Marketing Hub analiza los datos disponibles de tu negocio y genera prioridades diferentes según lo que detecta. No son sugerencias fijas.')}</h2><p>Qué haría primero según tus datos actuales.</p></div><span class="badge success">ANÁLISIS</span></div><div class="mh-rec-list">${recs.map((r,i)=>`<div class="mh-rec priority-${r.priority}"><div class="mh-rec-icon">${r.icon}</div><div class="mh-rec-body"><div class="mh-rec-title">${esc(r.title)} ${tooltip(r.reason)}</div><div class="mh-rec-reason">${esc(r.reason)}</div><div class="mh-rec-action"><strong>Qué hacer:</strong> ${esc(r.action)}</div></div></div>`).join('')}</div>`;
    const candidates = [...view.querySelectorAll('.card')];
    const target = candidates.find(c => c.textContent.includes('Asistente de marketing')) || candidates[0];
    if (target && target.parentElement) target.parentElement.insertBefore(panel, target);
    else view.prepend(panel);
  }

  function enhanceMetricInfo() {
    const view=document.getElementById('view'); if(!view) return;
    const definitions={
      'Inversión publicitaria':'Total gastado por las campañas cargadas en este workspace. Marketing Hub lo compara con el presupuesto registrado para detectar si estás cerca del límite.',
      'Consultas generadas':'Cantidad de consultas/leads atribuidos a tus campañas. Sirve para medir cuánta demanda está generando la inversión.',
      'Ventas atribuidas':'Ventas registradas en las campañas. Se usa junto con inversión y consultas para analizar eficiencia.',
      'ROAS estimado':'Estimación del retorno publicitario basada en las ventas y el gasto cargados. Es orientativa mientras no estén conectadas las plataformas publicitarias reales.',
      'Rendimiento':'Compara la evolución de ventas y consultas durante el período mostrado. Buscá semanas donde una métrica crezca sin que la otra acompañe.',
      'Distribución del presupuesto':'Muestra cómo se reparte el presupuesto entre canales. Una concentración alta puede ser una señal para diversificar o revisar rendimiento.'
    };
    view.querySelectorAll('.kpi-top span:first-child,.section-title h2').forEach(el=>{
      const key=el.textContent.trim(); if(!definitions[key] || el.parentElement.querySelector('.mh-info')) return;
      el.insertAdjacentHTML('beforeend',' '+tooltip(definitions[key]));
    });
  }

  MH.refresh=()=>{ if(document.getElementById('mh-recommendations')) document.getElementById('mh-recommendations').remove(); renderPanel(); enhanceMetricInfo(); };
  const observer=new MutationObserver(()=>{ if(document.getElementById('view')) setTimeout(()=>{ if(document.getElementById('view').querySelector('.kpi')) MH.refresh(); },30); });
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('mh:data-updated',MH.refresh);
  setTimeout(()=>{if(document.getElementById('view')) MH.refresh();},300);
})();
