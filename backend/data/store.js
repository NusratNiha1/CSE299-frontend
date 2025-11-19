import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
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
    // Using sql to match the original lower(email) logic
    const existing = await drizzle.execute(sql`select id, email from ${usersTable} where lower(${usersTable.email})=lower(${email}) limit 1`);

    if (existing.rows && existing.rows.length > 0) {
      throw Object.assign(new Error('Email already registered'), { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const id = uuid();

    await drizzle.insert(usersTable).values({
      id: id,
      email: email,
      passwordHash: hash,
      name: name || email.split('@')[0],
      createdAt: new Date()
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
    const result = await drizzle.execute(sql`select id, email, password_hash, name from ${usersTable} where lower(${usersTable.email})=lower(${email}) limit 1`);
    const user = result.rows && result.rows[0];

    if (!user) return null;
    // Note: result.rows from raw sql might have snake_case keys if not mapped, 
    // but since we selected specific columns, let's be careful. 
    // Drizzle's execute with node-postgres returns the raw pg result.
    // The column 'password_hash' will be returned as 'password_hash'.

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

    drizzle.insert(monitoringTable).values({
      id: rec.id,
      userId: rec.userId,
      deviceId: rec.deviceId,
      metrics: rec.metrics,
      status: rec.status,
      timestamp: new Date(rec.timestamp)
    }).catch(err => console.error('monitoring insert failed', err));

    return rec;
  }
  const rec = { id: uuid(), userId, deviceId, metrics: metrics || {}, status: status || 'ok', timestamp: timestamp || new Date().toISOString() };
  mem.monitoring.push(rec);
  return rec;
}

export { mem as db, createUser, verifyUser, listDevices, addMonitoring };
