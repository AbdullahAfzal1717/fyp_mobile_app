import React, { createContext, useContext, useMemo } from 'react';

import { colors, radii, shadows, spacing, typography } from './tokens';

type AppTheme = {
  colors: typeof colors;
  radii: typeof radii;
  spacing: typeof spacing;
  typography: typeof typography;
  shadows: typeof shadows;
};

const ThemeContext = createContext<AppTheme | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<AppTheme>(
    () => ({
      colors,
      radii,
      spacing,
      typography,
      shadows,
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within AppThemeProvider');
  return ctx;
}

