const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const crypto = require('crypto');

const app = express();
const PORT = 41783;
const NOTES_DIR = path.join(__dirname, 'notes');
const USERS_FILE = path.join(__dirname, 'users.json');

if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf-8');

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); }
  catch { return []; }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === derived;
}

app.post('/api/auth/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const users = readUsers();
  if (users.find(u => u.username === username)) return res.status(409).json({ error: 'Username taken' });
  const token = makeToken();
  users.push({ username, password: hashPassword(password), token, createdAt: Date.now() });
  writeUsers(users);
  res.json({ username, token });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username && verifyPassword(password, u.password));
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = makeToken();
  user.token = token;
  writeUsers(users);
  res.json({ username, token });
});

app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No token' });
  const users = readUsers();
  const user = users.find(u => u.token === token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  res.json({ username: user.username });
});

app.put('/api/auth/password', (req, res) => {
  const token = req.headers.authorization;
  const { currentPassword, newPassword } = req.body;
  const users = readUsers();
  const user = users.find(u => u.token === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!verifyPassword(currentPassword, user.password)) return res.status(400).json({ error: 'Current password incorrect' });
  user.password = hashPassword(newPassword);
  writeUsers(users);
  res.json({ ok: true });
});

app.delete('/api/auth/account', (req, res) => {
  const token = req.headers.authorization;
  let users = readUsers();
  const idx = users.findIndex(u => u.token === token);
  if (idx === -1) return res.status(401).json({ error: 'Unauthorized' });
  users.splice(idx, 1);
  writeUsers(users);
  res.json({ ok: true });
});

app.get('/api/notes', (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No token' });
  const files = fs.readdirSync(NOTES_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const stat = fs.statSync(path.join(NOTES_DIR, f));
      return { name: f.replace(/\.md$/, ''), mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  res.json(files);
});

app.get('/api/notes/:slug', (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No token' });
  const filePath = path.join(NOTES_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  const content = fs.readFileSync(filePath, 'utf-8');
  const html = marked(content);
  res.json({ slug: req.params.slug, content, html });
});

app.post('/api/notes', (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No token' });
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  fs.writeFileSync(path.join(NOTES_DIR, `${title}.md`), content || '', 'utf-8');
  res.json({ slug: title });
});

app.put('/api/notes/:slug', (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No token' });
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

app.delete('/api/notes/:slug', (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No token' });
  const filePath = path.join(NOTES_DIR, `${req.params.slug}.md`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', port: PORT });
});

app.listen(PORT, () => {
  console.log(`ediary backend running on http://localhost:${PORT}`);
});
