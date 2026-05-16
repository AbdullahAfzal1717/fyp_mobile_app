import React from 'react';
import { MaskedViewIOS, StyleProp, Text, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/AppThemeProvider';

// iOS-only masked view is best; Android fallback is solid text.
export function GradientText({
  children,
  style,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();

  if (MaskedViewIOS) {
    return (
      <MaskedViewIOS maskElement={<Text style={style}>{children}</Text>}>
        <LinearGradient
          colors={[theme.colors.accent, theme.colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Text style={[style, { opacity: 0 }]}>{children}</Text>
        </LinearGradient>
      </MaskedViewIOS>
    );
  }

  return (
    <View>
      <Text style={[style, { color: theme.colors.accent }]}>{children}</Text>
    </View>
  );
}

