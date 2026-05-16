import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { SupervisorStackParamList } from '../types';
import { SupervisorTabs } from './SupervisorTabs';
import { UserDetailScreen } from '../../screens/supervisor/UserDetailScreen';

const Stack = createNativeStackNavigator<SupervisorStackParamList>();

export function SupervisorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SupervisorTabs" component={SupervisorTabs} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
    </Stack.Navigator>
  );
}

