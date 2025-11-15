import express from 'express';
import auth from '../middleware/auth.js';
import { addMonitoring } from '../data/store.js';

const router = express.Router();

router.post('/', auth, (req, res) => {
  const { deviceId, metrics, status, timestamp } = req.body || {};
  if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });
  const record = addMonitoring({ userId: req.user.id, deviceId, metrics, status, timestamp });
  res.status(201).json({ monitoring: record });
});

export default router;
