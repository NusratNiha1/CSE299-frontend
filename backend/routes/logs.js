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

        // Map snake_case to camelCase for response
        const mappedLogs = logs.map(log => ({
            id: log.id,
            userId: log.user_id,
            ...(log.start_time && { startTime: log.start_time }),
            ...(log.end_time && { endTime: log.end_time }),
            ...(log.duration_minutes && { durationMinutes: log.duration_minutes }),
            ...(log.vaccine_name && { vaccineName: log.vaccine_name }),
            ...(log.type && { type: log.type }),
            ...(log.amount && { amount: log.amount }),
            ...(log.notes && { notes: log.notes }),
            ...(log.date && { date: log.date }),
            ...(log.height && { height: log.height }),
            ...(log.weight && { weight: log.weight }),
            ...(log.bmi && { bmi: log.bmi }),
            ...(log.condition && { condition: log.condition }),
            ...(log.severity && { severity: log.severity }),
            ...(log.status && { status: log.status }),
            ...(log.time && { time: log.time }),
        }));

        res.json(mappedLogs);
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

        // Map camelCase to snake_case for database
        const dbData = {
            userId: data.userId,
            ...(data.startTime && { startTime: new Date(data.startTime) }),
            ...(data.endTime && { endTime: new Date(data.endTime) }),
            ...(data.durationMinutes && { durationMinutes: data.durationMinutes }),
            ...(data.vaccineName && { vaccineName: data.vaccineName }),
            ...(type === 'feed' && data.type && { type: data.type }),
            ...(data.amount && { amount: data.amount }),
            ...(data.notes && { notes: data.notes }),
            ...(data.date && { date: new Date(data.date) }),
            ...(data.height && { height: data.height }),
            ...(data.weight && { weight: data.weight }),
            ...(data.bmi && { bmi: data.bmi }),
            ...(data.condition && { condition: data.condition }),
            ...(data.severity && { severity: data.severity }),
            ...(data.status && { status: data.status }),
            ...(data.time && { time: new Date(data.time) }),
        };

        const newLog = await db.insert(table).values(dbData).returning();

        // Map snake_case back to camelCase for response
        const response = {
            id: newLog[0].id,
            userId: newLog[0].user_id,
            ...(newLog[0].start_time && { startTime: newLog[0].start_time }),
            ...(newLog[0].end_time && { endTime: newLog[0].end_time }),
            ...(newLog[0].duration_minutes && { durationMinutes: newLog[0].duration_minutes }),
            ...(newLog[0].vaccine_name && { vaccineName: newLog[0].vaccine_name }),
            ...(newLog[0].type && { type: newLog[0].type }),
            ...(newLog[0].amount && { amount: newLog[0].amount }),
            ...(newLog[0].notes && { notes: newLog[0].notes }),
            ...(newLog[0].date && { date: newLog[0].date }),
            ...(newLog[0].height && { height: newLog[0].height }),
            ...(newLog[0].weight && { weight: newLog[0].weight }),
            ...(newLog[0].bmi && { bmi: newLog[0].bmi }),
            ...(newLog[0].condition && { condition: newLog[0].condition }),
            ...(newLog[0].severity && { severity: newLog[0].severity }),
            ...(newLog[0].status && { status: newLog[0].status }),
            ...(newLog[0].time && { time: newLog[0].time }),
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating log:', error);
        res.status(500).json({ error: 'Failed to create log', details: error.message });
    }
});

export default router;
