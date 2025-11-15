import express from 'express';
import auth from '../middleware/auth.js';
import { listDevices } from '../data/store.js';

const router = express.Router();

router.get('/', auth, (req, res) => {
  const devices = listDevices();
  res.json({ devices });
});

export default router;


