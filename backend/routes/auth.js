import express from 'express';
import jwt from 'jsonwebtoken';
import { createUser, verifyUser } from '../data/store.js';
import auth from '../middleware/auth.js';
import { db as mem } from '../data/store.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const user = await createUser({ email, password, name: name || email.split('@')[0] });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  const user = await verifyUser(email, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user });
});

// Simple in-memory profile store piggybacking on mem.users until DB layer expanded
router.get('/me', auth, (req, res) => {
  const user = mem.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

router.patch('/me', auth, (req, res) => {
  const { name } = req.body || {};
  const user = mem.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (name) user.name = name;
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

export default router;
