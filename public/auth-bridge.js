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
      method: 'POST',
      credentials: 'same-origin',
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

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!form || form.id !== 'login-form') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const email = document.getElementById('login-email')?.value?.trim();
    const password = document.getElementById('login-pass')?.value || '';
    try {
      await login(email, password);
    } catch (error) {
      showError(error.message);
    }
  }, true);

  document.addEventListener('click', async (event) => {
    const logout = event.target.closest?.('#logout-btn');
    if (!logout) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      if (!csrfToken) await getCsrf();
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-CSRF-Token': csrfToken }
      });
    } finally {
      localStorage.removeItem('mh_session');
      localStorage.removeItem('mh_user');
      localStorage.removeItem('mh_workspace');
      document.getElementById('app-shell')?.classList.add('hidden');
      document.getElementById('login-screen')?.classList.remove('hidden');
    }
  }, true);

  window.MarketingHubAuth = { getCsrf, login, restoreSession };
  getCsrf().catch(() => {});
  restoreSession();
})();
