(() => {
  'use strict';

  if (!document.querySelector('script[data-mh-dashboard-redesign]')) {
    const script = document.createElement('script');
    script.src = '/dashboard-redesign.js?v=6d2bc567';
    script.dataset.mhDashboardRedesign = 'true';
    document.head.appendChild(script);
  }

  // Keep AI actions connected without adding another visual layer to the dashboard.
  function wireAI() {
    if (typeof window.MarketingHubAI?.open !== 'function') return;
    document.querySelectorAll('[data-mh-ai]').forEach(el => {
      if (el.dataset.mhAiWired === '1') return;
      el.dataset.mhAiWired = '1';
      el.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        window.MarketingHubAI.open(el.dataset.mhAi, el);
      }, true);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireAI, {once:true});
  else wireAI();
  new MutationObserver(wireAI).observe(document.body, {childList:true, subtree:true});
})();