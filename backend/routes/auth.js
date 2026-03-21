const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { signToken, requireAuth } = require('../middleware/auth');
const { createUser, findUserByEmail, findUserById, getUserChatHistory } = require('../database');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many attempts. Wait 15 minutes.' }
});

// POST /api/auth/signup
router.post('/signup', limiter, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Enter a valid email address' });
  try {
    if (findUserByEmail(email.toLowerCase().trim()))
      return res.status(409).json({ error: 'An account with this email already exists' });
    const hash = await bcrypt.hash(password, 12);
    const user = createUser({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash: hash });
    const token = signToken({ id: user.id, email: user.email, name: user.name });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('[auth] signup error:', err.message);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
router.post('/login', limiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });
  try {
    const user = findUserByEmail(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    const token = signToken({ id: user.id, email: user.email, name: user.name });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('[auth] login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, created_at: user.created_at });
});

// GET /api/auth/chat-history
router.get('/chat-history', requireAuth, (req, res) => {
  try {
    res.json(getUserChatHistory(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => res.json({ message: 'Logged out' }));

module.exports = router;
