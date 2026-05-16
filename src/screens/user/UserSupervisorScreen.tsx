import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../../components/Screen';
import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import type { UserStackParamList } from '../../navigation/types';

export function UserSupervisorScreen() {
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<UserStackParamList>>();
  const { state } = useAuth();
  const user = state.user!;

  // backend currently doesn't provide "my supervisor" details in one endpoint.
  // We keep this screen ready: CTA takes user to SendRequest.
  const connected = useMemo(() => false, []);
  const [loading, setLoading] = useState(false);

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.colors.text }]}>My Supervisor</Text>

      {connected ? (
        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: 'rgba(37,99,235,0.10)' }]}>
              <Ionicons name="medkit" size={20} color={theme.colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: theme.colors.text }]}>Dr —</Text>
              <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>Your Supervisor</Text>
            </View>
            <View style={styles.dotWrap}>
              <View style={[styles.dot, { backgroundColor: theme.colors.safe }]} />
            </View>
          </View>
        </GlassCard>
      ) : (
        <GlassCard style={styles.empty}>
          <View style={styles.center}>
            <Ionicons name="link-outline" size={28} color={theme.colors.accent} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Connect to a Supervisor</Text>
            <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>
              Use the 6‑digit supervisor code to send a connection request.
            </Text>
          </View>
          <View style={{ height: 14 }} />
          <GradientButton
            title="Send Request"
            icon="paper-plane-outline"
            loading={loading}
            onPress={() => {
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                nav.navigate('SendRequest');
              }, 150);
            }}
          />
        </GlassCard>
      )}

      <View style={{ height: 14 }} />
      <GlassCard style={styles.smallCard} intensity={14}>
        <Text style={[styles.smallLabel, { color: theme.colors.textSecondary }]}>Account</Text>
        <Text style={[styles.smallValue, { color: theme.colors.text }]} numberOfLines={1}>
          {user.email}
        </Text>
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '900', paddingHorizontal: 20, paddingTop: 10 },
  card: { marginHorizontal: 20, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { fontSize: 15, fontWeight: '900' },
  sub: { marginTop: 6, fontSize: 12, fontWeight: '800' },
  dotWrap: { padding: 8 },
  dot: { width: 10, height: 10, borderRadius: 999 },
  empty: { marginHorizontal: 20, marginTop: 14, padding: 18 },
  center: { alignItems: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '900' },
  emptySub: { marginTop: 8, fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 18 },
  smallCard: { marginHorizontal: 20 },
  smallLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 0.2 },
  smallValue: { marginTop: 8, fontSize: 13, fontWeight: '800' },
});

