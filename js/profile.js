let profileData = {};
let newUsername = '';
let cropper = null;

auth.redirect();

async function loadProfile() {
  const user = auth.getUser();
  if (!user) return;
  try {
    const res = await fetch(`${getBackendUrl()}/api/auth/profile`, {
      headers: { 'Authorization': user.token },
    });
    const data = await res.json();
    if (data.error) return;
    profileData = data;
    document.getElementById('profileEmail').value = data.email || '';
    document.getElementById('profileUsername').value = data.username;
    if (data.avatar) {
      document.getElementById('avatarPreview').innerHTML = `<img src="${data.avatar}" class="avatar-img">`;
    }
  } catch {}
}

document.getElementById('avatarInput').addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('cropImage').src = e.target.result;
    document.getElementById('cropModal').style.display = 'flex';
    if (cropper) cropper.destroy();
    cropper = new Cropper(document.getElementById('cropImage'), {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      cropBoxMovable: true,
      cropBoxResizable: true,
      zoomable: true,
      scalable: true,
    });
  };
  reader.readAsDataURL(file);
  this.value = '';
});

function closeCrop() {
  document.getElementById('cropModal').style.display = 'none';
  if (cropper) { cropper.destroy(); cropper = null; }
}

async function commitCrop() {
  if (!cropper) return;
  const canvas = cropper.getCroppedCanvas({ width: 256, height: 256 });
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  const user = auth.getUser();
  if (!user) return;
  try {
    const res = await fetch(`${getBackendUrl()}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': user.token },
      body: JSON.stringify({ avatar: dataUrl }),
    });
    const data = await res.json();
    if (data.error) return showMsg(data.error);
    document.getElementById('avatarPreview').innerHTML = `<img src="${dataUrl}" class="avatar-img">`;
    showMsg('Avatar updated!', 'success');
  } catch { showMsg('Backend unreachable'); }
  closeCrop();
}

async function saveEmail() {
  const email = document.getElementById('profileEmail').value.trim();
  const user = auth.getUser();
  if (!user) return;
  try {
    const res = await fetch(`${getBackendUrl()}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': user.token },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.error) return showMsg(data.error);
    showMsg('Email saved!', 'success');
  } catch { showMsg('Backend unreachable'); }
}

async function checkUsername() {
  const username = document.getElementById('profileUsername').value.trim();
  const status = document.getElementById('usernameStatus');
  const suggestions = document.getElementById('usernameSuggestions');
  const saveBtn = document.getElementById('saveUsernameBtn');
  saveBtn.style.display = 'none';
  suggestions.innerHTML = '';
  if (!username || username === profileData.username) {
    status.textContent = '';
    return;
  }
  status.textContent = 'Checking...';
  try {
    const res = await fetch(`${getBackendUrl()}/api/auth/check-username?username=${encodeURIComponent(username)}`, {
      headers: { 'Authorization': auth.getUser()?.token || '' },
    });
    const data = await res.json();
    if (data.available) {
      status.innerHTML = `<span class="available">✓ Available</span>`;
      newUsername = username;
      saveBtn.style.display = 'inline-block';
    } else {
      status.innerHTML = `<span class="taken">✗ Taken</span>`;
      if (data.suggestions && data.suggestions.length) {
        suggestions.innerHTML = '<p class="suggest-label">How about:</p>' +
          data.suggestions.map(s =>
            `<span class="suggestion" onclick="selectSuggestion('${s}')">${s}</span>`
          ).join(' ');
      }
    }
  } catch { status.textContent = 'Backend unreachable'; }
}

function selectSuggestion(s) {
  document.getElementById('profileUsername').value = s;
  checkUsername();
}

async function saveUsername() {
  if (!newUsername) return;
  const user = auth.getUser();
  if (!user) return;
  try {
    const res = await fetch(`${getBackendUrl()}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': user.token },
      body: JSON.stringify({ username: newUsername }),
    });
    const data = await res.json();
    if (data.error) return showMsg(data.error);
    auth.clearUser();
    showMsg('Username changed! Please sign in again.', 'success');
    setTimeout(() => { window.location.href = '/'; }, 2000);
  } catch { showMsg('Backend unreachable'); }
}

function showMsg(text, type) {
  const el = document.getElementById('profileMsg');
  el.textContent = text;
  el.style.color = type === 'success' ? '#4caf50' : '#f44336';
}

document.addEventListener('DOMContentLoaded', loadProfile);
