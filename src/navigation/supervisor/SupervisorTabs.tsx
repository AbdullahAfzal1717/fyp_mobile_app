import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import type { SupervisorTabParamList } from '../types';
import { useTheme } from '../../theme/AppThemeProvider';
import { SupervisorOverviewScreen } from '../../screens/supervisor/SupervisorOverviewScreen';
import { SupervisorAlertsScreen } from '../../screens/supervisor/SupervisorAlertsScreen';
import { SupervisorRequestsScreen } from '../../screens/supervisor/SupervisorRequestsScreen';
import { SupervisorProfileScreen } from '../../screens/supervisor/SupervisorProfileScreen';

const Tab = createBottomTabNavigator<SupervisorTabParamList>();

export function SupervisorTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icon =
            route.name === 'SupervisorOverview'
              ? focused
                ? 'people'
                : 'people-outline'
              : route.name === 'SupervisorAlerts'
                ? focused
                  ? 'warning'
                  : 'warning-outline'
                : route.name === 'SupervisorRequests'
                  ? focused
                    ? 'mail'
                    : 'mail-outline'
                  : focused
                    ? 'person'
                    : 'person-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name="SupervisorOverview" component={SupervisorOverviewScreen} options={{ title: 'Overview' }} />
      <Tab.Screen name="SupervisorAlerts" component={SupervisorAlertsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="SupervisorRequests" component={SupervisorRequestsScreen} options={{ title: 'Requests' }} />
      <Tab.Screen name="SupervisorProfile" component={SupervisorProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

