import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/AppThemeProvider';
import type { RiskLevel } from '../services/backend/types';

export function RiskBadge({ level }: { level: RiskLevel }) {
  const theme = useTheme();
  const { bg, label } = useMemo(() => {
    if (level === 'CRITICAL') return { bg: 'rgba(239,68,68,0.14)', label: 'CRITICAL' };
    if (level === 'WARNING') return { bg: 'rgba(245,158,11,0.16)', label: 'CAUTION' };
    return { bg: 'rgba(16,185,129,0.14)', label: 'SAFE' };
  }, [level]);

  const color = level === 'CRITICAL' ? theme.colors.critical : level === 'WARNING' ? theme.colors.caution : theme.colors.safe;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: 'rgba(226,232,240,0.9)' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  text: { fontSize: 12, fontWeight: '900', letterSpacing: 0.2 },
});

