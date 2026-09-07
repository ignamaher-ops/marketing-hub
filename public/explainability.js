(() => {
  'use strict';
  if (window.__marketingExplainabilityLoaded) return;
  window.__marketingExplainabilityLoaded = true;

  // Explainability is intentionally progressive: only elements that explicitly
  // opt in with data-explain receive an information icon. This prevents icons
  // from leaking into lists, notifications, KPIs or unrelated UI elements.
  const style = document.createElement('style');
  style.textContent = `
    .mh-explainable{position:relative!important}
    .mh-info-wrap{display:inline-flex!important;align-items:center!important;position:relative!important;vertical-align:middle!important;width:auto!important;height:auto!important;float:none!important;transform:none!important}
    .mh-info-trigger{position:static!important;inset:auto!important;transform:none!important;width:18px!important;height:18px!important;min-width:18px!important;min-height:18px!important;border:0!important;background:#f1efff!important;color:#5b4cf5!important;border-radius:50%!important;display:inline-grid!important;place-items:center!important;font:800 10px/1 Inter,sans-serif!important;padding:0!important;margin-left:7px!important;vertical-align:middle!important;cursor:help!important;flex:0 0 auto!important;box-shadow:none!important}
    .mh-info-trigger:hover,.mh-info-trigger:focus-visible{background:#5b4cf5!important;color:#fff!important;outline:none!important;box-shadow:0 0 0 3px #efedff!important}
    .mh-info-popover{position:absolute!important;z-index:1200!important;right:0!important;top:29px!important;width:min(330px,calc(100vw - 36px))!important;background:#14152b!important;color:#fff!important;border-radius:12px!important;padding:13px 14px!important;box-shadow:0 16px 42px rgba(20,21,43,.24)!important;font:500 11px/1.5 Inter,sans-serif!important;display:none!important;text-align:left!important;white-space:normal!important}
    .mh-info-popover.open{display:block!important}
    .mh-info-popover:before{content:'';position:absolute;right:5px;top:-5px;width:10px;height:10px;background:#14152b;transform:rotate(45deg)}
    .mh-info-title{font:800 11px Sora,Inter,sans-serif;margin-bottom:8px;color:#fff}
    .mh-info-line{margin-top:7px;color:#e8e8f1}.mh-info-line:first-of-type{margin-top:0}
    .mh-info-label{color:#bdb9ff;font-size:9px;text-transform:uppercase;letter-spacing:.05em;font-weight:800;margin-right:4px}
    .mh-info-source{margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,.12);font-size:9px;color:#aaaac1}
    @media(max-width:560px){.mh-info-popover{position:fixed!important;right:14px!important;top:auto!important;bottom:14px!important;width:calc(100vw - 28px)!important}}
  `;
  document.head.appendChild(style);

  function cleanText(value, max = 360) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function isCandidate(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (el.closest('.mh-info-popover')) return false;
    if (el.dataset.explainable === 'false') return false;
    if (!el.matches('[data-explain]')) return false;
    if (el.closest('.hidden,[hidden]')) return false;
    if (el.querySelector(':scope > .mh-info-wrap')) return false;
    return true;
  }

  function infer(el) {
    const heading = cleanText(el.querySelector('h2,h3,.section-title')?.innerText, 160) || 'Este análisis';
    const body = cleanText(el.querySelector('[data-explain-conclusion], p, small')?.innerText, 360) || cleanText(el.innerText, 360);
    const analysis = cleanText(el.dataset.explainAnalysis, 360) || `Compara los datos de “${heading}” con el contexto disponible del negocio.`;
    const conclusion = cleanText(el.dataset.explainConclusion, 360) || body || 'La conclusión se basa en los datos disponibles en este módulo.';
    const why = cleanText(el.dataset.explainWhy, 360) || 'Se sugiere esta acción porque responde al hallazgo detectado y prioriza un posible impacto comercial.';
    const source = cleanText(el.dataset.explainSource, 180) || 'Datos disponibles en este módulo.';
    return { heading, analysis, conclusion, why, source };
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[char]);
  }

  function closeAll(except) {
    document.querySelectorAll('.mh-info-popover.open').forEach(pop => {
      if (pop !== except) pop.classList.remove('open');
    });
  }

  function attach(el) {
    if (!isCandidate(el)) return;
    el.classList.add('mh-explainable');
    el.dataset.mhExplainAttached = 'true';

    const anchor = el.querySelector('h2,h3,.section-title') || el.firstElementChild || el;
    const wrap = document.createElement('span');
    wrap.className = 'mh-info-wrap';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'mh-info-trigger';
    trigger.setAttribute('aria-label', 'Ver por qué Marketing Hub recomienda esto');
    trigger.title = '¿Por qué?';
    trigger.textContent = 'i';

    const info = infer(el);
    const pop = document.createElement('div');
    pop.className = 'mh-info-popover';
    pop.setAttribute('role', 'tooltip');
    pop.innerHTML = `
      <div class="mh-info-title">¿Por qué Marketing Hub recomienda esto?</div>
      <div class="mh-info-line"><span class="mh-info-label">Analiza</span>${escapeHtml(info.analysis)}</div>
      <div class="mh-info-line"><span class="mh-info-label">Concluye</span>${escapeHtml(info.conclusion)}</div>
      <div class="mh-info-line"><span class="mh-info-label">Sugiere</span>${escapeHtml(info.why)}</div>
      <div class="mh-info-source">Fuente: ${escapeHtml(info.source)}</div>
    `;

    trigger.addEventListener('mouseenter', () => { closeAll(pop); pop.classList.add('open'); });
    trigger.addEventListener('mouseleave', () => setTimeout(() => { if (!pop.matches(':hover')) pop.classList.remove('open'); }, 120));
    trigger.addEventListener('focus', () => { closeAll(pop); pop.classList.add('open'); });
    trigger.addEventListener('blur', () => setTimeout(() => { if (!pop.matches(':hover')) pop.classList.remove('open'); }, 120));
    trigger.addEventListener('click', event => {
      event.stopPropagation();
      const open = pop.classList.contains('open');
      closeAll();
      if (!open) pop.classList.add('open');
    });
    pop.addEventListener('mouseleave', () => pop.classList.remove('open'));

    wrap.appendChild(trigger);
    wrap.appendChild(pop);
    if (anchor.matches('h2,h3,.section-title')) anchor.appendChild(wrap);
    else el.insertBefore(wrap, el.firstChild);
  }

  function cleanupUnexpectedIcons() {
    document.querySelectorAll('.mh-info-wrap').forEach(wrap => {
      const owner = wrap.closest('[data-explain]');
      if (!owner || owner.closest('.hidden,[hidden]')) wrap.remove();
    });
  }

  function scan(root = document) {
    cleanupUnexpectedIcons();
    root.querySelectorAll?.('[data-explain]').forEach(attach);
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('.mh-info-wrap')) closeAll();
  });

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) scan(node);
    }));
  });

  function start() {
    scan();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
