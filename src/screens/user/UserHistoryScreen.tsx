import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { Chip } from '../../components/Chip';
import { GlassCard } from '../../components/GlassCard';
import { Screen } from '../../components/Screen';
import { vitalsService } from '../../services/backend/vitalsService';
import type { Vital } from '../../services/backend/types';
import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import { formatTimeAgo } from '../../utils/format';

const screenWidth = Dimensions.get('window').width;

type Range = 'Today' | 'Week' | 'Month';
type Metric = 'HR' | 'SpO2' | 'Temp';

// Clamp values to realistic ranges per metric
const CLAMP: Record<Metric, [number, number]> = {
  HR: [20, 250],
  SpO2: [50, 100],
  Temp: [30, 45],
};

function sanitize(v: unknown): number | null {
  const n = Number(v);
  if (v == null || isNaN(n) || !isFinite(n)) return null;
  return n;
}

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
        // Log raw data so we can verify what's coming from the server
        console.log('[History] total records:', hist.length);
        if (hist.length > 0) {
          console.log('[History] sample record:', JSON.stringify(hist[0]));
          console.log('[History] first timestamp:', hist[0].timestamp);
          console.log(
            '[History] last timestamp:',
            hist[hist.length - 1].timestamp,
          );
        }
        setItems(hist);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user.id]);

  // Filter by time range — fall back to ALL data if nothing matches the window
  const filtered = useMemo(() => {
    if (!items.length) return [];

    const now = Date.now();
    const windowMs =
      range === 'Today'
        ? 24 * 3600e3
        : range === 'Week'
        ? 7 * 24 * 3600e3
        : 30 * 24 * 3600e3;

    const inWindow = items.filter(v => {
      const ts = new Date(v.timestamp).getTime();
      return !isNaN(ts) && now - ts <= windowMs;
    });

    console.log(
      `[History] range=${range} matched=${inWindow.length}/${items.length}`,
    );

    // If nothing falls in the window (e.g. all data is old/test data), show all
    const result = inWindow.length > 0 ? inWindow : items;
    return result.slice().reverse();
  }, [items, range]);

  // Build safe chart data
  const safeChartData = useMemo(() => {
    const key =
      metric === 'HR'
        ? 'heartRate'
        : metric === 'SpO2'
        ? 'spo2'
        : 'temperature';

    const [minVal, maxVal] = CLAMP[metric];

    const points = filtered
      .map(v => sanitize((v as Record<string, unknown>)[key]))
      .filter((v): v is number => v !== null)
      .map(v => Math.min(Math.max(v, minVal), maxVal));

    console.log(`[History] metric=${metric} valid points=${points.length}`);
    if (points.length > 0) {
      console.log('[History] sample values:', points.slice(0, 5));
    }

    if (points.length < 2) return null;

    // Limit to last 30 points to keep chart readable
    const trimmed = points.slice(-30);

    const labels = trimmed.map((_, i) => {
      if (trimmed.length <= 6) return `${i + 1}`;
      if (i === 0 || i === trimmed.length - 1) return `${i + 1}`;
      return i % 5 === 0 ? `${i + 1}` : '';
    });

    return { data: trimmed, labels };
  }, [filtered, metric]);

  const stats = useMemo(() => {
    if (!safeChartData) return { avg: 0, min: 0, max: 0 };
    const ys = safeChartData.data;
    const sum = ys.reduce((a, b) => a + b, 0);
    return {
      avg: sum / ys.length,
      min: Math.min(...ys),
      max: Math.max(...ys),
    };
  }, [safeChartData]);

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

        {/* Debug line — remove once chart is confirmed working */}
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: 10,
            marginTop: 2,
          }}
        >
          {items.length} records • {filtered.length} in range •{' '}
          {safeChartData?.data.length ?? 0} chart points
        </Text>

        {safeChartData ? (
          <LineChart
            data={{
              labels: safeChartData.labels,
              datasets: [{ data: safeChartData.data }],
            }}
            width={screenWidth - 80}
            height={200}
            withDots={safeChartData.data.length <= 10}
            withInnerLines={true}
            withOuterLines={false}
            bezier
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              backgroundGradientFromOpacity: 0,
              backgroundGradientToOpacity: 0,
              color: () => theme.colors.accent,
              labelColor: () => theme.colors.textSecondary,
              strokeWidth: 3,
              propsForBackgroundLines: {
                stroke: 'rgba(226,232,240,0.35)',
              },
            }}
            style={styles.chart}
          />
        ) : (
          <View style={styles.noData}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              {loading
                ? 'Loading data…'
                : items.length === 0
                ? 'No health records found'
                : `No valid ${metric} readings available`}
            </Text>
          </View>
        )}

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
  chart: { borderRadius: 12, marginTop: 10, marginLeft: -10 },
  noData: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
