import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Use localhost for emulator/simulator, or your machine's IP for physical device
const API_URL = 'http://localhost:3000';

export interface SleepLog {
    id: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    date: string;
}

export interface FeedLog {
    id: string;
    time: string;
    type: 'breast' | 'bottle' | 'solid';
    amount?: number; // ml or grams
    notes?: string;
    date: string;
}

export interface GrowthLog {
    id: string;
    date: string;
    height: number; // cm
    weight: number; // kg
    bmi: number;
}

export interface HealthLog {
    id: string;
    date: string;
    condition: string;
    notes?: string;
    severity: 'mild' | 'moderate' | 'severe';
}

export interface VaccineLog {
    id: string;
    date: string;
    vaccineName: string;
    status: 'scheduled' | 'completed' | 'skipped';
    notes?: string;
}

interface BabyLogContextType {
    sleepLogs: SleepLog[];
    feedLogs: FeedLog[];
    growthLogs: GrowthLog[];
    healthLogs: HealthLog[];
    vaccineLogs: VaccineLog[];
    addSleepLog: (log: Omit<SleepLog, 'id'>) => Promise<void>;
    addFeedLog: (log: Omit<FeedLog, 'id'>) => Promise<void>;
    addGrowthLog: (log: Omit<GrowthLog, 'id' | 'bmi'>) => Promise<void>;
    addHealthLog: (log: Omit<HealthLog, 'id'>) => Promise<void>;
    addVaccineLog: (log: Omit<VaccineLog, 'id'>) => Promise<void>;
    calculateBMI: (height: number, weight: number) => { bmi: number; advice: string };
    refreshLogs: () => Promise<void>;
}

const BabyLogContext = createContext<BabyLogContextType | undefined>(undefined);

export function BabyLogProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
    const [feedLogs, setFeedLogs] = useState<FeedLog[]>([]);
    const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([]);
    const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
    const [vaccineLogs, setVaccineLogs] = useState<VaccineLog[]>([]);

    const fetchLogs = async () => {
        if (!user) return;
        try {
            const [sleep, feed, growth, health, vaccine] = await Promise.all([
                fetch(`${API_URL}/logs/sleep?userId=${user.id}`).then(r => r.json()),
                fetch(`${API_URL}/logs/feed?userId=${user.id}`).then(r => r.json()),
                fetch(`${API_URL}/logs/growth?userId=${user.id}`).then(r => r.json()),
                fetch(`${API_URL}/logs/health?userId=${user.id}`).then(r => r.json()),
                fetch(`${API_URL}/logs/vaccine?userId=${user.id}`).then(r => r.json()),
            ]);

            setSleepLogs(Array.isArray(sleep) ? sleep : []);
            setFeedLogs(Array.isArray(feed) ? feed : []);
            setGrowthLogs(Array.isArray(growth) ? growth : []);
            setHealthLogs(Array.isArray(health) ? health : []);
            setVaccineLogs(Array.isArray(vaccine) ? vaccine : []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [user]);

    const addSleepLog = async (log: Omit<SleepLog, 'id'>) => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/logs/sleep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...log, userId: user.id }),
            });
            const newLog = await res.json();
            setSleepLogs(prev => [newLog, ...prev]);
        } catch (error) {
            console.error('Error adding sleep log:', error);
            throw error;
        }
    };

    const addFeedLog = async (log: Omit<FeedLog, 'id'>) => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/logs/feed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...log, userId: user.id }),
            });
            const newLog = await res.json();
            setFeedLogs(prev => [newLog, ...prev]);
        } catch (error) {
            console.error('Error adding feed log:', error);
            throw error;
        }
    };

    const addGrowthLog = async (log: Omit<GrowthLog, 'id' | 'bmi'>) => {
        if (!user) return;
        const { bmi } = calculateBMI(log.height, log.weight);
        try {
            const res = await fetch(`${API_URL}/logs/growth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...log, bmi, userId: user.id }),
            });
            const newLog = await res.json();
            setGrowthLogs(prev => [newLog, ...prev]);
        } catch (error) {
            console.error('Error adding growth log:', error);
            throw error;
        }
    };

    const addHealthLog = async (log: Omit<HealthLog, 'id'>) => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/logs/health`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...log, userId: user.id }),
            });
            const newLog = await res.json();
            setHealthLogs(prev => [newLog, ...prev]);
        } catch (error) {
            console.error('Error adding health log:', error);
            throw error;
        }
    };

    const addVaccineLog = async (log: Omit<VaccineLog, 'id'>) => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/logs/vaccine`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...log, userId: user.id }),
            });
            const newLog = await res.json();
            setVaccineLogs(prev => [newLog, ...prev]);
        } catch (error) {
            console.error('Error adding vaccine log:', error);
            throw error;
        }
    };

    const calculateBMI = (height: number, weight: number) => {
        const heightM = height / 100;
        const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));

        let advice = '';
        if (bmi < 13) advice = 'Underweight - Consult pediatrician';
        else if (bmi < 18) advice = 'Healthy weight';
        else advice = 'Overweight - Monitor feeding';

        return { bmi, advice };
    };

    return (
        <BabyLogContext.Provider
            value={{
                sleepLogs,
                feedLogs,
                growthLogs,
                healthLogs,
                vaccineLogs,
                addSleepLog,
                addFeedLog,
                addGrowthLog,
                addHealthLog,
                addVaccineLog,
                calculateBMI,
                refreshLogs: fetchLogs,
            }}
        >
            {children}
        </BabyLogContext.Provider>
    );
}

export function useBabyLog() {
    const context = useContext(BabyLogContext);
    if (context === undefined) {
        throw new Error('useBabyLog must be used within a BabyLogProvider');
    }
    return context;
}
