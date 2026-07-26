auth.redirect();

if (window.location.pathname === '/dashboard') {
  const user = auth.getUser();
  if (user) document.getElementById('navUser').textContent = user.username;
  checkBackend();
}

if (window.location.pathname === '/settings') {
  const user = auth.getUser();
  if (user) {
    document.getElementById('settingsUser').textContent = user.username;
    document.getElementById('backendUrl').value = getBackendUrl();
  }
  checkBackend();
}

async function checkBackend() {
  const el = document.getElementById('backendStatus');
  if (!el) return;
  el.textContent = 'Checking...';
  try {
    const res = await fetch(`${getBackendUrl()}/api/health`);
    const data = await res.json();
    el.textContent = data.status === 'ok' ? '✅ Connected' : '❌ Error';
    el.style.color = data.status === 'ok' ? '#4caf50' : '#f44336';
  } catch {
    el.textContent = '❌ Unreachable';
    el.style.color = '#f44336';
  }
}

function saveBackendUrl() {
  const url = document.getElementById('backendUrl').value.trim();
  localStorage.setItem('backendUrl', url);
  document.getElementById('settingsMsg').textContent = 'Saved!';
  setTimeout(() => document.getElementById('settingsMsg').textContent = '', 2000);
  checkBackend();
}

async function changePassword() {
  const current = document.getElementById('currentPass').value;
  const newPass = document.getElementById('newPass').value;
  const msg = document.getElementById('settingsMsg');
  if (!current || !newPass) return msg.textContent = 'Fill both fields';
  if (newPass.length < 4) return msg.textContent = 'Password too short';
  const result = await auth.changePassword(current, newPass);
  msg.textContent = result.error || 'Password updated!';
  if (!result.error) { document.getElementById('currentPass').value = ''; document.getElementById('newPass').value = ''; }
}

async function deleteAccount() {
  if (!confirm('Delete your account permanently?')) return;
  const msg = document.getElementById('settingsMsg');
  const result = await auth.deleteAccount();
  msg.textContent = result.error || 'Account deleted.';
}
