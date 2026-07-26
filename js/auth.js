const AUTH_KEY = 'kepler_user';

const auth = {
  getUser() {
    let raw = localStorage.getItem(AUTH_KEY);
    if (!raw) raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  setUser(data, stay) {
    if (stay) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    } else {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(data));
    }
  },

  clearUser() {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  },

  redirect() {
    const user = this.getUser();
    const path = window.location.pathname;
    if (!user && path !== '/' && path !== '/index.html') {
      window.location.href = '/';
    }
    if (user && (path === '/' || path === '/index.html')) {
      window.location.href = '/dashboard';
    }
  },

  async signup() {
    const username = document.getElementById('signupUser').value.trim();
    const password = document.getElementById('signupPass').value;
    const confirm = document.getElementById('signupConfirm').value;
    const err = document.getElementById('authError');

    if (!username || !password) return err.textContent = 'Fill all fields';
    if (password !== confirm) return err.textContent = 'Passwords do not match';
    if (password.length < 4) return err.textContent = 'Password too short';

    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.error) return err.textContent = data.error;
      const stay = document.getElementById('staySignedIn')?.checked || false;
      this.setUser({ username: data.username, token: data.token }, stay);
      window.location.href = '/dashboard';
    } catch {
      err.textContent = 'Backend unreachable. Is it running?';
    }
  },

  async login() {
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;
    const err = document.getElementById('authError');
    if (!username || !password) return err.textContent = 'Fill all fields';

    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.error) return err.textContent = data.error;
      const stay = document.getElementById('staySignedIn').checked;
      this.setUser({ username: data.username, token: data.token }, stay);
      window.location.href = '/dashboard';
    } catch {
      err.textContent = 'Backend unreachable. Is it running?';
    }
  },

  toggle() {
    const login = document.getElementById('loginForm');
    const signup = document.getElementById('signupForm');
    const err = document.getElementById('authError');
    err.textContent = '';
    if (login.style.display === 'none') {
      login.style.display = 'block';
      signup.style.display = 'none';
    } else {
      login.style.display = 'none';
      signup.style.display = 'block';
    }
  },

  logout() {
    this.clearUser();
    window.location.href = '/';
  },

  async changePassword(current, newPass) {
    const user = this.getUser();
    if (!user) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': user.token },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      });
      const data = await res.json();
      return data;
    } catch { return { error: 'Backend unreachable' }; }
  },

  async deleteAccount() {
    const user = this.getUser();
    if (!user) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/account`, {
        method: 'DELETE',
        headers: { 'Authorization': user.token },
      });
      const data = await res.json();
      if (data.ok) this.logout();
      return data;
    } catch { return { error: 'Backend unreachable' }; }
  },
};

function getBackendUrl() {
  return localStorage.getItem('backendUrl') || 'http://localhost:41783';
}

function toggleMenu() {
  document.getElementById('userDropdown')?.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    document.getElementById('userDropdown')?.classList.remove('open');
  }
});

function setUserUI() {
  const user = auth.getUser();
  if (!user) return;
  const avatar = document.getElementById('userAvatar');
  const dropdownUser = document.getElementById('dropdownUser');
  if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();
  if (dropdownUser) dropdownUser.textContent = user.username;
}

document.addEventListener('DOMContentLoaded', setUserUI);
