import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import type { UserTabParamList } from '../types';
import { useTheme } from '../../theme/AppThemeProvider';
import { UserHomeScreen } from '../../screens/user/UserHomeScreen';
import { UserHistoryScreen } from '../../screens/user/UserHistoryScreen';
import { UserSupervisorScreen } from '../../screens/user/UserSupervisorScreen';
import { UserNotificationsScreen } from '../../screens/user/UserNotificationsScreen';
import { UserProfileScreen } from '../../screens/user/UserProfileScreen';

const Tab = createBottomTabNavigator<UserTabParamList>();

export function UserTabs() {
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
            route.name === 'UserHome'
              ? focused
                ? 'pulse'
                : 'pulse-outline'
              : route.name === 'UserHistory'
                ? focused
                  ? 'analytics'
                  : 'analytics-outline'
                : route.name === 'UserSupervisor'
                  ? focused
                    ? 'medkit'
                    : 'medkit-outline'
                  : route.name === 'UserNotifications'
                    ? focused
                      ? 'notifications'
                      : 'notifications-outline'
                    : focused
                      ? 'person'
                      : 'person-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name="UserHome" component={UserHomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="UserHistory" component={UserHistoryScreen} options={{ title: 'History' }} />
      <Tab.Screen name="UserSupervisor" component={UserSupervisorScreen} options={{ title: 'Supervisor' }} />
      <Tab.Screen
        name="UserNotifications"
        component={UserNotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Tab.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

