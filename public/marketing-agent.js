(() => {
  'use strict';
  if (window.__marketingAgentLoaded) return;
  window.__marketingAgentLoaded = true;

  const style = document.createElement('style');
  style.textContent = `
    .mh-agent-launcher{position:fixed;right:22px;bottom:22px;z-index:1000;border:0;border-radius:16px;background:#5b4cf5;color:#fff;padding:12px 16px;display:flex;align-items:center;gap:9px;font:800 13px Inter,sans-serif;box-shadow:0 14px 32px rgba(91,76,245,.28);cursor:pointer}
    .mh-agent-launcher:hover{background:#4636d6;transform:translateY(-1px)}
    .mh-agent-launcher .spark{width:25px;height:25px;border-radius:8px;background:rgba(255,255,255,.18);display:grid;place-items:center}
    .mh-agent-panel{position:fixed;right:22px;bottom:78px;width:min(430px,calc(100vw - 28px));height:min(650px,calc(100vh - 110px));background:#fff;border:1px solid #e4e4f0;border-radius:20px;box-shadow:0 24px 80px rgba(20,21,43,.24);z-index:999;display:none;overflow:hidden;font-family:Inter,sans-serif}
    .mh-agent-panel.open{display:flex;flex-direction:column}
    .mh-agent-head{padding:16px 17px;border-bottom:1px solid #e4e4f0;background:linear-gradient(135deg,#f4f1ff,#fff);display:flex;align-items:center;justify-content:space-between;gap:12px}
    .mh-agent-title{display:flex;align-items:center;gap:10px}.mh-agent-icon{width:36px;height:36px;border-radius:11px;background:#5b4cf5;color:#fff;display:grid;place-items:center;font-weight:900}.mh-agent-title strong{display:block;font:800 14px Sora,Inter,sans-serif;color:#14152b}.mh-agent-title span{display:block;font-size:10px;color:#6b6c86;margin-top:3px}
    .mh-agent-close{border:0;background:#fff;border:1px solid #e4e4f0;width:34px;height:34px;border-radius:9px;color:#3a3b57;cursor:pointer}
    .mh-agent-status{padding:9px 17px;font-size:10px;color:#6b6c86;border-bottom:1px solid #eeeef5;background:#fff}.mh-agent-status b{color:#1e9e6b}
    .mh-agent-messages{flex:1;overflow:auto;padding:15px;display:grid;align-content:start;gap:11px;background:#fafafd}
    .mh-agent-msg{max-width:90%;padding:11px 12px;border-radius:13px;font-size:12px;line-height:1.55;white-space:pre-wrap}.mh-agent-msg.assistant{justify-self:start;background:#fff;border:1px solid #e4e4f0;color:#3a3b57}.mh-agent-msg.user{justify-self:end;background:#5b4cf5;color:#fff}.mh-agent-msg.loading{color:#6b6c86;font-style:italic}
    .mh-agent-sources{margin-top:7px;font-size:9px;color:#7d7e96}.mh-agent-quick{padding:10px 12px;border-top:1px solid #e4e4f0;background:#fff;display:flex;gap:6px;overflow:auto}.mh-agent-quick button{white-space:nowrap;border:1px solid #e4e4f0;background:#fff;border-radius:999px;padding:7px 10px;font-size:10px;color:#3a3b57;cursor:pointer}.mh-agent-quick button:hover{border-color:#5b4cf5;color:#5b4cf5}
    .mh-agent-input{padding:10px;border-top:1px solid #e4e4f0;background:#fff;display:flex;gap:8px}.mh-agent-input textarea{flex:1;resize:none;border:1px solid #e4e4f0;border-radius:11px;padding:10px 11px;min-height:42px;max-height:100px;outline:none;font:500 12px Inter,sans-serif}.mh-agent-input textarea:focus{border-color:#5b4cf5;box-shadow:0 0 0 3px #efedff}.mh-agent-send{width:44px;border:0;border-radius:11px;background:#5b4cf5;color:#fff;font-weight:900;cursor:pointer}.mh-agent-send:disabled{opacity:.5;cursor:not-allowed}
    .mh-agent-badge{display:inline-flex;align-items:center;gap:5px;background:#e6f7f0;color:#1e9e6b;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:800;margin-left:5px}
    @media(max-width:560px){.mh-agent-launcher{right:14px;bottom:14px}.mh-agent-panel{right:14px;bottom:68px;width:calc(100vw - 28px);height:calc(100vh - 92px)}}
  `;
  document.head.appendChild(style);

  const launcher = document.createElement('button');
  launcher.className = 'mh-agent-launcher';
  launcher.innerHTML = '<span class="spark">✦</span><span>Marketing Manager AI</span>';
  document.body.appendChild(launcher);

  const panel = document.createElement('section');
  panel.className = 'mh-agent-panel';
  panel.innerHTML = `
    <div class="mh-agent-head">
      <div class="mh-agent-title"><div class="mh-agent-icon">M</div><div><strong>Marketing Manager AI</strong><span>Analiza tu negocio y te dice qué hacer</span></div></div>
      <button class="mh-agent-close" aria-label="Cerrar">×</button>
    </div>
    <div class="mh-agent-status"><b>● Conectado</b> · Usa campañas, clientes, contenido y reseñas como contexto</div>
    <div class="mh-agent-messages" id="mh-agent-messages"></div>
    <div class="mh-agent-quick">
      <button data-q="¿Qué problema ves en mis ventas?">Problema en ventas</button>
      <button data-q="¿Qué campaña debería priorizar?">Mejor campaña</button>
      <button data-q="¿Qué debería hacer esta semana?">Plan semanal</button>
      <button data-q="¿Qué clientes debería reactivar?">Reactivar clientes</button>
    </div>
    <form class="mh-agent-input" id="mh-agent-form"><textarea id="mh-agent-input" placeholder="Preguntale cualquier cosa sobre tu marketing..." rows="1"></textarea><button class="mh-agent-send" type="submit">→</button></form>
  `;
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector('#mh-agent-messages');
  const input = panel.querySelector('#mh-agent-input');
  const form = panel.querySelector('#mh-agent-form');
  const send = panel.querySelector('.mh-agent-send');
  const history = [];

  function addMessage(role, text, source) {
    const el = document.createElement('div');
    el.className = `mh-agent-msg ${role}`;
    el.textContent = text;
    if (source) {
      const meta = document.createElement('div');
      meta.className = 'mh-agent-sources';
      meta.textContent = source === 'openai' ? 'Análisis generado con IA usando los datos actuales del negocio.' : 'Modo demo: análisis basado en los datos disponibles. Configurá OPENAI_API_KEY para activar el modelo.';
      el.appendChild(meta);
    }
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function welcome() {
    if (messagesEl.children.length) return;
    addMessage('assistant', 'Soy tu Marketing Manager. No me limito a mostrar métricas: cruzo los datos y te explico qué está pasando, por qué importa y cuál sería la próxima acción.\n\n¿Sobre qué querés que trabajemos?', null);
  }

  async function ask(question) {
    const clean = question.trim();
    if (!clean || send.disabled) return;
    addMessage('user', clean);
    history.push({ role: 'user', content: clean });
    input.value = '';
    send.disabled = true;
    const loading = addMessage('assistant', 'Analizando campañas, clientes, contenido y reseñas…', null);
    loading.classList.add('loading');
    try {
      const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
      const csrf = csrfResponse.headers.get('X-CSRF-Token') || (await csrfResponse.json().catch(() => ({}))).csrfToken || '';
      const response = await fetch('/api/ai/marketing', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({ message: clean, history: history.slice(-8) })
      });
      const data = await response.json().catch(() => ({}));
      loading.remove();
      if (!response.ok) throw new Error(data.error || 'No pude analizar los datos.');
      addMessage('assistant', data.answer || 'No encontré una respuesta útil con los datos actuales.', data.source);
      history.push({ role: 'assistant', content: data.answer || '' });
    } catch (error) {
      loading.remove();
      addMessage('assistant', `No pude completar el análisis: ${error.message}`);
    } finally {
      send.disabled = false;
      input.focus();
    }
  }

  launcher.addEventListener('click', () => { panel.classList.toggle('open'); if (panel.classList.contains('open')) { welcome(); input.focus(); } });
  panel.querySelector('.mh-agent-close').addEventListener('click', () => panel.classList.remove('open'));
  form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); ask(input.value); } });
  panel.querySelectorAll('[data-q]').forEach(button => button.addEventListener('click', () => ask(button.dataset.q)));

  // Add a persistent navigation shortcut when the existing sidebar is present.
  const nav = document.querySelector('#nav');
  if (nav && !nav.querySelector('[data-mh-agent-nav]')) {
    const button = document.createElement('button');
    button.dataset.mhAgentNav = '1';
    button.innerHTML = '<span class="nav-icon">✦</span> Marketing Manager AI';
    button.addEventListener('click', () => { panel.classList.add('open'); welcome(); input.focus(); });
    nav.appendChild(button);
  }
})();
