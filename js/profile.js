let profileData = {};
let newUsername = '';
let cropper = null;
let isEditing = false;
let hasChanges = false;
let pendingNav = null;

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

function toggleEdit() {
  isEditing = !isEditing;
  const btn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const inputs = document.querySelectorAll('#profileEmail, #profileUsername');
  const fileInput = document.getElementById('avatarInput');
  const checkBtn = document.getElementById('checkUsernameBtn');
  const hints = document.querySelectorAll('.field-hint');

  if (isEditing) {
    btn.textContent = 'Cancel';
    btn.className = 'btn btn-danger';
    saveBtn.style.display = 'inline-block';
    inputs.forEach(i => i.disabled = false);
    fileInput.disabled = false;
    checkBtn.style.display = 'inline-block';
    hints.forEach(h => h.style.display = 'none');
  } else {
    btn.textContent = 'Edit';
    btn.className = 'btn btn-secondary';
    saveBtn.style.display = 'none';
    inputs.forEach(i => i.disabled = true);
    fileInput.disabled = true;
    checkBtn.style.display = 'none';
    document.getElementById('usernameStatus').textContent = '';
    document.getElementById('usernameSuggestions').innerHTML = '';
    document.getElementById('saveUsernameBtn').style.display = 'none';
    hints.forEach(h => h.style.display = '');
    if (hasChanges) discardAll();
  }
}

function markChanged() {
  if (!isEditing) return;
  hasChanges = true;
}

document.getElementById('profileEmail').addEventListener('input', markChanged);
document.getElementById('profileUsername').addEventListener('input', markChanged);

document.getElementById('avatarInput').addEventListener('change', function() {
  if (!isEditing) return;
  const file = this.files[0];
  if (!file) return;
  markChanged();
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('cropImage').src = e.target.result;
    document.getElementById('cropModal').style.display = 'flex';
    if (cropper) cropper.destroy();
    cropper = new Cropper(document.getElementById('cropImage'), {
      aspectRatio: 1, viewMode: 1, dragMode: 'move',
      autoCropArea: 1, cropBoxMovable: true, cropBoxResizable: true,
      zoomable: true, scalable: true,
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
  profileData._newAvatar = dataUrl;
  document.getElementById('avatarPreview').innerHTML = `<img src="${dataUrl}" class="avatar-img">`;
  showMsg('Avatar selected. Click Save to commit.', 'success');
  closeCrop();
}

async function saveAll() {
  const user = auth.getUser();
  if (!user) return;
  const email = document.getElementById('profileEmail').value.trim();

  if (newUsername) {
    const res = await fetch(`${getBackendUrl()}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': user.token },
      body: JSON.stringify({ username: newUsername }),
    });
    const data = await res.json();
    if (data.error) { showMsg(data.error); return; }
    auth.clearUser();
    hasChanges = false;
    hideUnsavedBar();
    showMsg('Username changed! Sign in again.', 'success');
    setTimeout(() => { window.location.href = '/'; }, 2000);
    return;
  }

  const updates = {};
  if (profileData._newAvatar) updates.avatar = profileData._newAvatar;
  if (email !== profileData.email) updates.email = email;

  if (!Object.keys(updates).length) {
    hasChanges = false;
    hideUnsavedBar();
    return;
  }

  try {
    const res = await fetch(`${getBackendUrl()}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': user.token },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.error) { showMsg(data.error); return; }
    hasChanges = false;
    hideUnsavedBar();
    profileData = { ...profileData, ...updates };
    delete profileData._newAvatar;
    showMsg('Profile saved!', 'success');
    if (isEditing) toggleEdit();
  } catch { showMsg('Backend unreachable'); }
}

function discardAll() {
  hasChanges = false;
  newUsername = '';
  profileData._newAvatar = null;
  hideUnsavedBar();
  document.getElementById('profileEmail').value = profileData.email || '';
  document.getElementById('profileUsername').value = profileData.username;
  if (profileData.avatar) {
    document.getElementById('avatarPreview').innerHTML = `<img src="${profileData.avatar}" class="avatar-img">`;
  } else {
    document.getElementById('avatarPreview').innerHTML = 'U';
  }
  document.getElementById('usernameStatus').textContent = '';
  document.getElementById('usernameSuggestions').innerHTML = '';
  document.getElementById('saveUsernameBtn').style.display = 'none';
}

function handleUnsaved(action) {
  if (action === 'commit') {
    saveAll().then(() => {
      if (!hasChanges && pendingNav) {
        window.location.href = pendingNav;
      }
    });
  } else {
    discardAll();
    if (pendingNav) window.location.href = pendingNav;
  }
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
  markChanged();
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
    hasChanges = false;
    hideUnsavedBar();
    showMsg('Username changed! Please sign in again.', 'success');
    setTimeout(() => { window.location.href = '/'; }, 2000);
  } catch { showMsg('Backend unreachable'); }
}

function showUnsavedBar() {
  document.getElementById('unsavedBar').style.display = 'flex';
}

function hideUnsavedBar() {
  document.getElementById('unsavedBar').style.display = 'none';
}

function showMsg(text, type) {
  const el = document.getElementById('profileMsg');
  el.textContent = text;
  el.style.color = type === 'success' ? '#4caf50' : '#f44336';
}

async function saveAll() {
  const user = auth.getUser();
  if (!user) return;
  const url = `${getBackendUrl()}/api/auth/profile`;

  try {
    const email = document.getElementById('profileEmail').value.trim();
    if (email) {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': user.token },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
    }

    const newUsername = document.getElementById('profileUsername').value.trim();
    if (newUsername && newUsername !== profileData.username) {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': user.token },
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.changed) {
        const u = auth.getUser();
        u.username = newUsername;
        const storage = localStorage.getItem('kepler_user') ? localStorage : sessionStorage;
        storage.setItem('kepler_user', JSON.stringify(u));
      }
    }

    showMsg('Profile saved', 'success');
    hasChanges = false;
    hideUnsavedBar();
    toggleEdit();
    setTimeout(() => { showMsg(''); }, 3000);
  } catch (e) {
    showMsg(e.message || 'Save failed', 'error');
  }
}

window.addEventListener('beforeunload', (e) => {
  if (hasChanges) { e.preventDefault(); e.returnValue = ''; }
});

document.addEventListener('click', (e) => {
  if (!hasChanges || !isEditing) return;
  const link = e.target.closest('a');
  if (!link || !link.href || link.href.startsWith('javascript:') || link.hasAttribute('data-skip-check')) return;
  e.preventDefault();
  pendingNav = link.href;
  showUnsavedBar();
});

document.addEventListener('DOMContentLoaded', loadProfile);
