import { db } from '../db/client.js';
import { sql } from 'drizzle-orm';
import {
    users,
    profiles,
    devices,
    monitoring,
    cryEvents,
    alertSettings,
    notifications
} from '../db/schema.js';

async function reset() {
    if (!db) {
        console.log('Using in-memory store. Please restart the backend server to reset data.');
        return;
    }

    console.log('Resetting database...');
    try {
        // Truncate all tables
        await db.execute(sql`TRUNCATE TABLE ${users}, ${profiles}, ${devices}, ${monitoring}, ${cryEvents}, ${alertSettings}, ${notifications} CASCADE`);
        console.log('Database reset successfully.');
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
    process.exit(0);
}

reset();
