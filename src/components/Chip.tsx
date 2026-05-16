import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { useTheme } from '../theme/AppThemeProvider';

export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  const bg = selected ? 'rgba(37,99,235,0.12)' : theme.colors.card;
  const border = selected ? 'rgba(37,99,235,0.35)' : theme.colors.border;
  const color = selected ? theme.colors.accent : theme.colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderColor: border,
        },
        style,
      ]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 10,
  },
  text: { fontSize: 12, fontWeight: '900' },
});

