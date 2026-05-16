import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/AppThemeProvider';

export function Screen({
  children,
  style,
  scroll,
  keyboard,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scroll?: boolean;
  keyboard?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 18 },
      ]}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={theme.colors.accent} /> : undefined
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}>{children}</View>
  );

  if (!keyboard) {
    return <View style={[styles.root, { backgroundColor: theme.colors.bg }, style]}>{body}</View>;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.colors.bg }, style]}>
      {body}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingHorizontal: 20 },
});

