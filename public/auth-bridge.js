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
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    let bottom = sidebar.querySelector('.sidebar-bottom');
    if (!bottom) {
      bottom = document.createElement('div');
      bottom.className = 'sidebar-bottom';
      sidebar.appendChild(bottom);
    }
    if (!bottom.querySelector('#logout-btn')) {
      const button = document.createElement('button');
      button.id = 'logout-btn';
      button.type = 'button';
      button.setAttribute('data-action', 'logout');
      button.innerHTML = '<span style="width:20px;text-align:center;font-size:15px;">↪</span><span>Cerrar sesión</span>';
      bottom.appendChild(button);
    }
    if (!document.getElementById('mh-sidebar-scroll-style')) {
      const style = document.createElement('style');
      style.id = 'mh-sidebar-scroll-style';
      style.textContent = `
        .sidebar { overflow-y:auto; overflow-x:hidden; scrollbar-width:thin; }
        .sidebar::-webkit-scrollbar { width:6px; }
        .sidebar::-webkit-scrollbar-track { background:transparent; }
        .sidebar::-webkit-scrollbar-thumb { background:#D9D9E7; border-radius:999px; }
        .sidebar-bottom { margin-top:20px; padding-bottom:4px; }
        #logout-btn { width:100%; display:flex; align-items:center; gap:11px; }
      `;
      document.head.appendChild(style);
    }
  }

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!form || form.id !== 'login-form') return;
    event.preventDefault(); event.stopImmediatePropagation();
    try { await login(document.getElementById('login-email')?.value?.trim(), document.getElementById('login-pass')?.value || ''); }
    catch (error) { showError(error.message); }
  }, true);

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

  document.addEventListener('click', async (event) => {
    const logoutButton = event.target.closest?.('#logout-btn, [data-action="logout"], [data-page="logout"]');
    if (!logoutButton) return;
    event.preventDefault(); event.stopImmediatePropagation();
    await logout();
  }, true);

  window.MarketingHubAuth = { getCsrf, login, restoreSession, logout };
  getCsrf().catch(() => {});
  restoreSession();

  const observer = new MutationObserver(() => ensureLogoutButton());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  ensureLogoutButton();

  const simple = document.createElement('script');
  simple.src = '/simple-mode.js'; simple.defer = true;
  document.head.appendChild(simple);

  const upgrades = document.createElement('script');
  upgrades.src = '/product-upgrades.js'; upgrades.defer = true;
  document.head.appendChild(upgrades);
})();
