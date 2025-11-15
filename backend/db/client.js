import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL not set - Drizzle client will not connect.');
}

export const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
export const db = pool ? drizzle(pool) : null;
