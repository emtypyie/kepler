const diary = {
  async api(path, opts = {}) {
    const user = auth.getUser();
    if (!user) { window.location.href = '/'; return; }
    const res = await fetch(`${getBackendUrl()}${path}`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': user.token },
      ...opts,
    });
    if (res.status === 401) { auth.clearUser(); window.location.href = '/'; return; }
    return res.json();
  },

  async loadList() {
    const notes = await this.api('/api/notes');
    const list = document.getElementById('noteList');
    if (!notes || notes.error || notes.length === 0) {
      list.innerHTML = '<p class="empty">No notes yet. Create your first one!</p>';
      return;
    }
    list.innerHTML = notes.map(n => `
      <div class="note-card" onclick="diary.view('${escHtml(n.name)}')">
        <h2>${escHtml(n.name)}</h2>
      </div>
    `).join('');
  },

  async view(slug) {
    const note = await this.api(`/api/notes/${encodeURIComponent(slug)}`);
    if (!note || note.error) return;
    document.getElementById('noteList').style.display = 'none';
    document.getElementById('noteEditor').style.display = 'none';
    const view = document.getElementById('noteView');
    view.style.display = 'block';
    view.innerHTML = `
      <div class="note-header">
        <h1>${escHtml(note.slug)}</h1>
        <div class="actions">
          <button class="btn" onclick="diary.showEditor('${escHtml(note.slug)}')">Edit</button>
          <button class="btn btn-danger" onclick="diary.del('${escHtml(note.slug)}')">Delete</button>
          <button class="btn btn-secondary" onclick="diary.back()">Back</button>
        </div>
      </div>
      <div class="note-content">${note.html}</div>
    `;
  },

  showEditor(slug) {
    document.getElementById('noteList').style.display = slug ? 'none' : 'block';
    document.getElementById('noteView').style.display = 'none';
    const editor = document.getElementById('noteEditor');
    editor.style.display = 'block';

    if (slug) {
      this.api(`/api/notes/${encodeURIComponent(slug)}`).then(note => {
        if (!note || note.error) return;
        editor.innerHTML = this.editorHTML(slug, note.content);
      });
    } else {
      editor.innerHTML = this.editorHTML(null, '');
    }
  },

  editorHTML(slug, content) {
    return `
      <form class="note-form" onsubmit="return diary.save(this)">
        <input type="hidden" name="origSlug" value="${slug || ''}">
        <input type="text" name="title" placeholder="Note title" value="${escHtml(slug || '')}" required>
        <textarea name="content" rows="20" placeholder="Write in Markdown...">${escHtml(content || '')}</textarea>
        <div class="form-actions">
          <button type="submit" class="btn">Save</button>
          <button type="button" class="btn btn-secondary" onclick="diary.back()">Cancel</button>
        </div>
      </form>
    `;
  },

  async save(form) {
    const data = Object.fromEntries(new FormData(form));
    const { origSlug } = data;
    delete data.origSlug;

    if (origSlug) {
      await this.api(`/api/notes/${encodeURIComponent(origSlug)}`, {
        method: 'PUT', body: JSON.stringify(data),
      });
    } else {
      await this.api('/api/notes', {
        method: 'POST', body: JSON.stringify(data),
      });
    }
    this.back();
    return false;
  },

  async del(slug) {
    if (!confirm('Delete this note?')) return;
    await this.api(`/api/notes/${encodeURIComponent(slug)}`, { method: 'DELETE' });
    this.back();
  },

  back() {
    document.getElementById('noteList').style.display = 'block';
    document.getElementById('noteView').style.display = 'none';
    document.getElementById('noteEditor').style.display = 'none';
    this.loadList();
  },
};

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

auth.redirect();
document.addEventListener('DOMContentLoaded', () => diary.loadList());
