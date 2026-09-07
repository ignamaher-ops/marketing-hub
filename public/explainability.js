(() => {
  'use strict';
  if (window.__marketingExplainabilityLoaded) return;
  window.__marketingExplainabilityLoaded = true;

  const style = document.createElement('style');
  style.textContent = `
    .mh-explainable{position:relative!important}
    .mh-info-trigger{width:22px;height:22px;border:1px solid #d9d9e8;background:#fff;color:#6b6c86;border-radius:50%;display:inline-grid;place-items:center;font:800 12px/1 Inter,sans-serif;padding:0;margin-left:7px;vertical-align:middle;cursor:help;flex:0 0 auto;transition:.15s ease;box-shadow:0 1px 2px rgba(20,21,43,.04)}
    .mh-info-trigger:hover,.mh-info-trigger:focus-visible{color:#5b4cf5;border-color:#bdb7ff;background:#f7f5ff;outline:none;box-shadow:0 0 0 3px #efedff}
    .mh-info-popover{position:absolute;z-index:1200;right:0;top:34px;width:min(360px,calc(100vw - 40px));background:#14152b;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:13px;padding:14px;box-shadow:0 18px 50px rgba(20,21,43,.28);font:500 11px/1.55 Inter,sans-serif;display:none;text-align:left}
    .mh-info-popover.open{display:block}
    .mh-info-popover:before{content:'';position:absolute;right:7px;top:-6px;width:11px;height:11px;background:#14152b;border-left:1px solid rgba(255,255,255,.12);border-top:1px solid rgba(255,255,255,.12);transform:rotate(45deg)}
    .mh-info-title{font:800 11px Sora,Inter,sans-serif;color:#fff;margin-bottom:10px;display:flex;align-items:center;gap:7px}
    .mh-info-section{margin-top:9px}.mh-info-section:first-of-type{margin-top:0}.mh-info-label{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#bdb9ff;font-weight:800;margin-bottom:2px}.mh-info-text{color:#ececf5}
    .mh-info-source{margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,.12);font-size:9px;color:#aaaac1}
    .mh-info-wrap{display:inline-flex;align-items:center;position:relative}
    @media(max-width:560px){.mh-info-popover{position:fixed;right:14px;top:auto;bottom:14px;width:calc(100vw - 28px)}}
  `;
  document.head.appendChild(style);

  const ANALYSIS_WORDS = /an[aá]lisis|insight|conclusi[oó]n|lectura|detectamos|detecta|rendimiento|tendencia|alerta|oportunidad|desempe[nñ]o/i;
  const RECOMMENDATION_WORDS = /recomend|suger|prioridad|acci[oó]n|deber[ií]a|conviene|oportunidad/i;

  function cleanText(value, max = 420) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function isCandidate(el) {
    if (!(el instanceof HTMLElement) || el.closest('.mh-info-popover')) return false;
    if (el.dataset.explainable === 'false') return false;
    if (el.querySelector('.mh-info-trigger')) return false;
    if (el.matches('[data-explain], .ai-box, .alert')) return true;
    if (!el.matches('.card, .list-item, .chart-card, .kpi')) return false;
    const text = cleanText(el.innerText, 700);
    const heading = cleanText(el.querySelector('h2,h3,strong,.section-title')?.innerText, 180);
    return ANALYSIS_WORDS.test(heading) || RECOMMENDATION_WORDS.test(heading) || ANALYSIS_WORDS.test(text.slice(0, 260)) || RECOMMENDATION_WORDS.test(text.slice(0, 260));
  }

  function infer(el) {
    const heading = cleanText(el.querySelector('h2,h3,strong,.section-title')?.innerText, 180) || 'Este análisis';
    const bodyNode = el.querySelector('[data-explain-conclusion], p, small, .list-main small, .subtitle');
    const body = cleanText(bodyNode?.innerText, 500) || cleanText(el.innerText, 500);
    const title = cleanText(el.dataset.explainTitle, 180) || heading;
    const analysis = cleanText(el.dataset.explainAnalysis, 500) || `Marketing Hub toma los datos visibles en “${title}” y los interpreta en conjunto con el contexto disponible del negocio. Los valores y comparaciones mostrados en esta sección son la evidencia de partida.`;
    const conclusion = cleanText(el.dataset.explainConclusion, 500) || body || 'La conclusión se basa en los datos disponibles para este módulo.';
    let why = cleanText(el.dataset.explainWhy, 500);
    if (!why) {
      if (RECOMMENDATION_WORDS.test(title) || RECOMMENDATION_WORDS.test(body)) {
        why = 'La recomendación busca actuar sobre el problema u oportunidad detectada en este análisis. La prioridad se define por el impacto comercial esperado y por la evidencia disponible, no solo por una métrica aislada.';
      } else if (/alerta|riesgo|ca[ií]da|bajo|negativo|0 ventas|sin ventas/i.test(`${title} ${body}`)) {
        why = 'Se marca esta situación porque el dato puede afectar el rendimiento comercial. La sugerencia apunta a corregir la causa antes de aumentar esfuerzo o presupuesto.';
      } else {
        why = 'La sugerencia se genera para convertir este hallazgo en una acción concreta. Antes de ejecutarla, Marketing Hub debe contrastarla con ventas, clientes, conversión y el período analizado cuando esos datos estén disponibles.';
      }
    }
    const source = cleanText(el.dataset.explainSource, 220) || 'Datos y métricas disponibles en este módulo.';
    return { title, analysis, conclusion, why, source };
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
    trigger.setAttribute('aria-label', 'Ver explicación del análisis');
    trigger.title = '¿Cómo llegó Marketing Hub a esta conclusión?';
    trigger.textContent = 'i';

    const info = infer(el);
    const pop = document.createElement('div');
    pop.className = 'mh-info-popover';
    pop.setAttribute('role', 'tooltip');
    pop.innerHTML = `
      <div class="mh-info-title">ⓘ Cómo llegó Marketing Hub a esta conclusión</div>
      <div class="mh-info-section"><div class="mh-info-label">Qué analiza</div><div class="mh-info-text">${escapeHtml(info.analysis)}</div></div>
      <div class="mh-info-section"><div class="mh-info-label">Conclusión</div><div class="mh-info-text">${escapeHtml(info.conclusion)}</div></div>
      <div class="mh-info-section"><div class="mh-info-label">Por qué sugiere esto</div><div class="mh-info-text">${escapeHtml(info.why)}</div></div>
      <div class="mh-info-source">Fuente: ${escapeHtml(info.source)}</div>
    `;

    trigger.addEventListener('mouseenter', () => { closeAll(pop); pop.classList.add('open'); });
    trigger.addEventListener('mouseleave', () => { setTimeout(() => { if (!pop.matches(':hover')) pop.classList.remove('open'); }, 120); });
    trigger.addEventListener('focus', () => { closeAll(pop); pop.classList.add('open'); });
    trigger.addEventListener('blur', () => { setTimeout(() => { if (!pop.matches(':hover')) pop.classList.remove('open'); }, 120); });
    trigger.addEventListener('click', event => { event.stopPropagation(); const open = pop.classList.contains('open'); closeAll(); if (!open) pop.classList.add('open'); });
    pop.addEventListener('mouseleave', () => pop.classList.remove('open'));

    wrap.appendChild(trigger);
    wrap.appendChild(pop);
    if (anchor.matches('h2,h3,strong,.section-title')) anchor.appendChild(wrap);
    else el.insertBefore(wrap, el.firstChild);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[char]);
  }

  function scan(root = document) {
    root.querySelectorAll?.('.card,.list-item,.chart-card,.kpi,.ai-box,.alert,[data-explain]').forEach(attach);
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('.mh-info-wrap')) closeAll();
  });

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (isCandidate(node)) attach(node);
          scan(node);
        }
      });
    }
  });

  function start() {
    scan();
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
