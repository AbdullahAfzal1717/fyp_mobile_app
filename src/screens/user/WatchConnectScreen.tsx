import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { Chip } from '../../components/Chip';
import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { Screen } from '../../components/Screen';
import type { ActivityState } from '../../services/backend/types';
import { vitalsService } from '../../services/backend/vitalsService';
import { useTheme } from '../../theme/AppThemeProvider';

type StreamMode = 'safe' | 'warning' | 'critical';

function buildSample(mode: StreamMode, activityState: ActivityState) {
  if (mode === 'critical') {
    return {
      heartRate: activityState === 'STATIC' ? 128 : 172,
      spo2: 89,
      temperature: 39.5,
      activityState,
    };
  }
  if (mode === 'warning') {
    return {
      heartRate: activityState === 'STATIC' ? 112 : 145,
      spo2: 94,
      temperature: 37.6,
      activityState,
    };
  }
  return {
    heartRate:
      activityState === 'RUNNING'
        ? 118 + Math.floor(Math.random() * 12)
        : 68 + Math.floor(Math.random() * 12),
    spo2: 97 + Math.floor(Math.random() * 3),
    temperature: Number((36.6 + Math.random() * 0.4).toFixed(1)),
    activityState,
  };
}

/**
 * Temporary phone-side "wearable node" until Wear OS app exists.
 * Streams demo vitals to the same backend APIs a real watch will use.
 */
export function WatchConnectScreen() {
  const theme = useTheme();
  const navigation = useNavigation();

  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<StreamMode>('safe');
  const [activity, setActivity] = useState<ActivityState>('STATIC');
  const [lastHr, setLastHr] = useState<number | null>(null);
  const [lastRisk, setLastRisk] = useState<string>('--');
  const [queueSize, setQueueSize] = useState(0);
  const [statusLine, setStatusLine] = useState(
    'Demo stream — replaces fake Bluetooth until Wear OS is ready',
  );
  const [sent, setSent] = useState(0);

  const pulse = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef = useRef(mode);
  const activityRef = useRef(activity);
  modeRef.current = mode;
  activityRef.current = activity;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    vitalsService.getQueueSize().then(setQueueSize).catch(() => undefined);
  }, []);

  const stopStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStreaming(false);
    setStatusLine('Stream stopped');
  }, []);

  const sendOne = useCallback(async () => {
    const sample = buildSample(modeRef.current, activityRef.current);
    const result = await vitalsService.upload(sample);
    setLastHr(sample.heartRate);
    setQueueSize(result.queueSize);
    setSent(n => n + 1);

    if (result.buffered) {
      setLastRisk('BUFFERED');
      setStatusLine(`Offline — queued locally (${result.queueSize} packets)`);
    } else {
      setLastRisk(result.vital?.riskLevel ?? 'SAFE');
      setStatusLine(
        `Uploaded · Risk ${result.vital?.riskLevel ?? 'SAFE'} · Score ${result.vital?.riskScore ?? 0}`,
      );
    }
  }, []);

  const startStream = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStreaming(true);
    setStatusLine('Streaming demo vitals every 4s…');
    await sendOne();
    timerRef.current = setInterval(() => {
      sendOne().catch(() => undefined);
    }, 4000);
  }, [sendOne]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const subtitle = useMemo(() => {
    if (streaming) return 'Demo wearable node active';
    return 'Phone stands in for Wear OS until the watch app ships';
  }, [streaming]);

  return (
    <Screen scroll>
      <View style={styles.top}>
        <Pressable
          hitSlop={12}
          onPress={() => {
            stopStream();
            navigation.goBack();
          }}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Demo Stream
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.scanArea}>
        <Animated.View
          style={[
            styles.bubble,
            {
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, streaming ? 1.08 : 1.03],
                  }),
                },
              ],
              backgroundColor: streaming
                ? 'rgba(37,99,235,0.12)'
                : '#FFFFFF',
            },
          ]}
        >
          <Ionicons
            name={streaming ? 'pulse' : 'watch-outline'}
            size={34}
            color={theme.colors.accent}
          />
        </Animated.View>
      </View>

      <Text style={[styles.status, { color: theme.colors.textSecondary }]}>
        {subtitle}
      </Text>

      <GlassCard style={styles.card}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Scenario
        </Text>
        <View style={styles.row}>
          {(['safe', 'warning', 'critical'] as StreamMode[]).map(m => (
            <Chip
              key={m}
              label={m.toUpperCase()}
              selected={mode === m}
              onPress={() => setMode(m)}
            />
          ))}
        </View>

        <View style={{ height: 14 }} />
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Activity (contextual AI)
        </Text>
        <View style={styles.row}>
          {(['STATIC', 'RUNNING'] as ActivityState[]).map(a => (
            <Chip
              key={a}
              label={a}
              selected={activity === a}
              onPress={() => setActivity(a)}
            />
          ))}
        </View>
      </GlassCard>

      <View style={{ height: 12 }} />

      <GlassCard style={styles.stats}>
        <View style={styles.statCol}>
          <Text style={[styles.statVal, { color: theme.colors.text }]}>
            {lastHr ?? '--'}
          </Text>
          <Text style={[styles.statLbl, { color: theme.colors.textSecondary }]}>
            Last HR
          </Text>
        </View>
        <View style={styles.statCol}>
          <Text style={[styles.statVal, { color: theme.colors.text }]}>
            {lastRisk}
          </Text>
          <Text style={[styles.statLbl, { color: theme.colors.textSecondary }]}>
            Risk
          </Text>
        </View>
        <View style={styles.statCol}>
          <Text style={[styles.statVal, { color: theme.colors.text }]}>
            {queueSize}
          </Text>
          <Text style={[styles.statLbl, { color: theme.colors.textSecondary }]}>
            Offline queue
          </Text>
        </View>
        <View style={styles.statCol}>
          <Text style={[styles.statVal, { color: theme.colors.text }]}>
            {sent}
          </Text>
          <Text style={[styles.statLbl, { color: theme.colors.textSecondary }]}>
            Sent
          </Text>
        </View>
      </GlassCard>

      <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
        {statusLine}
      </Text>

      <View style={{ height: 16 }} />
      {streaming ? (
        <GradientButton title="Stop stream" onPress={stopStream} />
      ) : (
        <GradientButton title="Start demo vitals stream" onPress={startStream} />
      )}

      <View style={{ height: 10 }} />
      <GradientButton
        title="Flush offline queue now"
        onPress={async () => {
          const r = await vitalsService.flushQueue();
          setQueueSize(r.remaining);
          setStatusLine(
            r.synced
              ? `Synced ${r.synced} buffered packet(s)`
              : r.remaining
                ? `Still offline (${r.remaining} waiting)`
                : 'Queue empty',
          );
        }}
      />

      <Text style={[styles.footnote, { color: theme.colors.textSecondary }]}>
        Real Wear OS sensor upload will use the same /vitals/upload API.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  back: { padding: 4 },
  title: { fontSize: 18, fontWeight: '900' },
  scanArea: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  bubble: {
    width: 92,
    height: 92,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  status: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  card: { padding: 16 },
  label: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '900' },
  statLbl: { marginTop: 4, fontSize: 10, fontWeight: '800' },
  hint: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  footnote: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
