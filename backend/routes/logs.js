import express from 'express';
import { db } from '../db/client.js';
import { sleepLogs, feedLogs, growthLogs, healthLogs, vaccineLogs } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Helper to get table by type
const getTable = (type) => {
    switch (type) {
        case 'sleep': return sleepLogs;
        case 'feed': return feedLogs;
        case 'growth': return growthLogs;
        case 'health': return healthLogs;
        case 'vaccine': return vaccineLogs;
        default: return null;
    }
};

// GET logs by type
router.get('/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const table = getTable(type);
        if (!table) {
            return res.status(400).json({ error: 'Invalid log type' });
        }

        const logs = await db.select().from(table).where(eq(table.userId, userId)).orderBy(desc(table.date));
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// POST new log
router.post('/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const data = req.body;

        if (!data.userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const table = getTable(type);
        if (!table) {
            return res.status(400).json({ error: 'Invalid log type' });
        }

        const newLog = await db.insert(table).values(data).returning();
        res.status(201).json(newLog[0]);
    } catch (error) {
        console.error('Error creating log:', error);
        res.status(500).json({ error: 'Failed to create log' });
    }
});

export default router;
