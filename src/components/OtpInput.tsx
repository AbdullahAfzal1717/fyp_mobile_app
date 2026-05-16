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
    const v = value.replace(/\D/g, '').slice(0, length);
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
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          ref={(r) => {
            inputs.current[idx] = r;
          }}
          value={c}
          keyboardType="number-pad"
          maxLength={1}
          style={[
            styles.box,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
            theme.shadows.softCard,
          ]}
          onChangeText={(t) => {
            const digit = t.replace(/\D/g, '');
            const raw = value.replace(/\D/g, '').slice(0, length);
            const nextArr = raw.split('');

            if (!digit) {
              // clear current box
              nextArr[idx] = '';
              onChange(nextArr.join(''));
              return;
            }

            nextArr[idx] = digit;
            const next = nextArr.join('').slice(0, length);
            onChange(next);
            if (idx < length - 1) focus(idx + 1);
          }}
          onKeyPress={(e) => {
            if (e.nativeEvent.key !== 'Backspace') return;
            if (chars[idx]) {
              const raw = value.replace(/\D/g, '').slice(0, length);
              const nextArr = raw.split('');
              nextArr[idx] = '';
              onChange(nextArr.join(''));
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
    width: 46,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 18,
    fontWeight: '900',
  },
});

