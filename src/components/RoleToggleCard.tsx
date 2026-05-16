import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { AppGradient } from './Gradient';
import { useTheme } from '../theme/AppThemeProvider';

export function RoleToggleCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
  style,
}: {
  title: string;
  subtitle: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  const content = (
    <View style={styles.inner}>
      <View style={[styles.iconWrap, { backgroundColor: selected ? 'rgba(255,255,255,0.22)' : theme.colors.bg }]}>
        <Ionicons name={icon} size={22} color={selected ? theme.colors.white : theme.colors.accent} />
      </View>
      <Text style={[styles.title, { color: selected ? theme.colors.white : theme.colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: selected ? 'rgba(255,255,255,0.85)' : theme.colors.textSecondary }]}>
        {subtitle}
      </Text>
    </View>
  );

  return (
    <Pressable onPress={onPress} style={[{ flex: 1 }, style]}>
      {selected ? (
        <AppGradient style={[styles.card, theme.shadows.softFloat]}>{content}</AppGradient>
      ) : (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderWidth: 1,
            },
            theme.shadows.softCard,
          ]}>
          {content}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    minHeight: 132,
    justifyContent: 'center',
  },
  inner: { alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 14, fontWeight: '900' },
  subtitle: { marginTop: 6, textAlign: 'center', fontSize: 12, fontWeight: '700' },
});

