import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../../components/Screen';
import { GlassCard } from '../../components/GlassCard';
import { MetricCard } from '../../components/MetricCard';
import { RiskBadge } from '../../components/RiskBadge';
import { getSocket } from '../../services/realtime/socket';
import type { Vital } from '../../services/backend/types';
import { vitalsService } from '../../services/backend/vitalsService';
import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import type { UserStackParamList } from '../../navigation/types';
import { formatDateShort } from '../../utils/format';

export function UserHomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<UserStackParamList>>();
  const { state } = useAuth();
  const user = state.user!;

  const [latest, setLatest] = useState<Vital | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const riskColor = useMemo(() => {
    if (!latest) return theme.colors.textSecondary;
    return latest.riskLevel === 'CRITICAL'
      ? theme.colors.critical
      : latest.riskLevel === 'WARNING'
        ? theme.colors.caution
        : theme.colors.safe;
  }, [latest, theme.colors.caution, theme.colors.critical, theme.colors.safe, theme.colors.textSecondary]);

  async function load() {
    const v = await vitalsService.getLiveOrNull(user.id);
    setLatest(v);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await load();
      } catch {
        // ignore; UI will show placeholders
      }
    })();

    const s = getSocket();
    const onVitals = (payload: { userId: string; vital: Vital }) => {
      if (!alive) return;
      if (payload.userId !== user.id) return;
      setLatest(payload.vital);
    };
    s?.on('vitals:update', onVitals);

    return () => {
      alive = false;
      s?.off('vitals:update', onVitals);
    };
  }, [user.id]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>Hi, {user.name}</Text>
          <Text style={[styles.date, { color: theme.colors.textSecondary }]}>{formatDateShort(new Date())}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: 'rgba(37,99,235,0.10)' }]}>
          <Ionicons name="person" size={20} color={theme.colors.accent} />
        </View>
      </View>

      <GlassCard style={styles.riskCard}>
        <View style={styles.riskTop}>
          <Text style={[styles.riskTitle, { color: theme.colors.textSecondary }]}>AI Risk Score</Text>
          <RiskBadge level={latest?.riskLevel ?? 'SAFE'} />
        </View>

        <View style={styles.riskRow}>
          <Text style={[styles.score, { color: theme.colors.text }]}>
            {latest ? String(latest.riskScore) : '--'}
          </Text>
          <View style={[styles.activityChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
            <Ionicons
              name={latest?.activityState === 'RUNNING' ? 'walk' : 'body'}
              size={14}
              color={theme.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.activityText, { color: theme.colors.textSecondary }]}>
              {latest?.activityState ?? 'STATIC'}
            </Text>
          </View>
        </View>

        <View style={[styles.riskBar, { backgroundColor: 'rgba(37,99,235,0.08)' }]}>
          <View style={[styles.riskFill, { width: `${Math.min(100, latest?.riskScore ?? 0)}%`, backgroundColor: riskColor }]} />
        </View>
      </GlassCard>

      <View style={styles.metricsRow}>
        <MetricCard
          title="HR"
          icon="heart"
          value={latest?.heartRate != null ? String(Math.round(latest.heartRate)) : '--'}
          unit="bpm"
          accent={theme.colors.critical}
          livePulse
        />
        <View style={{ width: 12 }} />
        <MetricCard
          title="SpO₂"
          icon="water"
          value={latest?.spo2 != null ? String(Math.round(latest.spo2)) : '--'}
          unit="%"
          accent={theme.colors.accent2}
        />
        <View style={{ width: 12 }} />
        <MetricCard
          title="Temp"
          icon="thermometer"
          value={latest?.temperature != null ? String(Number(latest.temperature).toFixed(1)) : '--'}
          unit="°C"
          accent={theme.colors.caution}
        />
      </View>

      <View style={{ height: 16 }} />
      <Pressable onPress={() => navigation.navigate('WatchConnect')}>
        <GlassCard style={styles.statusBar} intensity={14}>
          <Ionicons name="watch-outline" size={18} color={theme.colors.accent} style={{ marginRight: 10 }} />
          <Text style={[styles.statusText, { color: theme.colors.textSecondary, flex: 1 }]}>
            Watch & Bluetooth: <Text style={{ color: theme.colors.safe, fontWeight: '900' }}>Tap to connect</Text>
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
        </GlassCard>
      </Pressable>

      <View style={{ height: 10 }} />
      <View
        style={{ height: 1, backgroundColor: theme.colors.border, opacity: 0.6 }}
      />
      <View style={{ height: 10 }} />

      <View style={styles.refreshPad}>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          Pull down to refresh live vitals.
        </Text>
      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  greeting: { fontSize: 22, fontWeight: '900' },
  date: { marginTop: 6, fontSize: 13, fontWeight: '700' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskCard: { marginTop: 16, padding: 16 },
  riskTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  riskTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.2 },
  riskRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 },
  score: { fontSize: 44, fontWeight: '900' },
  activityChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityText: { fontSize: 12, fontWeight: '900' },
  riskBar: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },
  riskFill: { height: '100%', borderRadius: 999 },
  metricsRow: { flexDirection: 'row', marginTop: 14 },
  statusBar: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 13, fontWeight: '800' },
  refreshPad: { alignItems: 'center', paddingVertical: 6 },
  hint: { fontSize: 12, fontWeight: '700' },
});

