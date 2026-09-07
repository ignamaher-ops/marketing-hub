(() => {
  const STYLE_ID = 'mh-simple-mode-style';
  const PANEL_ID = 'mh-simple-dashboard';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID}{font-family:Inter,sans-serif}
      .mh-simple-welcome{background:#fff;border:1px solid #E4E4F0;border-radius:16px;padding:24px;margin-bottom:16px}
      .mh-simple-welcome h1{font-family:Sora,sans-serif;font-size:26px;line-height:1.2;margin:0 0 7px;color:#14152B}
      .mh-simple-welcome p{font-size:15px;color:#6B6C86;margin:0;line-height:1.5}
      .mh-simple-section-title{font-family:Sora,sans-serif;font-size:18px;margin:22px 0 12px;color:#14152B}
      .mh-simple-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      .mh-simple-card{background:#fff;border:1px solid #E4E4F0;border-radius:14px;padding:18px;min-height:130px}
      .mh-simple-label{font-size:13px;font-weight:700;color:#6B6C86;margin-bottom:10px}
      .mh-simple-value{font-family:Sora,sans-serif;font-size:28px;font-weight:800;color:#14152B;margin-bottom:6px}
      .mh-simple-note{font-size:13px;color:#6B6C86;line-height:1.45}
      .mh-simple-status{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800;margin-bottom:10px;background:#E6F7F0;color:#1E9E6B}
      .mh-simple-status.warning{background:#FCF1DF;color:#D98A1F}
      .mh-simple-status.danger{background:#FDEAEB;color:#E0454B}
      .mh-simple-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .mh-simple-action{border:1px solid #E4E4F0;background:#fff;border-radius:14px;padding:17px;text-align:left;cursor:pointer;transition:.15s}
      .mh-simple-action:hover{border-color:#5B4CF5;background:#EFEDFF}
      .mh-simple-action strong{display:block;font-size:15px;color:#14152B;margin-bottom:5px}
      .mh-simple-action span{font-size:13px;color:#6B6C86}
      .mh-simple-priority{background:linear-gradient(135deg,#F4F1FF,#fff);border:1px solid #DDD8FF;border-radius:16px;padding:20px;margin-top:16px}
      .mh-simple-priority h2{font-family:Sora,sans-serif;font-size:18px;margin-bottom:13px}
      .mh-simple-priority-item{background:#fff;border:1px solid #E4E4F0;border-radius:11px;padding:13px;margin-top:9px}
      .mh-simple-priority-item strong{font-size:14px;display:block;margin-bottom:4px}
      .mh-simple-priority-item p{font-size:13px;color:#6B6C86;line-height:1.45;margin:0}
      @media(max-width:800px){.mh-simple-grid{grid-template-columns:1fr}.mh-simple-actions{grid-template-columns:1fr}.mh-simple-welcome h1{font-size:23px}}
    `;
    document.head.appendChild(style);
  }

  function getDashboardContainer() {
    return document.querySelector('[data-page-content="dashboard"]') || document.querySelector('#dashboard') || document.querySelector('.main .container');
  }

  function showSimpleDashboard() {
    const container = getDashboardContainer();
    if (!container || container.querySelector(`#${PANEL_ID}`)) return;
    const existing = Array.from(container.children).filter(el => !el.matches('.mh-simple-preserve'));
    existing.forEach(el => { if (!el.id?.includes('sidebar') && !el.classList.contains('topbar')) el.dataset.mhOriginal = '1'; });
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="mh-simple-welcome"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#5B4CF5;font-weight:800;margin-bottom:7px">Resumen</div><h1>¿Cómo está tu negocio?</h1><p>Te mostramos solamente lo más importante para que sepas qué está pasando y qué conviene hacer.</p></div>
      <div class="mh-simple-grid"><div class="mh-simple-card"><div class="mh-simple-label">Ventas</div><div class="mh-simple-value" data-simple-sales>—</div><div class="mh-simple-note">Ventas registradas en tus campañas</div></div><div class="mh-simple-card"><div class="mh-simple-label">Clientes</div><div class="mh-simple-value" data-simple-customers>—</div><div class="mh-simple-note">Personas registradas en Marketing Hub</div></div><div class="mh-simple-card"><div class="mh-simple-label">Publicidad</div><div class="mh-simple-status" data-simple-status>Revisando</div><div class="mh-simple-note" data-simple-ad-note>Analizando el rendimiento de tus campañas.</div></div></div>
      <div class="mh-simple-priority"><h2>¿Qué deberías hacer ahora?</h2><div class="mh-simple-priority-item"><strong>Revisar tus campañas</strong><p>Marketing Hub puede comparar cuánto invertiste y cuántas ventas consiguió cada campaña.</p></div><div class="mh-simple-priority-item"><strong>Conocer a tus clientes</strong><p>Revisá quién compra, quién dejó de comprar y a quién conviene volver a contactar.</p></div></div>
      <div class="mh-simple-section-title">¿Qué querés hacer?</div><div class="mh-simple-actions"><button class="mh-simple-action" data-simple-ai="¿Cómo están mis ventas?"><strong>¿Cómo están mis ventas?</strong><span>Entendé si las ventas están mejorando o empeorando.</span></button><button class="mh-simple-action" data-simple-ai="¿Qué publicidad funciona mejor?"><strong>¿Qué publicidad funciona mejor?</strong><span>Descubrí dónde conviene invertir.</span></button><button class="mh-simple-action" data-simple-ai="¿Dónde estoy perdiendo dinero?"><strong>¿Dónde estoy perdiendo dinero?</strong><span>Encontrá campañas o acciones que necesitan atención.</span></button><button class="mh-simple-action" data-simple-ai="¿Qué debería hacer esta semana?"><strong>¿Qué debería hacer esta semana?</strong><span>Recibí tus prioridades más importantes.</span></button></div>`;
    container.insertBefore(panel, container.firstChild);
    container.querySelectorAll('[data-mh-original="1"]').forEach(el => el.classList.add('mh-simple-original'));
    panel.querySelectorAll('[data-simple-ai]').forEach(btn => btn.addEventListener('click', () => { const ai = document.querySelector('.marketing-agent-button, [data-open-marketing-agent], #marketing-agent-btn'); if (ai) ai.click(); setTimeout(() => { const input = document.querySelector('.marketing-agent-input, #marketing-agent-input, [data-marketing-agent-input]'); if (input) { input.value = btn.dataset.simpleAi; input.dispatchEvent(new Event('input', {bubbles:true})); input.focus(); } }, 250); }));
  }

  function updateSimpleMetrics() {
    const sales = document.querySelector('[data-simple-sales]'), customers = document.querySelector('[data-simple-customers]');
    if (!sales || !customers) return;
    let saleCount = 0;
    document.querySelectorAll('table tbody tr').forEach(row => { const match = (row.textContent || '').match(/\b(\d+)\s*ventas?\b/i); if (match) saleCount += Number(match[1]); });
    const customerText = document.body.innerText.match(/(\d+)\s+clientes?/i);
    sales.textContent = saleCount ? saleCount.toLocaleString('es-AR') : 'Ver detalle';
    customers.textContent = customerText ? Number(customerText[1]).toLocaleString('es-AR') : 'Ver clientes';
  }

  async function hideEmptyInsightSections() {
    try {
      const get = async url => { const r = await fetch(url, {credentials:'same-origin'}); if (!r.ok) throw new Error(url); return r.json(); };
      const [campaigns, customers, reviews, content, promotions] = await Promise.all([get('/api/campaigns'),get('/api/customers'),get('/api/reviews'),get('/api/content'),get('/api/promotions')]);
      const hasData = [campaigns.campaigns,customers.customers,reviews.reviews,content.content,promotions.promotions].some(list => Array.isArray(list) && list.length > 0);
      if (hasData) return;
      const hide = el => { if (el) { el.style.display='none'; el.setAttribute('data-mh-hidden-empty','1'); } };
      document.querySelectorAll('.mh-analysis-card,#mh-explainable-analysis').forEach(hide);
      document.querySelectorAll('.card').forEach(card => { const text=(card.textContent||'').replace(/\s+/g,' ').trim(); if (/Recomendaciones para tu negocio|Acciones recomendadas/i.test(text)) hide(card); });
    } catch (_) {}
  }

  function init() { injectStyles(); setTimeout(() => { showSimpleDashboard(); updateSimpleMetrics(); hideEmptyInsightSections(); }, 700); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
