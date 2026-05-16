import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { AppGradient } from './Gradient';
import { useTheme } from '../theme/AppThemeProvider';

export function GradientButton({
  title,
  onPress,
  disabled,
  loading,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const isDisabled = Boolean(disabled || loading);

  const content = useMemo(() => {
    if (loading) return <ActivityIndicator color={theme.colors.white} />;
    return (
      <>
        {icon ? <Ionicons name={icon} size={18} color={theme.colors.white} style={styles.icon} /> : null}
        <Text style={styles.title}>{title}</Text>
      </>
    );
  }, [icon, loading, theme.colors.white, title]);

  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[style, { opacity: isDisabled ? 0.55 : 1 }]}>
      <AppGradient style={[styles.btn, theme.shadows.softFloat]}>{content}</AppGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  icon: { marginRight: 8 },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

