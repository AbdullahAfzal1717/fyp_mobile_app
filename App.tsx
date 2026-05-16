import 'react-native-gesture-handler';
import 'react-native-reanimated';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/state/auth/AuthProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppThemeProvider } from './src/theme/AppThemeProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
