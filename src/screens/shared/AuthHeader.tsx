import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { AppGradient } from '../../components/Gradient';
import { useTheme } from '../../theme/AppThemeProvider';

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();

  return (
    <AppGradient style={styles.header}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="medical" size={22} color={theme.colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </AppGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    height: '32%',
    paddingHorizontal: 20,
    paddingTop: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  subtitle: { marginTop: 4, color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },
});

