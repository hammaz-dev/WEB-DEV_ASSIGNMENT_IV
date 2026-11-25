const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const appEvents = require('../events/appEvents');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { username, email, password, adminKey } = req.body || {};

  if (!username || !email || !password)
    return res.status(400).json({ message: 'username, email and password are required' });
  if (username.trim().length < 3)
    return res.status(400).json({ message: 'username must be at least 3 characters' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Invalid email format' });
  if (password.length < 6)
    return res.status(400).json({ message: 'password must be at least 6 characters' });

  const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
  if (exists) return res.status(409).json({ message: 'Username or email already in use' });

  const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
  const hash = await bcrypt.hash(password, rounds);

  const role =
    adminKey && process.env.ADMIN_SIGNUP_KEY && adminKey === process.env.ADMIN_SIGNUP_KEY
      ? 'admin'
      : 'user';

  const user = await User.create({ username, email, password: hash, role });
  appEvents.emit('user:registered', user);

  res.status(201).json({
    message: 'User registered',
    id: user._id,
    username: user.username,
    email: user.email,
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: 'email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase() });
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) {
    appEvents.emit('user:loginFailed', email);
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  appEvents.emit('user:login', user);
  // Also set as an httpOnly cookie so Postman / browsers can reuse it.
  res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 60 * 60 * 1000 });
  res.status(200).json({ message: 'Login successful', token });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me  (protected route)
router.get('/me', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

module.exports = router;
