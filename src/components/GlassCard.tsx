import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { useTheme } from '../theme/AppThemeProvider';

export function GlassCard({
  children,
  style,
  intensity = 22,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}) {
  const theme = useTheme();

  // BlurView on Android can be heavy; keep a graceful fallback.
  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          styles.base,
          {
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderColor: 'rgba(226,232,240,0.7)',
          },
          theme.shadows.softCard,
          style,
        ]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint="light" style={[styles.base, theme.shadows.softCard, style]}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: theme.radii.card,
            borderWidth: 1,
            borderColor: 'rgba(226,232,240,0.65)',
          },
        ]}
      />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
});

