(() => {
  'use strict';
  if (window.__marketingAgentV2Loaded) return;
  window.__marketingAgentV2Loaded = true;

  const style = document.createElement('style');
  style.textContent = `
    .mh-agent-backdrop{position:fixed;inset:0;background:rgba(20,21,43,.24);backdrop-filter:blur(2px);z-index:95;display:none}
    .mh-agent-backdrop.open{display:block}
    .mh-agent-panel{position:fixed;right:20px;top:84px;bottom:20px;width:min(430px,calc(100vw - 28px));background:#fff;border:1px solid #e4e4f0;border-radius:18px;box-shadow:0 24px 70px rgba(20,21,43,.24);z-index:100;display:none;overflow:hidden;font-family:Inter,sans-serif}
    .mh-agent-panel.open{display:flex;flex-direction:column}
    .mh-agent-head{padding:15px 16px;border-bottom:1px solid #e4e4f0;background:linear-gradient(135deg,#f4f1ff,#fff);display:flex;align-items:center;justify-content:space-between;gap:12px}
    .mh-agent-title{display:flex;align-items:center;gap:10px}.mh-agent-icon{width:36px;height:36px;border-radius:10px;background:#5b4cf5;color:#fff;display:grid;place-items:center;font-weight:900}.mh-agent-title strong{display:block;font:800 14px Sora,Inter,sans-serif;color:#14152b}.mh-agent-title span{display:block;font-size:10px;color:#6b6c86;margin-top:3px}
    .mh-agent-close{border:1px solid #e4e4f0;background:#fff;width:36px;height:36px;border-radius:9px;color:#3a3b57;cursor:pointer;font-size:18px}
    .mh-agent-status{padding:9px 16px;font-size:10px;color:#6b6c86;border-bottom:1px solid #eeeef5;background:#fff}.mh-agent-status b{color:#1e9e6b}
    .mh-agent-messages{flex:1;overflow:auto;padding:15px;display:grid;align-content:start;gap:10px;background:#fafafd}
    .mh-agent-msg{max-width:90%;padding:11px 12px;border-radius:13px;font-size:12px;line-height:1.55;white-space:pre-wrap}.mh-agent-msg.assistant{justify-self:start;background:#fff;border:1px solid #e4e4f0;color:#3a3b57}.mh-agent-msg.user{justify-self:end;background:#5b4cf5;color:#fff}.mh-agent-msg.loading{color:#6b6c86;font-style:italic}
    .mh-agent-sources{margin-top:7px;font-size:9px;color:#7d7e96}
    .mh-agent-quick{padding:10px 12px;border-top:1px solid #e4e4f0;background:#fff;display:flex;gap:6px;overflow:auto}.mh-agent-quick button{white-space:nowrap;border:1px solid #e4e4f0;background:#fff;border-radius:999px;padding:7px 10px;font-size:10px;color:#3a3b57;cursor:pointer}
    .mh-agent-input{padding:10px;border-top:1px solid #e4e4f0;background:#fff;display:flex;gap:8px}.mh-agent-input textarea{flex:1;resize:none;border:1px solid #e4e4f0;border-radius:10px;padding:10px 11px;min-height:42px;max-height:100px;outline:none;font:500 12px Inter,sans-serif}.mh-agent-input textarea:focus{border-color:#5b4cf5;box-shadow:0 0 0 3px #efedff}.mh-agent-send{width:44px;border:0;border-radius:10px;background:#5b4cf5;color:#fff;font-weight:900;cursor:pointer}.mh-agent-send:disabled{opacity:.5;cursor:not-allowed}
    .mh-agent-nav{margin-top:6px!important;background:#f4f1ff!important;color:#5b4cf5!important;border:1px solid #ddd8ff!important}
    @media(max-width:700px){.mh-agent-panel{right:14px;top:72px;bottom:14px;width:calc(100vw - 28px);border-radius:16px}}
  `;
  document.head.appendChild(style);

  const backdrop = document.createElement('div');
  backdrop.className = 'mh-agent-backdrop';
  document.body.appendChild(backdrop);

  const panel = document.createElement('section');
  panel.className = 'mh-agent-panel';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','Marketing Manager AI');
  panel.innerHTML = `
    <div class="mh-agent-head"><div class="mh-agent-title"><div class="mh-agent-icon">M</div><div><strong>Marketing Manager AI</strong><span>Analiza tu negocio y te dice qué hacer</span></div></div><button class="mh-agent-close" aria-label="Cerrar">×</button></div>
    <div class="mh-agent-status"><b>● Conectado</b> · Usa campañas, clientes, contenido y reseñas como contexto</div>
    <div class="mh-agent-messages" id="mh-agent-messages"></div>
    <div class="mh-agent-quick"><button data-q="¿Qué problema ves en mis ventas?">Problema en ventas</button><button data-q="¿Qué campaña debería priorizar?">Mejor campaña</button><button data-q="¿Qué debería hacer esta semana?">Plan semanal</button><button data-q="¿Qué clientes debería reactivar?">Reactivar clientes</button></div>
    <form class="mh-agent-input" id="mh-agent-form"><textarea id="mh-agent-input" placeholder="Preguntale cualquier cosa sobre tu marketing..." rows="1"></textarea><button class="mh-agent-send" type="submit">→</button></form>`;
  document.body.appendChild(panel);

  const messages=panel.querySelector('#mh-agent-messages'),input=panel.querySelector('#mh-agent-input'),form=panel.querySelector('#mh-agent-form'),send=panel.querySelector('.mh-agent-send');
  const history=[];let lastTrigger=null;
  function addMessage(role,text,source){const el=document.createElement('div');el.className=`mh-agent-msg ${role}`;el.textContent=text;if(source){const meta=document.createElement('div');meta.className='mh-agent-sources';meta.textContent=source==='openai'?'Análisis generado con IA usando los datos actuales del negocio.':'Modo demo: análisis basado en los datos disponibles. Configurá OPENAI_API_KEY para activar el modelo.';el.appendChild(meta)}messages.appendChild(el);messages.scrollTop=messages.scrollHeight;return el}
  function welcome(){if(messages.children.length)return;addMessage('assistant','Soy tu Marketing Manager. Cruzo los datos y te explico qué está pasando, por qué importa y cuál sería la próxima acción.\n\n¿Sobre qué querés que trabajemos?')}
  async function ask(question){const clean=String(question||'').trim();if(!clean||send.disabled)return;addMessage('user',clean);history.push({role:'user',content:clean});input.value='';send.disabled=true;const loading=addMessage('assistant','Analizando campañas, clientes, contenido y reseñas…');loading.classList.add('loading');try{const csrfResponse=await fetch('/api/auth/csrf',{credentials:'same-origin'});const csrf=csrfResponse.headers.get('X-CSRF-Token')||(await csrfResponse.json().catch(()=>({}))).csrfToken||'';const response=await fetch('/api/ai/marketing',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({message:clean,history:history.slice(-8)})});const result=await response.json().catch(()=>({}));loading.remove();if(!response.ok)throw new Error(result.error||'No pude analizar los datos.');addMessage('assistant',result.answer||'No encontré una respuesta útil con los datos actuales.',result.source);history.push({role:'assistant',content:result.answer||''})}catch(error){loading.remove();addMessage('assistant',`No pude completar el análisis: ${error.message}`)}finally{send.disabled=false;input.focus()}}
  function close(){panel.classList.remove('open');backdrop.classList.remove('open');if(lastTrigger)lastTrigger.focus()}
  function open(prompt,trigger){lastTrigger=trigger||document.activeElement;panel.classList.add('open');backdrop.classList.add('open');welcome();input.focus();if(prompt){input.value=prompt;setTimeout(()=>{input.focus();input.setSelectionRange(input.value.length,input.value.length)},30)}}
  window.MarketingHubAI={open,close,ask};
  panel.querySelector('.mh-agent-close').addEventListener('click',close);backdrop.addEventListener('click',close);form.addEventListener('submit',e=>{e.preventDefault();ask(input.value)});input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(input.value)}});panel.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>ask(b.dataset.q)));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open'))close()});
  function addAccess(){const nav=document.querySelector('#nav');if(nav&&!nav.querySelector('[data-mh-agent-nav]')){const b=document.createElement('button');b.dataset.mhAgentNav='1';b.className='mh-agent-nav';b.innerHTML='<span class="nav-icon">✦</span> Marketing Manager AI';b.addEventListener('click',()=>open('',b));nav.appendChild(b)}const top=document.querySelector('.top-actions');if(top&&!top.querySelector('[data-mh-agent-top]')){const b=document.createElement('button');b.className='icon-btn';b.dataset.mhAgentTop='1';b.title='Abrir Marketing Manager AI';b.setAttribute('aria-label','Abrir Marketing Manager AI');b.textContent='✦';b.addEventListener('click',()=>open('',b));top.insertBefore(b,top.firstChild)}}
  addAccess();new MutationObserver(addAccess).observe(document.body,{childList:true,subtree:true});
  const modal=document.getElementById('modal-overlay');if(modal)new MutationObserver(()=>{if(modal.classList.contains('open')&&panel.classList.contains('open'))close()}).observe(modal,{attributes:true,attributeFilter:['class']});
})();