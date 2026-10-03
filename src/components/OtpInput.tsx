import React, { useMemo, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '../theme/AppThemeProvider';

export function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
}) {
  const theme = useTheme();
  const inputs = useRef<Array<TextInput | null>>([]);

  const chars = useMemo(() => {
    const v = value
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, length);
    const arr = new Array(length).fill('');
    for (let i = 0; i < v.length; i += 1) arr[i] = v[i];
    return arr;
  }, [length, value]);

  function focus(idx: number) {
    inputs.current[idx]?.focus();
  }

  return (
    <View style={styles.row}>
      {chars.map((c, idx) => (
        <TextInput
          key={idx}
          ref={(r) => { inputs.current[idx] = r; }}
          value={c}
          keyboardType="default"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={1}
          style={[
            styles.box,
            {
              backgroundColor: theme.colors.card,
              borderColor: c ? theme.colors.accent : theme.colors.border,
              color: theme.colors.text,
            },
            theme.shadows.softCard,
          ]}
          onChangeText={(t) => {
            const char = t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-1);
            const raw = value
              .replace(/[^a-zA-Z0-9]/g, '')
              .toUpperCase()
              .slice(0, length);
            const nextArr = raw.split('');
            while (nextArr.length < length) nextArr.push('');

            if (!char) {
              nextArr[idx] = '';
              // FIX: replaced .trimEnd() with .replace(/\s+$/, '') for TS compatibility
              onChange(nextArr.join('').replace(/\s+$/, ''));
              return;
            }

            nextArr[idx] = char;
            const next = nextArr.join('').slice(0, length);
            onChange(next);
            if (idx < length - 1) focus(idx + 1);
          }}
          onKeyPress={(e) => {
            if (e.nativeEvent.key !== 'Backspace') return;
            if (chars[idx]) {
              const raw = value
                .replace(/[^a-zA-Z0-9]/g, '')
                .toUpperCase()
                .slice(0, length);
              const nextArr = raw.split('');
              while (nextArr.length < length) nextArr.push('');
              nextArr[idx] = '';
              // FIX: replaced .trimEnd() with .replace(/\s+$/, '') for TS compatibility
              onChange(nextArr.join('').replace(/\s+$/, ''));
              return;
            }
            if (idx > 0) focus(idx - 1);
          }}
          returnKeyType="done"
          textAlign="center"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  box: {
    width: 48,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});