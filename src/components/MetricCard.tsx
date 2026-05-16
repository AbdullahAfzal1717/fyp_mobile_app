import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { GlassCard } from './GlassCard';
import { useTheme } from '../theme/AppThemeProvider';

export function MetricCard({
  title,
  icon,
  value,
  unit,
  accent,
  livePulse,
}: {
  title: string;
  icon: string;
  value: string;
  unit: string;
  accent: string;
  livePulse?: boolean;
}) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!livePulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [livePulse, pulse]);

  const ringStyle = useMemo(() => {
    const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
    const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.06] });
    return { transform: [{ scale }], opacity };
  }, [pulse]);

  return (
    <GlassCard style={styles.card} intensity={18}>
      <View style={styles.head}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(37,99,235,0.08)' }]}>
          {livePulse ? (
            <Animated.View style={[styles.ring, { backgroundColor: accent }, ringStyle]} />
          ) : null}
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <Text style={[styles.title, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
          {value}
        </Text>
        <Text style={[styles.unit, { color: theme.colors.textSecondary }]}>{unit}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 20,
    flex: 1,
    minHeight: 96,
  },
  head: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'visible',
  },
  ring: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 12,
  },
  title: { fontSize: 12, fontWeight: '800', flex: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 },
  value: { fontSize: 20, fontWeight: '900', marginRight: 6 },
  unit: { fontSize: 12, fontWeight: '800', paddingBottom: 2 },
});

