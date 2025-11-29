import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { GlassCard } from '@/components/GlassCard';
import { ui } from '@/constants/ui';
import {
    Moon,
    Milk,
    Ruler,
    Weight,
    Activity,
    Syringe,
    Plus,
    X,
    Clock,
    Calendar
} from 'lucide-react-native';
import { useBabyLog } from '@/contexts/BabyLogContext';
import { BlurView } from 'expo-blur';

type LogType = 'sleep' | 'feed' | 'growth' | 'health' | 'vaccine' | null;

export default function DashboardScreen() {
    const { addSleepLog, addFeedLog, addGrowthLog, addHealthLog, addVaccineLog, calculateBMI } = useBabyLog();
    const [modalVisible, setModalVisible] = useState(false);
    const [activeLogType, setActiveLogType] = useState<LogType>(null);

    // Form States
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [feedType, setFeedType] = useState<'breast' | 'bottle' | 'solid'>('bottle');
    const [amount, setAmount] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [condition, setCondition] = useState('');
    const [vaccineName, setVaccineName] = useState('');
    const [notes, setNotes] = useState('');

    const openModal = (type: LogType) => {
        setActiveLogType(type);
        setModalVisible(true);
        // Reset forms
        setStartTime('');
        setEndTime('');
        setAmount('');
        setHeight('');
        setWeight('');
        setCondition('');
        setVaccineName('');
        setNotes('');
    };

    const handleSubmit = async () => {
        const now = new Date().toISOString();

        try {
            switch (activeLogType) {
                case 'sleep':
                    if (!startTime || !endTime) throw new Error('Please enter start and end times');
                    // Simplified: assuming user enters HH:MM for today
                    // In a real app, use a DatePicker
                    const start = new Date();
                    const [sh, sm] = startTime.split(':');
                    start.setHours(parseInt(sh), parseInt(sm));

                    const end = new Date();
                    const [eh, em] = endTime.split(':');
                    end.setHours(parseInt(eh), parseInt(em));

                    const duration = (end.getTime() - start.getTime()) / 60000;

                    await addSleepLog({
                        startTime: start.toISOString(),
                        endTime: end.toISOString(),
                        durationMinutes: duration,
                        date: now,
                    });
                    break;

                case 'feed':
                    await addFeedLog({
                        time: now,
                        type: feedType,
                        amount: amount ? parseFloat(amount) : undefined,
                        notes,
                        date: now,
                    });
                    break;

                case 'growth':
                    if (!height || !weight) throw new Error('Please enter height and weight');
                    await addGrowthLog({
                        date: now,
                        height: parseFloat(height),
                        weight: parseFloat(weight),
                    });
                    const { advice } = calculateBMI(parseFloat(height), parseFloat(weight));
                    Alert.alert('Growth Logged', `BMI Advice: ${advice}`);
                    break;

                case 'health':
                    if (!condition) throw new Error('Please enter condition');
                    await addHealthLog({
                        date: now,
                        condition,
                        notes,
                        severity: 'mild', // Default
                    });
                    break;

                case 'vaccine':
                    if (!vaccineName) throw new Error('Please enter vaccine name');
                    await addVaccineLog({
                        date: now,
                        vaccineName,
                        status: 'completed',
                        notes,
                    });
                    break;
            }
            setModalVisible(false);
            Alert.alert('Success', 'Log added successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const renderLoggerCard = (title: string, icon: React.ReactNode, type: LogType, color: string) => (
        <TouchableOpacity onPress={() => openModal(type)} style={styles.cardWrapper}>
            <GlassCard style={styles.card} className={ui.cardContainer} contentClassName={ui.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                    {icon}
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
                <View style={styles.addButton}>
                    <Plus size={16} color={theme.colors.text} />
                </View>
            </GlassCard>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={[theme.colors.background, theme.colors.secondary]} style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Baby Dashboard</Text>
                    <Text style={styles.subtitle}>Track your baby's daily activities</Text>
                </View>

                <View style={styles.grid}>
                    {renderLoggerCard('Sleep', <Moon size={24} color="#8E44AD" />, 'sleep', '#8E44AD')}
                    {renderLoggerCard('Feeding', <Milk size={24} color="#3498DB" />, 'feed', '#3498DB')}
                    {renderLoggerCard('Growth', <Ruler size={24} color="#2ECC71" />, 'growth', '#2ECC71')}
                    {renderLoggerCard('Health', <Activity size={24} color="#E74C3C" />, 'health', '#E74C3C')}
                    {renderLoggerCard('Vaccine', <Syringe size={24} color="#F1C40F" />, 'vaccine', '#F1C40F')}
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add {activeLogType ? activeLogType.charAt(0).toUpperCase() + activeLogType.slice(1) : ''} Log</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            {activeLogType === 'sleep' && (
                                <>
                                    <Text style={styles.label}>Start Time (HH:MM)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={startTime}
                                        onChangeText={setStartTime}
                                        placeholder="14:00"
                                        placeholderTextColor={theme.colors.textSecondary}
                                    />
                                    <Text style={styles.label}>End Time (HH:MM)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={endTime}
                                        onChangeText={setEndTime}
                                        placeholder="16:00"
                                        placeholderTextColor={theme.colors.textSecondary}
                                    />
                                </>
                            )}

                            {activeLogType === 'feed' && (
                                <>
                                    <Text style={styles.label}>Type</Text>
                                    <View style={styles.typeContainer}>
                                        {['breast', 'bottle', 'solid'].map((t) => (
                                            <TouchableOpacity
                                                key={t}
                                                style={[styles.typeButton, feedType === t && styles.typeButtonActive]}
                                                onPress={() => setFeedType(t as any)}
                                            >
                                                <Text style={[styles.typeText, feedType === t && styles.typeTextActive]}>
                                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={styles.label}>Amount (ml/g)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="numeric"
                                        placeholder="120"
                                        placeholderTextColor={theme.colors.textSecondary}
                                    />
                                </>
                            )}

                            {activeLogType === 'growth' && (
                                <>
                                    <Text style={styles.label}>Height (cm)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={height}
                                        onChangeText={setHeight}
                                        keyboardType="numeric"
                                        placeholder="60"
                                        placeholderTextColor={theme.colors.textSecondary}
                                    />
                                    <Text style={styles.label}>Weight (kg)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={weight}
                                        onChangeText={setWeight}
                                        keyboardType="numeric"
                                        placeholder="5.5"
                                        placeholderTextColor={theme.colors.textSecondary}
                                    />
                                </>
                            )}

                            {activeLogType === 'health' && (
                                <>
                                    <Text style={styles.label}>Condition</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={condition}
                                        onChangeText={setCondition}
                                        placeholder="Fever, Cough, etc."
                                        placeholderTextColor={theme.colors.textSecondary}
                                    />
                                    <Text style={styles.label}>Notes</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={notes}
                                        onChangeText={setNotes}
                                        multiline
                                        placeholder="Details..."
                                        placeholderTextColor={theme.colors.textSecondary}
                                    />
                                </>
                            )}

                            {activeLogType === 'vaccine' && (
                                <>
                                    <Text style={styles.label}>Vaccine Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={vaccineName}
                                        onChangeText={setVaccineName}
                                        placeholder="BCG, Polio, etc."
                                        placeholderTextColor={theme.colors.textSecondary}
                                    />
                                    <Text style={styles.label}>Notes</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={notes}
                                        onChangeText={setNotes}
                                        multiline
                                        placeholder="Side effects..."
                                        placeholderTextColor={theme.colors.textSecondary}
                                    />
                                </>
                            )}

                            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                <Text style={styles.submitButtonText}>Save Log</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: theme.spacing.lg, paddingTop: 60, paddingBottom: 40 },
    header: { marginBottom: theme.spacing.xl },
    title: { color: theme.colors.text, fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold },
    subtitle: { color: theme.colors.textSecondary, marginTop: theme.spacing.xs, fontSize: theme.fontSize.md },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
    cardWrapper: { width: '47%', marginBottom: theme.spacing.md },
    card: { alignItems: 'center', padding: theme.spacing.lg, height: 160, justifyContent: 'space-between' },
    iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.sm },
    cardTitle: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.medium },
    addButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.glassBorder, justifyContent: 'center', alignItems: 'center', marginTop: theme.spacing.sm },

    // Modal
    modalContainer: { flex: 1, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.colors.secondary, borderTopLeftRadius: theme.borderRadius.xl, borderTopRightRadius: theme.borderRadius.xl, height: '70%', padding: theme.spacing.lg },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
    modalTitle: { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold },
    formContainer: { flex: 1 },
    label: { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, marginTop: theme.spacing.md },
    input: { backgroundColor: theme.colors.glass, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.glassBorder },
    textArea: { height: 100, textAlignVertical: 'top' },
    submitButton: { backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center', marginTop: theme.spacing.xl, marginBottom: theme.spacing.xl },
    submitButtonText: { color: theme.colors.background, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.md },
    typeContainer: { flexDirection: 'row', gap: theme.spacing.sm },
    typeButton: { flex: 1, padding: theme.spacing.sm, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.glassBorder, alignItems: 'center' },
    typeButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    typeText: { color: theme.colors.textSecondary },
    typeTextActive: { color: theme.colors.background, fontWeight: theme.fontWeight.bold },
});
