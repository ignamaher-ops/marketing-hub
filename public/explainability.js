(() => {
  'use strict';
  if (window.__marketingExplainabilityLoaded) return;
  window.__marketingExplainabilityLoaded = true;

  const style = document.createElement('style');
  style.textContent = `
    .mh-explainable{position:relative!important}
    .mh-info-wrap{display:inline-flex;align-items:center;position:relative}
    .mh-info-trigger{width:18px;height:18px;border:0;background:#f1efff;color:#5b4cf5;border-radius:50%;display:inline-grid;place-items:center;font:800 10px/1 Inter,sans-serif;padding:0;margin-left:6px;vertical-align:middle;cursor:help;flex:0 0 auto;transition:.15s ease}
    .mh-info-trigger:hover,.mh-info-trigger:focus-visible{background:#5b4cf5;color:#fff;outline:none;box-shadow:0 0 0 3px #efedff}
    .mh-info-popover{position:absolute;z-index:1200;right:0;top:29px;width:min(330px,calc(100vw - 36px));background:#14152b;color:#fff;border-radius:12px;padding:13px 14px;box-shadow:0 16px 42px rgba(20,21,43,.24);font:500 11px/1.5 Inter,sans-serif;display:none;text-align:left}
    .mh-info-popover.open{display:block}
    .mh-info-popover:before{content:'';position:absolute;right:5px;top:-5px;width:10px;height:10px;background:#14152b;transform:rotate(45deg)}
    .mh-info-title{font:800 11px Sora,Inter,sans-serif;margin-bottom:8px;color:#fff}
    .mh-info-line{margin-top:7px;color:#e8e8f1}.mh-info-line:first-of-type{margin-top:0}
    .mh-info-label{color:#bdb9ff;font-size:9px;text-transform:uppercase;letter-spacing:.05em;font-weight:800;margin-right:4px}
    .mh-info-source{margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,.12);font-size:9px;color:#aaaac1}
    @media(max-width:560px){.mh-info-popover{position:fixed;right:14px;top:auto;bottom:14px;width:calc(100vw - 28px)}}
  `;
  document.head.appendChild(style);

  const RELEVANT = /an[aá]lisis|insight|conclusi[oó]n|recomend|suger|prioridad|oportunidad|alerta|problema|rendimiento|tendencia|desempe[nñ]o/i;

  function cleanText(value, max = 360) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function isCandidate(el) {
    if (!(el instanceof HTMLElement) || el.closest('.mh-info-popover')) return false;
    if (el.dataset.explainable === 'false' || el.querySelector('.mh-info-trigger')) return false;
    // Explicit explainability always wins. Otherwise only target actual insight/alert blocks,
    // not every KPI, card or chart on the dashboard.
    if (el.matches('[data-explain], .ai-box, .alert')) return true;
    if (!el.matches('.list-item')) return false;
    const heading = cleanText(el.querySelector('h2,h3,strong')?.innerText, 160);
    return RELEVANT.test(heading);
  }

  function infer(el) {
    const heading = cleanText(el.querySelector('h2,h3,strong,.section-title')?.innerText, 160) || 'Este análisis';
    const body = cleanText(el.querySelector('[data-explain-conclusion], p, small, .list-main small')?.innerText, 360) || cleanText(el.innerText, 360);
    const analysis = cleanText(el.dataset.explainAnalysis, 360) || `Compara los datos de “${heading}” con el contexto disponible del negocio.`;
    const conclusion = cleanText(el.dataset.explainConclusion, 360) || body || 'La conclusión se basa en los datos disponibles en este módulo.';
    const why = cleanText(el.dataset.explainWhy, 360) || `Se sugiere esta acción porque busca responder al hallazgo detectado y priorizar impacto comercial. No se basa en una métrica aislada.`;
    const source = cleanText(el.dataset.explainSource, 180) || 'Datos disponibles en este módulo.';
    return { heading, analysis, conclusion, why, source };
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[char]);
  }

  function closeAll(except) {
    document.querySelectorAll('.mh-info-popover.open').forEach(pop => { if (pop !== except) pop.classList.remove('open'); });
  }

  function attach(el) {
    if (!isCandidate(el)) return;
    el.classList.add('mh-explainable');
    const anchor = el.querySelector('h2,h3,strong,.section-title') || el.firstElementChild || el;
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
    trigger.addEventListener('click', event => { event.stopPropagation(); const open = pop.classList.contains('open'); closeAll(); if (!open) pop.classList.add('open'); });
    pop.addEventListener('mouseleave', () => pop.classList.remove('open'));

    wrap.appendChild(trigger);
    wrap.appendChild(pop);
    if (anchor.matches('h2,h3,strong,.section-title')) anchor.appendChild(wrap);
    else el.insertBefore(wrap, el.firstChild);
  }

  function scan(root = document) {
    root.querySelectorAll?.('.list-item,.ai-box,.alert,[data-explain]').forEach(attach);
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('.mh-info-wrap')) closeAll();
  });

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        if (isCandidate(node)) attach(node);
        scan(node);
      }
    }));
  });

  function start() {
    scan();
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
