import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import type { ViewProps } from 'react-native';

import { useTheme } from '../theme/AppThemeProvider';

export function AppGradient({
  children,
  style,
  ...rest
}: ViewProps & {
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <LinearGradient
      {...rest}
      colors={[theme.colors.accent, theme.colors.accent2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}>
      {children}
    </LinearGradient>
  );
}

