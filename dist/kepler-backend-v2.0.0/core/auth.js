const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '..', 'users.json');

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

function getUserByToken(token) {
  if (!token) return null;
  const users = readUsers();
  return users.find(u => u.token === token) || null;
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization;
  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
}

module.exports = { readUsers, writeUsers, makeToken, hashPassword, verifyPassword, getUserByToken, requireAuth };
