(() => {
  let csrfToken = '';

  async function getCsrf() {
    const response = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
    const data = await response.json();
    csrfToken = data.csrfToken || response.headers.get('X-CSRF-Token') || '';
    return csrfToken;
  }

  function showError(message) {
    const existing = document.getElementById('mh-auth-error');
    if (existing) existing.remove();
    const form = document.getElementById('login-form');
    if (!form) return;
    const el = document.createElement('p');
    el.id = 'mh-auth-error';
    el.textContent = message;
    el.style.cssText = 'margin:10px 0;color:#E0454B;font-size:13px;font-weight:600;';
    form.appendChild(el);
  }

  async function login(email, password) {
    if (!csrfToken) await getCsrf();
    const response = await fetch('/api/auth/login', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'No se pudo iniciar sesión.');
    localStorage.setItem('mh_session', '1');
    localStorage.setItem('mh_user', JSON.stringify(data.user || {}));
    localStorage.setItem('mh_workspace', JSON.stringify(data.workspace || {}));
    if (typeof bootApp === 'function') bootApp();
  }

  async function restoreSession() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (!response.ok) return;
      const data = await response.json();
      if (!data.authenticated) return;
      localStorage.setItem('mh_session', '1');
      localStorage.setItem('mh_user', JSON.stringify(data.user || {}));
      localStorage.setItem('mh_workspace', JSON.stringify(data.workspace || {}));
      if (typeof bootApp === 'function') bootApp();
    } catch (_) {}
  }

  function ensureLogoutButton() {
    if (document.getElementById('logout-btn')) return;
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'mh-logout-wrap';
    wrapper.style.cssText = 'margin-top:auto;padding:12px 14px 2px;';

    const button = document.createElement('button');
    button.id = 'logout-btn';
    button.type = 'button';
    button.textContent = 'Cerrar sesión';
    button.setAttribute('aria-label', 'Cerrar sesión');
    button.style.cssText = 'width:100%;border:1px solid #E4E4F0;background:#fff;color:#E0454B;padding:10px 12px;border-radius:10px;text-align:left;font-weight:700;font-size:13px;cursor:pointer;';
    button.addEventListener('mouseenter', () => { button.style.background = '#FDEAEB'; });
    button.addEventListener('mouseleave', () => { button.style.background = '#fff'; });

    wrapper.appendChild(button);
    sidebar.appendChild(wrapper);
  }

  async function logout() {
    try {
      if (!csrfToken) await getCsrf();
      await fetch('/api/auth/logout', { method:'POST', credentials:'same-origin', headers:{'X-CSRF-Token':csrfToken} });
    } catch (_) {}
    localStorage.removeItem('mh_session');
    localStorage.removeItem('mh_user');
    localStorage.removeItem('mh_workspace');
    sessionStorage.clear();
    document.getElementById('app-shell')?.classList.add('hidden');
    document.getElementById('login-screen')?.classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!form || form.id !== 'login-form') return;
    event.preventDefault(); event.stopImmediatePropagation();
    try { await login(document.getElementById('login-email')?.value?.trim(), document.getElementById('login-pass')?.value || ''); }
    catch (error) { showError(error.message); }
  }, true);

  document.addEventListener('click', async (event) => {
    const logoutButton = event.target.closest?.('#logout-btn, [data-action="logout"], [data-page="logout"]');
    if (!logoutButton) return;
    event.preventDefault(); event.stopImmediatePropagation();
    await logout();
  }, true);

  window.MarketingHubAuth = { getCsrf, login, restoreSession, logout };

  function init() {
    ensureLogoutButton();
    getCsrf().catch(() => {});
    restoreSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }

  const upgrades = document.createElement('script');
  upgrades.src = '/product-upgrades.js'; upgrades.defer = true;
  document.head.appendChild(upgrades);
})();
