import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Screen } from '../../components/Screen';
import { AppGradient } from '../../components/Gradient';
import { GlassCard } from '../../components/GlassCard';
import { authService } from '../../services/backend/authService';
import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';

export function SupervisorProfileScreen() {
  const theme = useTheme();
  const { state, logout } = useAuth();
  const user = state.user!;
  const [code, setCode] = useState<string | null>(user.supervisorCode ?? null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await authService.getSupervisorCode();
        if (alive) setCode(c);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Screen scroll>
      <GlassCard style={styles.profileCard}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(37,99,235,0.10)' }]}>
            <Ionicons name="person" size={22} color={theme.colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.colors.text }]}>{user.name}</Text>
            <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>Supervisor</Text>
          </View>
          <AppGradient style={styles.badge}>
            <Text style={styles.badgeText}>Supervisor</Text>
          </AppGradient>
        </View>
      </GlassCard>

      <View style={{ height: 14 }} />
      <AppGradient style={[styles.codeCard, theme.shadows.softFloat]}>
        <Text style={styles.codeLabel}>SUPERVISOR CODE</Text>
        <Text style={styles.codeValue}>{code ?? '------'}</Text>
        <Text style={styles.codeHint}>Share with your patients to connect.</Text>

        <View style={{ height: 12 }} />
        <View style={styles.codeActions}>
          <Pressable
            onPress={() => {
              if (!code) return;
              // Clipboard API can vary; keep a safe UX.
              Alert.alert('Copy', `Code: ${code}`);
            }}
            style={[styles.codeBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Ionicons name="copy-outline" size={16} color={theme.colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.codeBtnText}>Copy</Text>
          </Pressable>
          <View style={{ width: 12 }} />
          <Pressable
            onPress={async () => {
              if (!code) return;
              await Share.share({ message: `Command-X Supervisor Code: ${code}` });
            }}
            style={[styles.codeBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Ionicons name="share-outline" size={16} color={theme.colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.codeBtnText}>Share</Text>
          </Pressable>
        </View>
      </AppGradient>

      <View style={{ height: 14 }} />
      <Pressable
        onPress={logout}
        style={[
          styles.logout,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          theme.shadows.softCard,
        ]}>
        <Ionicons name="log-out-outline" size={18} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
        <Text style={[styles.logoutText, { color: theme.colors.textSecondary }]}>Logout</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { fontSize: 16, fontWeight: '900' },
  sub: { marginTop: 6, fontSize: 12, fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  codeCard: { borderRadius: 20, padding: 16 },
  codeLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '900', letterSpacing: 0.2 },
  codeValue: { color: '#FFFFFF', marginTop: 10, fontSize: 34, fontWeight: '900', letterSpacing: 2 },
  codeHint: { color: 'rgba(255,255,255,0.85)', marginTop: 8, fontSize: 12, fontWeight: '800' },
  codeActions: { flexDirection: 'row' },
  codeBtn: { flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  codeBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  logout: { height: 54, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  logoutText: { fontSize: 13, fontWeight: '900' },
});

