import React, { useMemo } from 'react';

import { useAuth } from '../state/auth/AuthProvider';
import { UserNavigator } from '../navigation/user/UserNavigator';
import { SupervisorNavigator } from '../navigation/supervisor/SupervisorNavigator';

export function useRoleNavigator() {
  const { state } = useAuth();

  return useMemo(() => {
    if (state.status !== 'signedIn' || !state.user) return null;
    return state.user.role === 'SUPERVISOR' ? <SupervisorNavigator /> : <UserNavigator />;
  }, [state.status, state.user]);
}

