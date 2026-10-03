// src/navigation/auth/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '../types';
import { LoginScreen } from '../../screens/shared/LoginScreen';
import { SignupScreen } from '../../screens/shared/SignupScreen';
import { EmailVerificationScreen } from '../../screens/shared/EmailVerificationScreen';
import { ForgotPasswordScreen } from '../../screens/shared/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../../screens/shared/ResetPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      {/* New screens — slide_from_right gives a natural forward feel */}
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
        options={{ animation: 'slide_from_right', gestureEnabled: false }} // prevent back gesture mid-verify
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
