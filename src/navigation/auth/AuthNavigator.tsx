import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '../types';
import { LoginScreen } from '../../screens/shared/LoginScreen';
import { SignupScreen } from '../../screens/shared/SignupScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

