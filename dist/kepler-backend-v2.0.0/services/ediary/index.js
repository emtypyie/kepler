const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { requireAuth } = require('../../core/auth');

const NOTES_DIR = path.join(__dirname, '..', '..', 'notes');
if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });

function register(app) {
  app.get('/api/notes', requireAuth, (req, res) => {
    const files = fs.readdirSync(NOTES_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const stat = fs.statSync(path.join(NOTES_DIR, f));
        return { name: f.replace(/\.md$/, ''), mtime: stat.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
    res.json(files);
  });

  app.get('/api/notes/:slug', requireAuth, (req, res) => {
    const filePath = path.join(NOTES_DIR, `${req.params.slug}.md`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    const content = fs.readFileSync(filePath, 'utf-8');
    const html = marked(content);
    res.json({ slug: req.params.slug, content, html });
  });

  app.post('/api/notes', requireAuth, (req, res) => {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    fs.writeFileSync(path.join(NOTES_DIR, `${title}.md`), content || '', 'utf-8');
    res.json({ slug: title });
  });

  app.put('/api/notes/:slug', requireAuth, (req, res) => {
    const { title, content } = req.body;
    const oldPath = path.join(NOTES_DIR, `${req.params.slug}.md`);
    if (title && title !== req.params.slug) {
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      fs.writeFileSync(path.join(NOTES_DIR, `${title}.md`), content || '', 'utf-8');
    } else {
      fs.writeFileSync(oldPath, content || '', 'utf-8');
    }
    res.json({ slug: title || req.params.slug });
  });

  app.delete('/api/notes/:slug', requireAuth, (req, res) => {
    const filePath = path.join(NOTES_DIR, `${req.params.slug}.md`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ ok: true });
  });
}

module.exports = { register, name: 'ediary' };
