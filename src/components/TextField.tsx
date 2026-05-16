import React, { forwardRef, useMemo, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '../theme/AppThemeProvider';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, containerStyle, leftIcon, rightIcon, onRightIconPress, style, ...rest },
  ref,
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = useMemo(() => {
    if (error) return theme.colors.critical;
    if (focused) return theme.colors.accent;
    return theme.colors.border;
  }, [error, focused, theme.colors.accent, theme.colors.border, theme.colors.critical]);

  return (
    <View style={containerStyle}>
      {label ? <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.wrap, { borderColor, backgroundColor: theme.colors.card }, theme.shadows.softCard]}>
        {leftIcon ? <Ionicons name={leftIcon} size={18} color={theme.colors.textSecondary} style={styles.left} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textSecondary}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, { color: theme.colors.text }, style]}
          {...rest}
        />
        {rightIcon ? (
          <Pressable hitSlop={10} onPress={onRightIconPress} style={styles.rightPress}>
            <Ionicons name={rightIcon} size={18} color={theme.colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: theme.colors.critical }]}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  wrap: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  left: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: '600' },
  rightPress: { paddingLeft: 10 },
  error: { marginTop: 8, fontSize: 12, fontWeight: '600' },
});

