import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';

import { Chip } from '../../components/Chip';
import { GlassCard } from '../../components/GlassCard';
import { Screen } from '../../components/Screen';
import { vitalsService } from '../../services/backend/vitalsService';
import type { Vital } from '../../services/backend/types';
import { getApiErrorMessage } from '../../services/apiClient';
import { getSocket } from '../../services/realtime/socket';
import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import { formatTimeAgo } from '../../utils/format';

const screenWidth = Dimensions.get('window').width;
const PAGE_SIZE = 8;

type Range = 'Today' | 'Week' | 'Month';
type Metric = 'HR' | 'SpO2' | 'Temp';

const CLAMP: Record<Metric, [number, number]> = {
  HR: [20, 250],
  SpO2: [50, 100],
  Temp: [30, 45],
};

function sanitize(v: unknown): number | null {
  const n = Number(v);
  if (v == null || Number.isNaN(n) || !Number.isFinite(n)) return null;
  return n;
}

function rangeWindowMs(range: Range) {
  if (range === 'Today') return 24 * 3600e3;
  if (range === 'Week') return 7 * 24 * 3600e3;
  return 30 * 24 * 3600e3;
}

export function UserHistoryScreen() {
  const theme = useTheme();
  const { state } = useAuth();
  const user = state.user!;

  const [range, setRange] = useState<Range>('Today');
  const [metric, setMetric] = useState<Metric>('HR');
  const [items, setItems] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const hist = await vitalsService.getHistory(user.id);
      setItems(Array.isArray(hist) ? hist : []);
    } catch (e) {
      setItems([]);
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useFocusEffect(
    useCallback(() => {
      load();
      const s = getSocket();
      const onVitals = (payload: { userId: string; vital: Vital }) => {
        if (String(payload.userId) !== String(user.id)) return;
        setItems(prev => {
          const next = [
            payload.vital,
            ...prev.filter(v => v._id !== payload.vital._id),
          ];
          return next.slice(0, 200);
        });
      };
      s?.on('vitals:update', onVitals);
      return () => s?.off('vitals:update', onVitals);
    }, [load, user.id]),
  );

  // Reset pagination when range changes
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [range, metric]);

  // Newest-first list filtered by selected time range (no silent fallback)
  const filteredNewestFirst = useMemo(() => {
    const windowMs = rangeWindowMs(range);
    const now = Date.now();
    return items
      .filter(v => {
        const ts = new Date(v.timestamp).getTime();
        return !Number.isNaN(ts) && now - ts <= windowMs;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [items, range]);

  // Oldest→newest for chart drawing
  const filteredChronological = useMemo(
    () => [...filteredNewestFirst].reverse(),
    [filteredNewestFirst],
  );

  const safeChartData = useMemo(() => {
    const key =
      metric === 'HR' ? 'heartRate' : metric === 'SpO2' ? 'spo2' : 'temperature';
    const [minVal, maxVal] = CLAMP[metric];

    const points = filteredChronological
      .map(v => sanitize((v as Record<string, unknown>)[key]))
      .filter((v): v is number => v !== null)
      .map(v => Math.min(Math.max(v, minVal), maxVal));

    if (points.length < 2) return null;

    const trimmed = points.slice(-30);
    const labels = trimmed.map((_, i) => {
      if (trimmed.length <= 6) return `${i + 1}`;
      if (i === 0 || i === trimmed.length - 1) return `${i + 1}`;
      return i % 5 === 0 ? `${i + 1}` : '';
    });

    return { data: trimmed, labels, pointCount: points.length };
  }, [filteredChronological, metric]);

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
  const visibleReadings = filteredNewestFirst.slice(0, visibleCount);
  const hasMore = visibleCount < filteredNewestFirst.length;

  return (
    <Screen scroll refreshing={loading} onRefresh={load}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Health History
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: 12,
          fontWeight: '700',
          marginTop: 4,
        }}>
        Signed in as {user.email}
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

      {!!error && (
        <GlassCard style={styles.banner}>
          <Text style={{ color: theme.colors.critical, fontWeight: '800' }}>
            {error}
          </Text>
        </GlassCard>
      )}

      <GlassCard style={styles.chartCard}>
        <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]}>
          {loading ? 'Loading…' : `${metric} · ${range}`}
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: 11,
            fontWeight: '700',
            marginTop: 4,
          }}>
          {filteredNewestFirst.length} reading
          {filteredNewestFirst.length === 1 ? '' : 's'} in {range.toLowerCase()}
          {items.length !== filteredNewestFirst.length
            ? ` · ${items.length} total stored`
            : ''}
          {safeChartData
            ? ` · chart uses last ${safeChartData.data.length}`
            : ''}
        </Text>

        {safeChartData ? (
          <LineChart
            data={{
              labels: safeChartData.labels,
              datasets: [{ data: safeChartData.data }],
            }}
            width={Math.min(screenWidth - 80, 360)}
            height={200}
            withDots={safeChartData.data.length <= 10}
            withInnerLines
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
                lineHeight: 18,
              }}>
              {loading
                ? 'Loading data…'
                : filteredNewestFirst.length === 0
                  ? `No readings in ${range.toLowerCase()}. Try Week/Month or start Demo Stream.`
                  : `Need at least 2 ${metric} readings in this range for a chart`}
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
        Recent readings ({range})
      </Text>

      {visibleReadings.length === 0 ? (
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontWeight: '700',
            marginTop: 8,
          }}>
          No readings in this time range.
        </Text>
      ) : (
        visibleReadings.map(item => (
          <View
            key={String(item._id)}
            style={[styles.rowItem, { borderColor: theme.colors.border }]}>
            <Text style={[styles.rowPrimary, { color: theme.colors.text }]}>
              HR {item.heartRate ?? '--'} · SpO₂ {item.spo2 ?? '--'} · Temp{' '}
              {item.temperature ?? '--'}
            </Text>
            <Text
              style={[
                styles.rowSecondary,
                { color: theme.colors.textSecondary },
              ]}>
              {formatTimeAgo(item.timestamp)} · {item.activityState ?? '—'} ·{' '}
              {item.riskLevel ?? 'SAFE'}
            </Text>
          </View>
        ))
      )}

      {hasMore && (
        <Pressable
          onPress={() => setVisibleCount(c => c + PAGE_SIZE)}
          style={[styles.moreBtn, { borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.accent, fontWeight: '900' }}>
            Show more ({filteredNewestFirst.length - visibleCount} left)
          </Text>
        </Pressable>
      )}

      {!hasMore && filteredNewestFirst.length > PAGE_SIZE && (
        <Pressable onPress={() => setVisibleCount(PAGE_SIZE)} style={styles.moreBtn}>
          <Text style={{ color: theme.colors.textSecondary, fontWeight: '800' }}>
            Show less
          </Text>
        </Pressable>
      )}
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
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  banner: { marginTop: 12, padding: 12 },
  chartCard: { marginTop: 12, padding: 14 },
  cardLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 0.2 },
  chart: { borderRadius: 12, marginTop: 10, marginLeft: -10 },
  noData: {
    height: 180,
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
  moreBtn: {
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
});
