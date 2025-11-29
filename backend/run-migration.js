import 'dotenv/config';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not set in .env file');
        process.exit(1);
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        console.log('🔄 Running baby log tables migration...');

        const sql = fs.readFileSync(path.join(__dirname, 'create_baby_log_tables.sql'), 'utf8');

        await pool.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('📊 Created tables:');
        console.log('   - sleep_logs');
        console.log('   - feed_logs');
        console.log('   - growth_logs');
        console.log('   - health_logs');
        console.log('   - vaccine_logs');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
