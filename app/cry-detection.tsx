import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Monitor } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { theme } from '@/constants/theme';

export default function CryDetectionScreen() {
    const router = useRouter();

    return (
        <LinearGradient
            colors={[theme.colors.background, theme.colors.secondary]}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cry Detection</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <GlassCard style={styles.card}>
                    <Monitor size={64} color={theme.colors.primary} />
                    <Text style={styles.title}>Cry Detection</Text>
                    <Text style={styles.description}>
                        Go to the Monitoring page to analyze videos for baby crying
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/monitoring')}
                    >
                        <Text style={styles.buttonText}>Go to Monitoring</Text>
                    </TouchableOpacity>
                </GlassCard>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 60,
        paddingBottom: theme.spacing.md,
    },
    backButton: {
        padding: theme.spacing.sm,
    },
    headerTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    card: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xxl,
        width: '100%',
    },
    title: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.md,
    },
    buttonText: {
        color: theme.colors.background,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
    },
});
