import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';

import { GlassCard } from '../../components/GlassCard';
import { MetricCard } from '../../components/MetricCard';
import { RiskBadge } from '../../components/RiskBadge';
import { Screen } from '../../components/Screen';
import { aiService } from '../../services/backend/aiService';
import type { Alert as AlertRow, Vital } from '../../services/backend/types';
import { alertsService } from '../../services/backend/alertsService';
import { vitalsService } from '../../services/backend/vitalsService';
import { getSocket } from '../../services/realtime/socket';
import type { SupervisorStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/AppThemeProvider';
import { formatTimeAgo } from '../../utils/format';

const screenWidth = Dimensions.get('window').width;

type MetricTab = 'HR' | 'SpO2' | 'Temp';

// Clamp a value between min and max to prevent chart rendering issues
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Sanitize a single value — return null if invalid
function sanitize(v: unknown): number | null {
  const n = Number(v);
  if (v == null || isNaN(n) || !isFinite(n)) return null;
  return n;
}

export function UserDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SupervisorStackParamList, 'UserDetail'>>();
  const { userId, patientName } = route.params;

  const [live, setLive] = useState<Vital | null>(null);
  const [history, setHistory] = useState<Vital[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [baseline, setBaseline] = useState<{
    avgHeartRate: number;
    avgTemp: number;
  } | null>(null);
  const [metric, setMetric] = useState<MetricTab>('HR');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [h, a, b, l] = await Promise.all([
      vitalsService.getHistory(userId),
      alertsService.listByUser(userId),
      aiService.baseline(userId),
      vitalsService.getLiveOrNull(userId),
    ]);
    setHistory(h);
    setAlerts(a.slice(0, 15));
    setBaseline(b.baseline);
    setLive(l);
  }, [userId]);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        // ignore
      }
    })();
  }, [load]);

  useEffect(() => {
    const s = getSocket();
    const onVitals = (payload: { userId: string; vital: Vital }) => {
      if (String(payload.userId) !== String(userId)) return;
      setLive(payload.vital);
    };
    s?.on('vitals:update', onVitals);
    return () => {
      s?.off('vitals:update', onVitals);
    };
  }, [userId]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  // Build safe chart data from history
  const safeChartData = useMemo(() => {
    const key =
      metric === 'HR'
        ? 'heartRate'
        : metric === 'SpO2'
        ? 'spo2'
        : 'temperature';

    // Clamp ranges per metric to avoid extreme outliers breaking the chart
    const clampRange: Record<MetricTab, [number, number]> = {
      HR: [20, 250],
      SpO2: [50, 100],
      Temp: [30, 45],
    };
    const [minVal, maxVal] = clampRange[metric];

    const points = history
      .slice()
      .reverse()
      .map(v => sanitize((v as Record<string, unknown>)[key]))
      .filter((v): v is number => v !== null)
      .map(v => clamp(v, minVal, maxVal));

    // Chart needs at least 2 points
    if (points.length < 2) return null;

    // Limit to last 30 points to keep labels readable
    const trimmed = points.slice(-30);

    const labels = trimmed.map((_, i) => {
      if (i === 0 || i === trimmed.length - 1) return `${i + 1}`;
      if (trimmed.length <= 10) return `${i + 1}`;
      return i % 5 === 0 ? `${i + 1}` : '';
    });

    return { data: trimmed, labels };
  }, [history, metric]);

  const stats = useMemo(() => {
    if (!safeChartData || safeChartData.data.length === 0)
      return { avg: 0, min: 0, max: 0 };
    const ys = safeChartData.data;
    const sum = ys.reduce((a, b) => a + b, 0);
    return {
      avg: sum / ys.length,
      min: Math.min(...ys),
      max: Math.max(...ys),
    };
  }, [safeChartData]);

  const explanation = useMemo(() => {
    if (!live) return 'No live vitals yet. Waiting for the wearable to sync.';
    if (live.riskLevel === 'CRITICAL')
      return 'Escalation recommended: critical thresholds or sustained deviation from baseline.';
    if (live.riskLevel === 'WARNING')
      return 'Elevated risk versus baseline while activity context is considered.';
    return 'Within expected parameters based on current rules and baseline.';
  }, [live]);

  const riskColor = useMemo(() => {
    if (!live) return theme.colors.textSecondary;
    return live.riskLevel === 'CRITICAL'
      ? theme.colors.critical
      : live.riskLevel === 'WARNING'
      ? theme.colors.caution
      : theme.colors.safe;
  }, [live, theme.colors]);

  const unit = metric === 'HR' ? 'bpm' : metric === 'SpO2' ? '%' : '°C';

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      {/* Header */}
      <View style={styles.top}>
        <Pressable
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.name, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {patientName ?? 'Patient'}
          </Text>
          <Text
            style={[styles.subId, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {userId}
          </Text>
        </View>
        {live ? <RiskBadge level={live.riskLevel} /> : null}
      </View>

      {/* Risk Score */}
      <GlassCard style={styles.riskCard}>
        <Text
          style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}
        >
          Risk score
        </Text>
        <Text style={[styles.bigScore, { color: theme.colors.text }]}>
          {live ? String(live.riskScore) : '—'}
        </Text>
        <View style={[styles.bar, { backgroundColor: 'rgba(37,99,235,0.08)' }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(100, live?.riskScore ?? 0)}%`,
                backgroundColor: riskColor,
              },
            ]}
          />
        </View>
      </GlassCard>

      {/* Live Metric Cards */}
      <View style={styles.metricsRow}>
        <MetricCard
          title="HR"
          icon="heart"
          value={
            live?.heartRate != null ? String(Math.round(live.heartRate)) : '—'
          }
          unit="bpm"
          accent={theme.colors.critical}
          livePulse
        />
        <View style={{ width: 10 }} />
        <MetricCard
          title="SpO₂"
          icon="water"
          value={live?.spo2 != null ? String(Math.round(live.spo2)) : '—'}
          unit="%"
          accent={theme.colors.accent2}
        />
        <View style={{ width: 10 }} />
        <MetricCard
          title="Temp"
          icon="thermometer"
          value={
            live?.temperature != null
              ? String(Number(live.temperature).toFixed(1))
              : '—'
          }
          unit="°C"
          accent={theme.colors.caution}
        />
      </View>

      {/* Trend Chart */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Trend
      </Text>
      <View style={styles.metricTabs}>
        {(['HR', 'SpO2', 'Temp'] as MetricTab[]).map(m => (
          <Pressable
            key={m}
            onPress={() => setMetric(m)}
            style={[
              styles.tab,
              {
                borderColor:
                  metric === m ? theme.colors.accent : theme.colors.border,
                backgroundColor:
                  metric === m ? 'rgba(37,99,235,0.10)' : theme.colors.card,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    metric === m
                      ? theme.colors.accent
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {m}
            </Text>
          </Pressable>
        ))}
      </View>

      <GlassCard style={styles.chartCard}>
        {safeChartData ? (
          <>
            {/* Mini stats above chart */}
            <View style={styles.statsRow}>
              {[
                {
                  label: 'Avg',
                  value:
                    metric === 'Temp'
                      ? stats.avg.toFixed(1)
                      : Math.round(stats.avg),
                },
                {
                  label: 'Min',
                  value:
                    metric === 'Temp'
                      ? stats.min.toFixed(1)
                      : Math.round(stats.min),
                },
                {
                  label: 'Max',
                  value:
                    metric === 'Temp'
                      ? stats.max.toFixed(1)
                      : Math.round(stats.max),
                },
              ].map(s => (
                <View key={s.label} style={styles.statItem}>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {s.label}
                  </Text>
                  <Text
                    style={[styles.statValue, { color: theme.colors.text }]}
                  >
                    {s.value}{' '}
                    <Text
                      style={{
                        fontSize: 11,
                        color: theme.colors.textSecondary,
                      }}
                    >
                      {unit}
                    </Text>
                  </Text>
                </View>
              ))}
            </View>

            <LineChart
              data={{
                labels: safeChartData.labels,
                datasets: [{ data: safeChartData.data }],
              }}
              width={screenWidth - 64}
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
          </>
        ) : (
          <View style={styles.noData}>
            <Ionicons
              name="analytics-outline"
              size={32}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[styles.noDataText, { color: theme.colors.textSecondary }]}
            >
              Not enough data to show a trend
            </Text>
          </View>
        )}
      </GlassCard>

      {/* AI Analysis */}
      <GlassCard style={styles.aiCard}>
        <Text
          style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}
        >
          AI analysis
        </Text>
        <Text style={[styles.aiLine, { color: theme.colors.text }]}>
          Activity:{' '}
          <Text style={{ fontWeight: '900' }}>
            {live?.activityState ?? '—'}
          </Text>
        </Text>
        {baseline ? (
          <Text
            style={[
              styles.aiLine,
              { color: theme.colors.textSecondary, marginTop: 8 },
            ]}
          >
            Baseline (static): HR ~{baseline.avgHeartRate} bpm, temp ~
            {baseline.avgTemp}°C
          </Text>
        ) : null}
        <Text style={[styles.aiExplain, { color: theme.colors.textSecondary }]}>
          {explanation}
        </Text>
      </GlassCard>

      {/* Recent Alerts */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Recent alerts
      </Text>
      {alerts.length === 0 ? (
        <Text style={[styles.none, { color: theme.colors.textSecondary }]}>
          No alerts for this user.
        </Text>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={a => a._id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View
              style={[styles.alertRow, { borderColor: theme.colors.border }]}
            >
              <Ionicons
                name="warning-outline"
                size={18}
                color={
                  item.riskLevel === 'CRITICAL'
                    ? theme.colors.critical
                    : theme.colors.caution
                }
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.alertMsg, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {item.message}
                </Text>
                <Text
                  style={[
                    styles.alertTime,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {formatTimeAgo(item.createdAt)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  back: { marginRight: 10, padding: 4 },
  name: { fontSize: 18, fontWeight: '900' },
  subId: { marginTop: 4, fontSize: 11, fontWeight: '700' },
  riskCard: { marginTop: 14, padding: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 0.2 },
  bigScore: { marginTop: 8, fontSize: 40, fontWeight: '900' },
  bar: { height: 10, borderRadius: 999, overflow: 'hidden', marginTop: 12 },
  barFill: { height: '100%', borderRadius: 999 },
  metricsRow: { flexDirection: 'row', marginTop: 14 },
  sectionTitle: { marginTop: 18, fontSize: 16, fontWeight: '900' },
  metricTabs: { flexDirection: 'row', marginTop: 10 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  tabText: { fontSize: 12, fontWeight: '900' },
  chartCard: { marginTop: 12, padding: 12 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '800' },
  statValue: { fontSize: 15, fontWeight: '900', marginTop: 2 },
  chart: { borderRadius: 12, marginLeft: -8 },
  noData: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  noDataText: { fontSize: 13, fontWeight: '700', marginTop: 8 },
  aiCard: { marginTop: 14, padding: 16 },
  aiLine: { marginTop: 10, fontSize: 14, fontWeight: '700' },
  aiExplain: { marginTop: 10, fontSize: 13, fontWeight: '700', lineHeight: 20 },
  none: { marginTop: 8, fontSize: 13, fontWeight: '700' },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  alertMsg: { fontSize: 13, fontWeight: '800' },
  alertTime: { marginTop: 6, fontSize: 11, fontWeight: '800' },
});
