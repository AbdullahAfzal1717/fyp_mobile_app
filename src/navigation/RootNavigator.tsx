import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

import { useAuth } from '../state/auth/AuthProvider';
import { useTheme } from '../theme/AppThemeProvider';
import { AuthNavigator } from './auth/AuthNavigator';
import { useRoleNavigator } from '../hooks/useRoleNavigator';
import { SplashScreen } from '../screens/shared/SplashScreen';

export function RootNavigator() {
  const { state } = useAuth();
  const theme = useTheme();
  const roleNav = useRoleNavigator();

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.bg,
      card: theme.colors.card,
      border: theme.colors.border,
      text: theme.colors.text,
      primary: theme.colors.accent,
      notification: theme.colors.accent2,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      {state.status === 'booting' ? (
        <SplashScreen />
      ) : state.status === 'signedOut' ? (
        <AuthNavigator />
      ) : (
        roleNav
      )}
    </NavigationContainer>
  );
}

