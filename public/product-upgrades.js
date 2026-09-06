(() => {
  'use strict';

  function injectAuthUi(){
    if(document.getElementById('mh-auth'))return;
    if(window.MarketingHubAuth && !localStorage.getItem('mh_session')){
      const script=document.createElement('script');
      script.src='/auth-ui.js'; script.defer=true; document.head.appendChild(script);
    }
  }

  function injectRecommendations(){
    if(document.getElementById('mh-recommendations-script'))return;
    const script=document.createElement('script');
    script.id='mh-recommendations-script';
    script.src='/recommendations.js';
    script.defer=true;
    document.head.appendChild(script);
  }

  function addRecommendationExplanations(){
    if(document.getElementById('mh-static-recommendation-help-style'))return;
    const style=document.createElement('style');
    style.id='mh-static-recommendation-help-style';
    style.textContent=`
      .mh-inline-info{display:inline-grid;place-items:center;width:18px;height:18px;margin-left:6px;border:1px solid #A6A7BC;border-radius:50%;background:#fff;color:#6B6C86;font:800 10px/1 Inter,sans-serif;cursor:help;position:relative;vertical-align:middle;z-index:5}
      .mh-inline-info:hover,.mh-inline-info:focus{border-color:#5B4CF5;color:#5B4CF5;background:#EFEDFF}
      .mh-inline-info::after{content:attr(data-explanation);position:absolute;left:0;bottom:calc(100% + 8px);width:300px;padding:12px 13px;border-radius:10px;background:#14152B;color:#fff;font:500 11px/1.55 Inter,sans-serif;text-align:left;box-shadow:0 14px 35px rgba(20,21,43,.25);opacity:0;visibility:hidden;pointer-events:none;transition:.12s;white-space:normal}
      .mh-inline-info:hover::after,.mh-inline-info:focus::after{opacity:1;visibility:visible}
      .mh-rec-explanation{margin-top:7px;padding:9px 10px;border-radius:9px;background:#F5F5FB;border:1px solid #E4E4F0;color:#3A3B57;font-size:11px;line-height:1.5}
      .mh-rec-explanation strong{color:#14152B}
      @media(max-width:560px){.mh-inline-info::after{width:240px;left:-20px}}
    `;
    document.head.appendChild(style);

    const view=document.getElementById('view');
    if(!view)return;
    const cards=[...view.querySelectorAll('.card')].filter(c=>/Acciones recomendadas/i.test(c.textContent));
    cards.forEach(card=>{
      if(card.id==='mh-recommendations')return;
      if(!card.querySelector('.mh-auto-explanation-intro')){
        const intro=document.createElement('div');
        intro.className='mh-auto-explanation-intro';
        intro.style.cssText='margin:-6px 0 12px;padding:10px 12px;border-radius:10px;background:#F5F5FB;border:1px solid #E4E4F0;color:#3A3B57;font-size:11px;line-height:1.5;';
        intro.innerHTML='<strong>¿Por qué te recomendamos esto?</strong> Marketing Hub analiza tus resultados y prioriza las acciones que pueden tener mayor impacto. Pasá el cursor por el ⓘ de cada acción para ver qué dato la genera.';
        const title=card.querySelector('.section-title');
        if(title)title.insertAdjacentElement('afterend',intro);else card.prepend(intro);
      }
      const items=card.querySelectorAll('.list-item,.alert,li');
      items.forEach((item,index)=>{
        if(item.querySelector('.mh-inline-info'))return;
        const text=item.textContent.trim();
        if(!text)return;
        let explanation='Marketing Hub detectó esta acción a partir de los datos actuales del negocio y la priorizó porque puede mejorar un resultado concreto.';
        if(/presupuesto|budget/i.test(text)) explanation='La recomendación aparece porque el sistema detectó una señal relacionada con el gasto o el presupuesto. Antes de invertir más, conviene comprobar qué acciones están generando resultados.';
        else if(/reseñ|review/i.test(text)) explanation='Las reseñas forman parte de la reputación del negocio. Las pendientes necesitan respuesta y las valoraciones bajas pueden revelar problemas que conviene corregir.';
        else if(/contenido|public|fin de semana|post/i.test(text)) explanation='Marketing Hub mira la frecuencia y planificación del contenido. Si hay pocos contenidos o días sin publicar, recomienda preparar nuevas publicaciones.';
        else if(/campaña|instagram|promo/i.test(text)) explanation='El sistema compara inversión, consultas y ventas de las campañas para detectar cuáles están funcionando mejor y cuáles necesitan ajustes.';
        const title=item.querySelector('strong,h3,h4');
        const target=title||item.firstElementChild||item;
        target.insertAdjacentHTML('beforeend',`<span class="mh-inline-info" tabindex="0" role="button" data-explanation="${explanation.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}" aria-label="Por qué se recomienda">i</span>`);
        const detail=document.createElement('div');
        detail.className='mh-rec-explanation';
        detail.innerHTML='<strong>Por qué:</strong> '+explanation;
        item.appendChild(detail);
      });
    });
  }

  const READY_CLASS='mh-product-upgrades-ready';
  function injectStyles(){
    if(document.getElementById('mh-product-upgrades-style'))return;
    const style=document.createElement('style');style.id='mh-product-upgrades-style';style.textContent=`
      .mh-status-banner{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;margin-bottom:18px;border:1px solid #DDD8FF;border-radius:14px;background:linear-gradient(135deg,#F4F1FF,#fff)}
      .mh-status-icon{width:34px;height:34px;flex:0 0 34px;border-radius:10px;background:#5B4CF5;color:#fff;display:grid;place-items:center;font-weight:800}
      .mh-status-banner strong{display:block;font-size:13px;margin-bottom:4px}.mh-status-banner p{font-size:11px;color:#6B6C86;line-height:1.45;margin:0}
      .mh-status-banner button{border:0;background:transparent;color:#5B4CF5;font-size:11px;font-weight:800;padding:0;margin-top:7px}
      .mh-checklist{display:grid;gap:8px;margin-top:12px}.mh-check{display:flex;align-items:center;gap:8px;font-size:11px;color:#3A3B57}.mh-check-dot{width:8px;height:8px;border-radius:50%;background:#A6A7BC}.mh-check.done .mh-check-dot{background:#1E9E6B}.mh-check.done{color:#1E9E6B}
      @media(max-width:560px){.mh-status-banner{padding:12px}.mh-status-icon{display:none}}
    `;document.head.appendChild(style);
  }
  function getBusiness(){try{return JSON.parse(localStorage.getItem('mh_workspace')||'{}')}catch(_){return {}}}
  function escapeHtml(value){return String(value).replace(/[&<>\"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));}
  function addProductBanner(){
    if(document.querySelector('.mh-status-banner')||!document.getElementById('view')||!localStorage.getItem('mh_session'))return;
    const container=document.querySelector('.container');if(!container)return;
    const business=getBusiness(),name=business.name||'tu negocio';
    const banner=document.createElement('section');banner.className='mh-status-banner';banner.innerHTML=`<div class="mh-status-icon">M</div><div><strong>Marketing Hub listo para trabajar con ${escapeHtml(name)}</strong><p>Completá la información del negocio y cargá tus primeros datos para obtener un dashboard útil.</p><div class="mh-checklist"><div class="mh-check ${business.name?'done':''}"><span class="mh-check-dot"></span>Información del negocio</div><div class="mh-check"><span class="mh-check-dot"></span>Primera campaña</div><div class="mh-check"><span class="mh-check-dot"></span>Primer cliente</div><div class="mh-check"><span class="mh-check-dot"></span>Primer contenido</div></div><button type="button" id="mh-hide-banner">Ocultar este aviso</button></div>`;
    container.prepend(banner);document.getElementById('mh-hide-banner')?.addEventListener('click',()=>{sessionStorage.setItem('mh_banner_hidden','1');banner.remove();});
  }
  function improveForms(){
    document.querySelectorAll('input[type="email"]').forEach(input=>{input.setAttribute('autocomplete','email');input.setAttribute('inputmode','email')});
    document.querySelectorAll('input[type="password"]').forEach(input=>input.setAttribute('autocomplete','current-password'));
    document.querySelectorAll('button').forEach(button=>{if(!button.getAttribute('aria-label')&&!button.textContent.trim())button.setAttribute('aria-label','Acción')});
  }
  function boot(){
    injectAuthUi(); injectRecommendations();
    if(document.documentElement.classList.contains(READY_CLASS))return;
    document.documentElement.classList.add(READY_CLASS);injectStyles();improveForms();
    if(!sessionStorage.getItem('mh_banner_hidden'))addProductBanner();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  setTimeout(boot,500);setTimeout(boot,1500);
  setTimeout(addRecommendationExplanations,900);
  setTimeout(addRecommendationExplanations,1800);
  setTimeout(addRecommendationExplanations,3000);
})();