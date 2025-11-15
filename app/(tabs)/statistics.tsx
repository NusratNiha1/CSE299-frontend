import React, { useMemo } from 'react';
import { Text, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { ui } from '@/constants/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { GlassCard } from '@/components/GlassCard';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { BarChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

type DaySeries = { labels: string[]; values: number[] };

function formatDay(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function StatisticsScreen() {
  const { cryEvents } = useMonitoring();

  const { countSeries, durationSeries } = useMemo(() => {
    const byDay = new Map<string, { count: number; duration: number }>();
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      byDay.set(d.toISOString(), { count: 0, duration: 0 });
    }

    cryEvents.forEach((e) => {
      const dt = new Date(e.detected_at);
      dt.setHours(0, 0, 0, 0);
      const key = Array.from(byDay.keys()).find(k => new Date(k).getTime() === dt.getTime());
      const k = key || dt.toISOString();
      const prev = byDay.get(k) || { count: 0, duration: 0 };
      byDay.set(k, { count: prev.count + 1, duration: prev.duration + (e.duration_seconds || 0) });
    });

    const sorted = Array.from(byDay.entries()).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    const labels = sorted.map(([k]) => formatDay(new Date(k)));
    const counts = sorted.map(([, v]) => v.count);
    const durationsMin = sorted.map(([, v]) => Math.round(v.duration / 60));

    return {
      countSeries: { labels, values: counts } as DaySeries,
      durationSeries: { labels, values: durationsMin } as DaySeries,
    };
  }, [cryEvents]);

  const chartConfig = {
    backgroundGradientFrom: theme.colors.secondary,
    backgroundGradientTo: theme.colors.secondary,
    color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
    labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
    barPercentage: 0.6,
    propsForDots: { r: '4', strokeWidth: '2', stroke: theme.colors.primary },
  } as const;

  return (
    <LinearGradient colors={[theme.colors.background, theme.colors.secondary]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} className="text-text text-xl font-bold">Statistics</Text>
        <Text style={styles.subtitle} className="text-textSecondary mt-[6px] mb-[16px]">Past 7 days • Cry events and total cry duration</Text>

        <GlassCard style={styles.card} className={ui.cardContainer} contentClassName={ui.cardContent}>
          <Text style={styles.cardTitle}>Daily Cry Events</Text>
          <BarChart
            data={{ labels: countSeries.labels, datasets: [{ data: countSeries.values }] }}
            width={screenWidth - 32}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            fromZero
            style={styles.chart}
          />
        </GlassCard>

        <GlassCard style={styles.card} className={ui.cardContainer} contentClassName={ui.cardContent}>
          <Text style={styles.cardTitle}>Total Crying Duration (min)</Text>
          <LineChart
            data={{ labels: durationSeries.labels, datasets: [{ data: durationSeries.values, strokeWidth: 2 }] }}
            width={screenWidth - 32}
            height={240}
            chartConfig={chartConfig}
            bezier
            fromZero
            style={styles.chart}
          />
        </GlassCard>

        <GlassCard style={styles.noteCard} className={ui.cardContainer} contentClassName={ui.cardContent}>
          <Text style={styles.noteTitle} className="text-text text-md font-bold mb-[4px]">Sleep time</Text>
          <Text style={styles.noteText} className="text-textSecondary">
            Sleep tracking isn’t enabled yet because we don’t log sleep sessions. Once sleep events are
            available, this page will chart daily sleep totals alongside crying.
          </Text>
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingTop: 60, paddingBottom: 40 },
  title: { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold as any },
  subtitle: { color: theme.colors.textSecondary, marginTop: 6, marginBottom: 16 },
  card: { marginTop: theme.spacing.md },
  chart: { marginVertical: 8, borderRadius: theme.borderRadius.md },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold as any,
    marginBottom: theme.spacing.sm,
  },
  noteCard: { marginTop: theme.spacing.lg },
  noteTitle: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold as any, marginBottom: 4 },
  noteText: { color: theme.colors.textSecondary },
});
