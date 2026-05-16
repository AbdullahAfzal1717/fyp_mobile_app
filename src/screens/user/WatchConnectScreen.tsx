import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { Screen } from '../../components/Screen';
import type { ActivityState } from '../../services/backend/types';
import { vitalsService } from '../../services/backend/vitalsService';
import { useTheme } from '../../theme/AppThemeProvider';

type FoundDevice = { id: string; name: string; signal: number };

export function WatchConnectScreen() {
  const theme = useTheme();
  const navigation = useNavigation();

  const [scanning, setScanning] = useState(true);
  const [devices, setDevices] = useState<FoundDevice[]>([]);
  const [connectedTo, setConnectedTo] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
        Animated.timing(ring, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, ring]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDevices([
        { id: 'w1', name: 'Command-X Wear OS', signal: 82 },
        { id: 'w2', name: 'Galaxy Watch Health', signal: 64 },
      ]);
      setScanning(false);
    }, 2200);
    return () => clearTimeout(t);
  }, []);

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  async function connect(device: FoundDevice) {
    setConnectedTo(device.name);
    try {
      const activityState: ActivityState = 'STATIC';
      await vitalsService.upload({
        heartRate: 76 + Math.floor(Math.random() * 8),
        temperature: 36.8 + Math.random() * 0.4,
        spo2: 96 + Math.floor(Math.random() * 3),
        activityState,
      });
    } catch {
      // still show connected UX if upload fails (network)
    }
  }

  const subtitle = useMemo(() => {
    if (connectedTo) return `Connected to ${connectedTo}`;
    if (scanning) return 'Searching for devices…';
    return 'Tap a device to pair';
  }, [connectedTo, scanning]);

  return (
    <Screen scroll>
      <View style={styles.top}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text }]}>Watch</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.scanArea}>
        <Animated.View style={[styles.ringOuter, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}>
          <View style={[styles.ringInner, { borderColor: theme.colors.accent }]} />
        </Animated.View>
        <Animated.View style={[styles.bubble, { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] }]}>
          <Ionicons name="bluetooth" size={34} color={theme.colors.accent} />
        </Animated.View>
      </View>

      <Text style={[styles.status, { color: theme.colors.textSecondary }]}>{subtitle}</Text>

      {connectedTo ? (
        <GlassCard style={styles.connected}>
          <Ionicons name="checkmark-circle" size={28} color={theme.colors.safe} />
          <Text style={[styles.connectedText, { color: theme.colors.text }]}>Connected</Text>
          <Text style={[styles.connectedSub, { color: theme.colors.textSecondary }]}>
            A sample vital was synced to your supervisor pipeline.
          </Text>
          <View style={{ height: 12 }} />
          <GradientButton title="Done" onPress={() => navigation.goBack()} />
        </GlassCard>
      ) : (
        <>
          <FlatList
            data={devices}
            keyExtractor={(d) => d.id}
            scrollEnabled={false}
            ListEmptyComponent={
              scanning ? null : (
                <Text style={[styles.none, { color: theme.colors.textSecondary }]}>No devices found.</Text>
              )
            }
            renderItem={({ item }) => (
              <Pressable onPress={() => connect(item)}>
                <GlassCard style={styles.device}>
                  <View style={[styles.deviceIcon, { backgroundColor: 'rgba(37,99,235,0.10)' }]}>
                    <Ionicons name="watch-outline" size={22} color={theme.colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.deviceName, { color: theme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.signal, { color: theme.colors.textSecondary }]}>Signal {item.signal}%</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </GlassCard>
              </Pressable>
            )}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  back: { padding: 4 },
  title: { fontSize: 18, fontWeight: '900' },
  scanArea: { height: 220, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  ringOuter: { position: 'absolute', width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  ringInner: {
    width: 200,
    height: 200,
    borderRadius: 999,
    borderWidth: 2,
  },
  bubble: {
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  status: { textAlign: 'center', fontSize: 14, fontWeight: '800', marginBottom: 16 },
  device: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 12 },
  deviceIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceName: { fontSize: 15, fontWeight: '900' },
  signal: { marginTop: 4, fontSize: 12, fontWeight: '800' },
  none: { textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: '800' },
  connected: { alignItems: 'center', padding: 18, marginTop: 8 },
  connectedText: { marginTop: 10, fontSize: 18, fontWeight: '900' },
  connectedSub: { marginTop: 8, fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 18 },
});
