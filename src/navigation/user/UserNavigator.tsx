import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { UserStackParamList } from '../types';
import { UserTabs } from './UserTabs';
import { WatchConnectScreen } from '../../screens/user/WatchConnectScreen';
import { SendRequestScreen } from '../../screens/user/SendRequestScreen';

const Stack = createNativeStackNavigator<UserStackParamList>();

export function UserNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserTabs" component={UserTabs} />
      <Stack.Screen name="WatchConnect" component={WatchConnectScreen} />
      <Stack.Screen name="SendRequest" component={SendRequestScreen} />
    </Stack.Navigator>
  );
}

