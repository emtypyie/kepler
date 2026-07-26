const express = require('express');
const fs = require('fs');
const path = require('path');

const { readUsers, writeUsers, makeToken, hashPassword, verifyPassword, requireAuth } = require('./core/auth');

const app = express();
const PORT = 41783;
const USERS_FILE = path.join(__dirname, 'users.json');

if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf-8');

app.use(express.json({ limit: '5mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

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

app.put('/api/auth/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!verifyPassword(currentPassword, req.user.password)) return res.status(400).json({ error: 'Current password incorrect' });
  const users = readUsers();
  const user = users.find(u => u.username === req.user.username);
  if (user) user.password = hashPassword(newPassword);
  writeUsers(users);
  res.json({ ok: true });
});

app.get('/api/auth/profile', requireAuth, (req, res) => {
  res.json({ username: req.user.username, email: req.user.email || '', avatar: req.user.avatar || '' });
});

app.put('/api/auth/profile', requireAuth, (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.username === req.user.username);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { username, email, avatar } = req.body;
  if (username !== undefined && username !== req.user.username) {
    if (users.find(u => u.username === username)) {
      return res.status(409).json({ error: 'Username taken' });
    }
    user.username = username;
    delete user.token;
    writeUsers(users);
    return res.json({ username, token: '', changed: true });
  }
  if (email !== undefined) user.email = email;
  if (avatar !== undefined) user.avatar = avatar;
  writeUsers(users);
  res.json({ ok: true });
});

app.get('/api/auth/check-username', (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const users = readUsers();
  const available = !users.find(u => u.username === username);
  const suggestions = [];
  if (!available) {
    const vowels = 'aeiou';
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    for (let i = 0; i < 5; i++) {
      let s = '';
      const len = 7 + Math.floor(Math.random() * 4);
      for (let j = 0; j < len; j++) {
        s += j % 2 === 0 ? consonants[Math.floor(Math.random() * consonants.length)] : vowels[Math.floor(Math.random() * vowels.length)];
      }
      if (!users.find(u => u.username === s)) suggestions.push(s);
      if (suggestions.length >= 3) break;
    }
  }
  res.json({ available, suggestions });
});

app.delete('/api/auth/account', requireAuth, (req, res) => {
  let users = readUsers();
  const idx = users.findIndex(u => u.username === req.user.username);
  if (idx !== -1) users.splice(idx, 1);
  writeUsers(users);
  res.json({ ok: true });
});

const services = [
  require('./services/ediary/index'),
  require('./services/pyieos/index'),
];

for (const service of services) {
  try {
    service.register(app);
    console.log(`  Loaded service: ${service.name || 'unknown'}`);
  } catch (e) {
    console.error(`  Failed to load service ${service.name}:`, e.message);
  }
}

app.listen(PORT, () => {
  console.log(`Kepler backend running on http://localhost:${PORT}`);
  console.log(`Services: ediary, pyieos`);
  console.log(`Auto-start scripts in setup/`);
});
