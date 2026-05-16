import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthHeader } from './AuthHeader';
import { GradientButton } from '../../components/GradientButton';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { GlassCard } from '../../components/GlassCard';
import { useTheme } from '../../theme/AppThemeProvider';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../state/auth/AuthProvider';
import { getApiErrorMessage } from '../../services/apiClient';

export function LoginScreen() {
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 4, [email, password]);

  async function onSubmit() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
    } catch (e) {
      const msg = getApiErrorMessage(e);
      setError(msg);
      Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboard scroll style={{ backgroundColor: theme.colors.white }}>
      <View style={styles.page}>
        <AuthHeader title="Command-X" subtitle="Secure access to live health telemetry" />

        <View style={styles.cardWrap}>
          <GlassCard style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Welcome back</Text>
            <Text style={[styles.cardSub, { color: theme.colors.textSecondary }]}>Sign in to continue</Text>

            <View style={{ height: 16 }} />
            <TextField
              label="Email"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              returnKeyType="next"
            />
            <View style={{ height: 12 }} />
            <TextField
              label="Password"
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show}
              placeholder="••••••••"
              rightIcon={show ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShow((s) => !s)}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />

            {error ? <Text style={[styles.inlineError, { color: theme.colors.critical }]}>{error}</Text> : null}

            <View style={{ height: 16 }} />
            <GradientButton title="Login" onPress={onSubmit} disabled={!canSubmit} loading={loading} />
          </GlassCard>
        </View>

        <View style={styles.bottom}>
          <Text style={[styles.bottomText, { color: theme.colors.textSecondary }]}>New here?</Text>
          <Pressable onPress={() => nav.navigate('Signup')}>
            <Text style={[styles.link, { color: theme.colors.accent }]}> Sign up</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: 680 },
  cardWrap: {
    marginTop: -64,
    paddingHorizontal: 20,
  },
  card: {
    padding: 18,
  },
  cardTitle: { fontSize: 20, fontWeight: '900' },
  cardSub: { marginTop: 6, fontSize: 13, fontWeight: '700' },
  inlineError: { marginTop: 12, fontSize: 12, fontWeight: '700' },
  bottom: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 18,
    paddingBottom: 10,
  },
  bottomText: { fontSize: 13, fontWeight: '700' },
  link: { fontSize: 13, fontWeight: '900' },
});

