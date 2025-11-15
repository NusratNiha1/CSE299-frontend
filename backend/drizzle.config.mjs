import 'dotenv/config';

export default {
  schema: './db/schema.js',
  out: './database/migrations/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
};
