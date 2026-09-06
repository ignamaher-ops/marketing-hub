(() => {
  'use strict';

  function injectAuthUi(){
    if(document.getElementById('mh-auth'))return;
    if(window.MarketingHubAuth && !localStorage.getItem('mh_session')){
      const script=document.createElement('script');
      script.src='/auth-ui.js';
      script.defer=true;
      document.head.appendChild(script);
    }
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
    injectAuthUi();
    if(document.documentElement.classList.contains(READY_CLASS))return;
    document.documentElement.classList.add(READY_CLASS);injectStyles();improveForms();
    if(!sessionStorage.getItem('mh_banner_hidden'))addProductBanner();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  setTimeout(boot,500);setTimeout(boot,1500);
})();
