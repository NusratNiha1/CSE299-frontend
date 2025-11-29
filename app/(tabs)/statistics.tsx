import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { GlassCard } from '@/components/GlassCard';
import { ui } from '@/constants/ui';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useBabyLog } from '@/contexts/BabyLogContext';

const screenWidth = Dimensions.get('window').width;

export default function StatisticsScreen() {
  const { growthLogs, sleepLogs, feedLogs } = useBabyLog();

  const chartConfig = {
    backgroundGradientFrom: theme.colors.secondary,
    backgroundGradientTo: theme.colors.secondary,
    color: (opacity = 1) => `rgba(1, 204, 102, ${opacity})`, // Primary color
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 1,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: theme.colors.primary
    }
  };

  // Process Growth Data (Height & Weight)
  const growthData = useMemo(() => {
    if (growthLogs.length === 0) return null;

    // Sort by date
    const sorted = [...growthLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Take last 6 entries for readability
    const recent = sorted.slice(-6);

    return {
      labels: recent.map(l => new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
      heights: recent.map(l => l.height),
      weights: recent.map(l => l.weight),
      bmis: recent.map(l => l.bmi),
    };
  }, [growthLogs]);

  // Process Sleep Data (Daily Duration)
  const sleepData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const data = last7Days.map(date => {
      const dayLogs = sleepLogs.filter(l => l.date.startsWith(date));
      const totalMinutes = dayLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
      return totalMinutes / 60; // Hours
    });

    return {
      labels: last7Days.map(d => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })),
      data,
    };
  }, [sleepLogs]);

  // Process Feed Data (Daily Count)
  // "Feeding time (3 times a day, day basis, need to show for consistant feeding time)"
  // For now, showing frequency per day to ensure they are eating enough times.
  const feedData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const data = last7Days.map(date => {
      return feedLogs.filter(l => l.date.startsWith(date)).length;
    });

    return {
      labels: last7Days.map(d => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })),
      data,
    };
  }, [feedLogs]);

  return (
    <LinearGradient colors={[theme.colors.background, theme.colors.secondary]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Statistics</Text>
          <Text style={styles.subtitle}>Growth & Activity Trends</Text>
        </View>

        {growthData ? (
          <>
            <GlassCard style={styles.card} className={ui.cardContainer} contentClassName={ui.cardContent}>
              <Text style={styles.cardTitle}>Height (cm)</Text>
              <LineChart
                data={{
                  labels: growthData.labels,
                  datasets: [{ data: growthData.heights }]
                }}
                width={screenWidth - 48}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </GlassCard>

            <GlassCard style={styles.card} className={ui.cardContainer} contentClassName={ui.cardContent}>
              <Text style={styles.cardTitle}>Weight (kg)</Text>
              <LineChart
                data={{
                  labels: growthData.labels,
                  datasets: [{ data: growthData.weights }]
                }}
                width={screenWidth - 48}
                height={220}
                chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})` }}
                bezier
                style={styles.chart}
              />
            </GlassCard>

            <GlassCard style={styles.card} className={ui.cardContainer} contentClassName={ui.cardContent}>
              <Text style={styles.cardTitle}>BMI Trend</Text>
              <LineChart
                data={{
                  labels: growthData.labels,
                  datasets: [{ data: growthData.bmis }]
                }}
                width={screenWidth - 48}
                height={220}
                chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(241, 196, 15, ${opacity})` }}
                bezier
                style={styles.chart}
              />
            </GlassCard>
          </>
        ) : (
          <GlassCard style={styles.card} className={ui.cardContainer} contentClassName={ui.cardContent}>
            <Text style={styles.emptyText}>Add growth logs to see charts</Text>
          </GlassCard>
        )}

        <GlassCard style={styles.card} className={ui.cardContainer} contentClassName={ui.cardContent}>
          <Text style={styles.cardTitle}>Sleep Duration (Hours)</Text>
          <BarChart
            data={{
              labels: sleepData.labels,
              datasets: [{ data: sleepData.data }]
            }}
            width={screenWidth - 48}
            height={220}
            yAxisLabel=""
            yAxisSuffix="h"
            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(142, 68, 173, ${opacity})` }}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </GlassCard>

        <GlassCard style={styles.card} className={ui.cardContainer} contentClassName={ui.cardContent}>
          <Text style={styles.cardTitle}>Daily Feeds</Text>
          <BarChart
            data={{
              labels: feedData.labels,
              datasets: [{ data: feedData.data }]
            }}
            width={screenWidth - 48}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})` }}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </GlassCard>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: theme.spacing.lg },
  title: { color: theme.colors.text, fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold },
  subtitle: { color: theme.colors.textSecondary, marginTop: theme.spacing.xs, fontSize: theme.fontSize.md },
  card: { marginBottom: theme.spacing.lg, padding: theme.spacing.md },
  cardTitle: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, marginBottom: theme.spacing.md },
  chart: { marginVertical: 8, borderRadius: 16 },
  emptyText: { color: theme.colors.textSecondary, textAlign: 'center', marginVertical: 20 },
});
