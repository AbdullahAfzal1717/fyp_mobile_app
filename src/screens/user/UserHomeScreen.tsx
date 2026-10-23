import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../../components/Screen';
import { GlassCard } from '../../components/GlassCard';
import { MetricCard } from '../../components/MetricCard';
import { RiskBadge } from '../../components/RiskBadge';
import { GradientButton } from '../../components/GradientButton';
import { getSocket } from '../../services/realtime/socket';
import type { Vital } from '../../services/backend/types';
import { vitalsService } from '../../services/backend/vitalsService';
import { getApiErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import type { UserStackParamList } from '../../navigation/types';
import { formatDateShort } from '../../utils/format';
import { env } from '../../config/env';

export function UserHomeScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<UserStackParamList>>();
  const { state } = useAuth();
  const user = state.user!;

  const [latest, setLatest] = useState<Vital | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const riskColor = useMemo(() => {
    if (!latest) return theme.colors.textSecondary;
    return latest.riskLevel === 'CRITICAL'
      ? theme.colors.critical
      : latest.riskLevel === 'WARNING'
        ? theme.colors.caution
        : theme.colors.safe;
  }, [
    latest,
    theme.colors.caution,
    theme.colors.critical,
    theme.colors.safe,
    theme.colors.textSecondary,
  ]);

  async function load() {
    setLoadError('');
    try {
      const v = await vitalsService.getLiveOrNull(user.id);
      setLatest(v);
    } catch (e) {
      setLatest(null);
      setLoadError(getApiErrorMessage(e));
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await load();
    })();

    const s = getSocket();
    const onVitals = (payload: { userId: string; vital: Vital }) => {
      if (!alive) return;
      if (String(payload.userId) !== String(user.id)) return;
      setLatest(payload.vital);
      setLoadError('');
    };
    s?.on('vitals:update', onVitals);

    return () => {
      alive = false;
      s?.off('vitals:update', onVitals);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const empty = loaded && !latest && !loadError;

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>
            Hi, {user.name}
          </Text>
          <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
            {formatDateShort(new Date())}
          </Text>
        </View>
        <View
          style={[styles.avatar, { backgroundColor: 'rgba(37,99,235,0.10)' }]}>
          <Ionicons name="person" size={20} color={theme.colors.accent} />
        </View>
      </View>

      {!!loadError && (
        <GlassCard style={[styles.banner, { borderColor: theme.colors.critical }]}>
          <Text style={{ color: theme.colors.critical, fontWeight: '800', fontSize: 13 }}>
            Cannot reach server
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontWeight: '700',
              fontSize: 12,
              marginTop: 6,
              lineHeight: 17,
            }}>
            {loadError}
            {'\n'}API: {env.apiBaseUrl}
            {'\n'}Make sure backend is running and phone is on the same Wi‑Fi.
          </Text>
        </GlassCard>
      )}

      {empty && (
        <GlassCard style={styles.banner}>
          <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 14 }}>
            No vitals yet
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontWeight: '700',
              fontSize: 12,
              marginTop: 6,
              lineHeight: 17,
            }}>
            This account has no readings. Start the Demo Stream below (or run
            the PC simulator while logged in as patient1@test.com).
          </Text>
          <View style={{ height: 12 }} />
          <GradientButton
            title="Start demo vitals stream"
            onPress={() => navigation.navigate('WatchConnect')}
          />
        </GlassCard>
      )}

      <GlassCard style={styles.riskCard}>
        <View style={styles.riskTop}>
          <Text
            style={[styles.riskTitle, { color: theme.colors.textSecondary }]}>
            AI Risk Score
          </Text>
          <RiskBadge level={latest?.riskLevel ?? 'SAFE'} />
        </View>

        <View style={styles.riskRow}>
          <Text style={[styles.score, { color: theme.colors.text }]}>
            {latest ? String(latest.riskScore) : '--'}
          </Text>
          <View
            style={[
              styles.activityChip,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
              },
            ]}>
            <Ionicons
              name={latest?.activityState === 'RUNNING' ? 'walk' : 'body'}
              size={14}
              color={theme.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.activityText,
                { color: theme.colors.textSecondary },
              ]}>
              {latest?.activityState ?? 'STATIC'}
            </Text>
          </View>
        </View>

        <View
          style={[styles.riskBar, { backgroundColor: 'rgba(37,99,235,0.08)' }]}>
          <View
            style={[
              styles.riskFill,
              {
                width: `${Math.min(100, latest?.riskScore ?? 0)}%`,
                backgroundColor: riskColor,
              },
            ]}
          />
        </View>
      </GlassCard>

      <View style={styles.metricsRow}>
        <MetricCard
          title="HR"
          icon="heart"
          value={
            latest?.heartRate != null
              ? String(Math.round(latest.heartRate))
              : '--'
          }
          unit="bpm"
          accent={theme.colors.critical}
          livePulse
        />
        <View style={{ width: 12 }} />
        <MetricCard
          title="SpO₂"
          icon="water"
          value={
            latest?.spo2 != null ? String(Math.round(latest.spo2)) : '--'
          }
          unit="%"
          accent={theme.colors.accent2}
        />
        <View style={{ width: 12 }} />
        <MetricCard
          title="Temp"
          icon="thermometer"
          value={
            latest?.temperature != null
              ? String(Number(latest.temperature).toFixed(1))
              : '--'
          }
          unit="°C"
          accent={theme.colors.caution}
        />
      </View>

      <View style={{ height: 16 }} />
      <Pressable onPress={() => navigation.navigate('WatchConnect')}>
        <GlassCard style={styles.statusBar} intensity={14}>
          <Ionicons
            name="pulse"
            size={18}
            color={theme.colors.accent}
            style={{ marginRight: 10 }}
          />
          <Text
            style={[
              styles.statusText,
              { color: theme.colors.textSecondary, flex: 1 },
            ]}>
            Demo vitals stream:{' '}
            <Text style={{ color: theme.colors.safe, fontWeight: '900' }}>
              Tap to start
            </Text>
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.textSecondary}
          />
        </GlassCard>
      </Pressable>

      <View style={styles.refreshPad}>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          Pull down to refresh · API {env.apiBaseUrl.replace('http://', '')}
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
  banner: { marginTop: 14, padding: 14 },
  riskCard: { marginTop: 16, padding: 16 },
  riskTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.2 },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 12,
  },
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
  refreshPad: { alignItems: 'center', paddingVertical: 12 },
  hint: { fontSize: 11, fontWeight: '700' },
});
