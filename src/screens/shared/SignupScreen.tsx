import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthHeader } from './AuthHeader';
import { GradientButton } from '../../components/GradientButton';
import { RoleToggleCard } from '../../components/RoleToggleCard';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { GlassCard } from '../../components/GlassCard';
import { useTheme } from '../../theme/AppThemeProvider';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../state/auth/AuthProvider';
import type { Role } from '../../state/auth/types';
import { getApiErrorMessage } from '../../services/apiClient';

export function SignupScreen() {
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [role, setRole] = useState<Role>('USER');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => name.trim().length >= 2 && email.trim().length > 3 && password.length >= 6, [email, name, password]);

  async function onSubmit() {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      await signup({ name: name.trim(), email: email.trim(), password, role });
    } catch (e) {
      Alert.alert('Signup failed', getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboard scroll style={{ backgroundColor: theme.colors.white }}>
      <View style={styles.page}>
        <AuthHeader title="Create account" subtitle="Set up your role and start monitoring" />

        <View style={styles.cardWrap}>
          <GlassCard style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Let’s get started</Text>
            <Text style={[styles.cardSub, { color: theme.colors.textSecondary }]}>Choose your role and continue</Text>

            <View style={{ height: 16 }} />
            <TextField label="Full name" leftIcon="person-outline" value={name} onChangeText={setName} placeholder="Your name" />
            <View style={{ height: 12 }} />
            <TextField
              label="Email"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <View style={{ height: 12 }} />
            <TextField
              label="Password"
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show}
              placeholder="Minimum 6 characters"
              rightIcon={show ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShow((s) => !s)}
            />

            <View style={{ height: 16 }} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Role</Text>
            <View style={styles.roleRow}>
              <RoleToggleCard
                title="I am a User"
                subtitle="Vitals + Supervisor link"
                icon="watch-outline"
                selected={role === 'USER'}
                onPress={() => setRole('USER')}
              />
              <View style={{ width: 12 }} />
              <RoleToggleCard
                title="I am a Supervisor"
                subtitle="Monitor patients"
                icon="medical-outline"
                selected={role === 'SUPERVISOR'}
                onPress={() => setRole('SUPERVISOR')}
              />
            </View>

            <View style={{ height: 16 }} />
            <GradientButton title="Sign up" onPress={onSubmit} disabled={!canSubmit} loading={loading} />
          </GlassCard>
        </View>

        <View style={styles.bottom}>
          <Text style={[styles.bottomText, { color: theme.colors.textSecondary }]}>Already have an account?</Text>
          <Pressable onPress={() => nav.navigate('Login')}>
            <Text style={[styles.link, { color: theme.colors.accent }]}> Login</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: 780 },
  cardWrap: { marginTop: -64, paddingHorizontal: 20 },
  card: { padding: 18 },
  cardTitle: { fontSize: 20, fontWeight: '900' },
  cardSub: { marginTop: 6, fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 12, fontWeight: '800', marginBottom: 10 },
  roleRow: { flexDirection: 'row' },
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

