import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryTheme,
} from 'victory-native';

import { Chip } from '../../components/Chip';
import { GlassCard } from '../../components/GlassCard';
import { Screen } from '../../components/Screen';
import { vitalsService } from '../../services/backend/vitalsService';
import type { Vital } from '../../services/backend/types';
import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import { formatTimeAgo } from '../../utils/format';

type Range = 'Today' | 'Week' | 'Month';
type Metric = 'HR' | 'SpO2' | 'Temp';

export function UserHistoryScreen() {
  const theme = useTheme();
  const { state } = useAuth();
  const user = state.user!;

  const [range, setRange] = useState<Range>('Today');
  const [metric, setMetric] = useState<Metric>('HR');
  const [items, setItems] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const hist = await vitalsService.getHistory(user.id);
        if (!alive) return;
        setItems(hist);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user.id]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const windowMs =
      range === 'Today'
        ? 24 * 3600e3
        : range === 'Week'
        ? 7 * 24 * 3600e3
        : 30 * 24 * 3600e3;
    return items
      .filter(v => now - new Date(v.timestamp).getTime() <= windowMs)
      .slice()
      .reverse();
  }, [items, range]);

  const series = useMemo(() => {
    const key =
      metric === 'HR'
        ? 'heartRate'
        : metric === 'SpO2'
        ? 'spo2'
        : 'temperature';
    return filtered
      .filter(v => (v as any)[key] != null)
      .map(v => ({
        x: new Date(v.timestamp),
        y: Number((v as any)[key]),
      }));
  }, [filtered, metric]);

  const stats = useMemo(() => {
    if (!series.length) return { avg: 0, min: 0, max: 0 };
    const ys = series.map(p => p.y);
    const sum = ys.reduce((a, b) => a + b, 0);
    return {
      avg: sum / ys.length,
      min: Math.min(...ys),
      max: Math.max(...ys),
    };
  }, [series]);

  const unit = metric === 'HR' ? 'bpm' : metric === 'SpO2' ? '%' : '°C';

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Health History
      </Text>

      <View style={styles.chipsRow}>
        {(['Today', 'Week', 'Month'] as Range[]).map(r => (
          <Chip
            key={r}
            label={r}
            selected={range === r}
            onPress={() => setRange(r)}
          />
        ))}
      </View>

      <View style={styles.chipsRow}>
        {(['HR', 'SpO2', 'Temp'] as Metric[]).map(m => (
          <Chip
            key={m}
            label={m}
            selected={metric === m}
            onPress={() => setMetric(m)}
          />
        ))}
      </View>

      <GlassCard style={styles.chartCard}>
        <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]}>
          {loading ? 'Loading…' : `${metric} Trend`}
        </Text>
        <VictoryChart
          theme={VictoryTheme.material}
          height={220}
          padding={{ left: 44, top: 14, right: 20, bottom: 36 }}
          scale={{ x: 'time' }}
        >
          <VictoryAxis
            style={{
              axis: { stroke: 'rgba(226,232,240,0.9)' },
              tickLabels: {
                fill: theme.colors.textSecondary,
                fontSize: 10,
                fontWeight: '700',
              },
              grid: { stroke: 'rgba(226,232,240,0.35)' },
            }}
          />
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: 'rgba(226,232,240,0.9)' },
              tickLabels: {
                fill: theme.colors.textSecondary,
                fontSize: 10,
                fontWeight: '700',
              },
              grid: { stroke: 'rgba(226,232,240,0.35)' },
            }}
          />
          <VictoryLine
            data={series}
            interpolation="monotoneX"
            style={{
              data: { stroke: theme.colors.accent, strokeWidth: 3 },
            }}
          />
        </VictoryChart>

        <View style={styles.statsRow}>
          <Stat
            label="Average"
            value={`${
              metric === 'Temp' ? stats.avg.toFixed(1) : Math.round(stats.avg)
            }`}
            unit={unit}
          />
          <Stat
            label="Min"
            value={`${
              metric === 'Temp' ? stats.min.toFixed(1) : Math.round(stats.min)
            }`}
            unit={unit}
          />
          <Stat
            label="Max"
            value={`${
              metric === 'Temp' ? stats.max.toFixed(1) : Math.round(stats.max)
            }`}
            unit={unit}
          />
        </View>
      </GlassCard>

      <Text style={[styles.section, { color: theme.colors.textSecondary }]}>
        Recent readings
      </Text>
      <FlatList
        data={items.slice(0, 20)}
        keyExtractor={v => v._id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={[styles.rowItem, { borderColor: theme.colors.border }]}>
            <Text style={[styles.rowPrimary, { color: theme.colors.text }]}>
              HR {item.heartRate ?? '--'} • SpO₂ {item.spo2 ?? '--'} • Temp{' '}
              {item.temperature ?? '--'}
            </Text>
            <Text
              style={[
                styles.rowSecondary,
                { color: theme.colors.textSecondary },
              ]}
            >
              {formatTimeAgo(item.timestamp)}
            </Text>
          </View>
        )}
      />
    </Screen>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>
        {value}{' '}
        <Text style={[styles.statUnit, { color: theme.colors.textSecondary }]}>
          {unit}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '900', marginTop: 6 },
  chipsRow: { flexDirection: 'row', marginTop: 12 },
  chartCard: { marginTop: 12, padding: 14 },
  cardLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 0.2 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  stat: { flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '800' },
  statValue: { marginTop: 6, fontSize: 16, fontWeight: '900' },
  statUnit: { fontSize: 12, fontWeight: '900' },
  section: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  rowItem: { paddingVertical: 12, borderBottomWidth: 1 },
  rowPrimary: { fontSize: 13, fontWeight: '800' },
  rowSecondary: { marginTop: 6, fontSize: 12, fontWeight: '700' },
});
