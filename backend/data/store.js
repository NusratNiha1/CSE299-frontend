import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { db as drizzle } from '../db/client.js';
import { users as usersTable, devices as devicesTable, monitoring as monitoringTable } from '../db/schema.js';

// In-memory store for demo/testing
const mem = {
  users: [],
  devices: [
    { id: uuid(), name: 'Thermo Sensor A', type: 'temperature', status: 'online' },
    { id: uuid(), name: 'Motion Cam B', type: 'camera', status: 'offline' }
  ],
  monitoring: [] // { id, userId, deviceId, metrics, status, timestamp }
};

async function createUser({ email, password, name }) {
  if (drizzle) {
    // Check existing
    const { rows } = await drizzle.execute({
      text: 'select id, email from users where lower(email)=lower($1) limit 1',
      args: [email]
    });
    if (rows && rows.length > 0) throw Object.assign(new Error('Email already registered'), { status: 400 });
    const hash = await bcrypt.hash(password, 10);
    const id = uuid();
    await drizzle.execute({
      text: 'insert into users (id, email, password_hash, name, created_at) values ($1,$2,$3,$4, now())',
      args: [id, email, hash, name || email.split('@')[0]]
    });
    return { id, email, name: name || email.split('@')[0] };
  } else {
    const exists = mem.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) throw Object.assign(new Error('Email already registered'), { status: 400 });
    const hash = await bcrypt.hash(password, 10);
    const user = { id: uuid(), email, passwordHash: hash, name };
    mem.users.push(user);
    return { id: user.id, email: user.email, name: user.name };
  }
}

async function verifyUser(email, password) {
  if (drizzle) {
    const { rows } = await drizzle.execute({
      text: 'select id, email, password_hash, name from users where lower(email)=lower($1) limit 1',
      args: [email]
    });
    const user = rows && rows[0];
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return null;
    return { id: user.id, email: user.email, name: user.name };
  } else {
    const user = mem.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    return { id: user.id, email: user.email, name: user.name };
  }
}

function listDevices() {
  if (drizzle) {
    // Return mapped devices if you use DB schema
    return [];
  }
  return mem.devices;
}

function addMonitoring({ userId, deviceId, metrics, status, timestamp }) {
  if (drizzle) {
    const rec = { id: uuid(), userId, deviceId, metrics: metrics || {}, status: status || 'ok', timestamp: timestamp || new Date().toISOString() };
    // insert via SQL to avoid ESM import issues
    drizzle.execute({
      text: 'insert into monitoring (id, user_id, device_id, metrics, status, timestamp) values ($1,$2,$3,$4,$5,$6)',
      args: [rec.id, rec.userId, rec.deviceId, JSON.stringify(rec.metrics), rec.status, rec.timestamp]
    }).catch(err => console.error('monitoring insert failed', err));
    return rec;
  }
  const rec = { id: uuid(), userId, deviceId, metrics: metrics || {}, status: status || 'ok', timestamp: timestamp || new Date().toISOString() };
  mem.monitoring.push(rec);
  return rec;
}

export { mem as db, createUser, verifyUser, listDevices, addMonitoring };
