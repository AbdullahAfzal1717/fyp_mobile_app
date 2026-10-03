import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import { getApiErrorMessage } from '../../services/apiClient';
import type { AuthStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { GradientButton } from '../../components/GradientButton';
import { RoleToggleCard } from '../../components/RoleToggleCard';
import type { Role } from '../../state/auth/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function SignupScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    name.trim().length >= 2 &&
    email.trim().length > 4 &&
    password.length >= 6 &&
    !loading;

  async function handleSignup() {
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const { email: confirmedEmail } = await signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      navigation.navigate('EmailVerification', { email: confirmedEmail });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboard>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[theme.typography.title, { color: theme.colors.text, marginBottom: 4 }]}>
            Create Account
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            Join VitalSync to monitor your health
          </Text>
        </View>

        {/* ── Role Selector ── */}
        <View style={styles.roleRow}>
          <RoleToggleCard
            title="Patient"
            subtitle="Track your vitals"
            icon="body-outline"
            selected={role === 'USER'}
            onPress={() => setRole('USER')}
          />
          <View style={{ width: 12 }} />
          <RoleToggleCard
            title="Supervisor"
            subtitle="Monitor patients"
            icon="pulse-outline"
            selected={role === 'SUPERVISOR'}
            onPress={() => setRole('SUPERVISOR')}
          />
        </View>

        {/* ── Fields ── */}
        {/* FIX: leftIcon and rightIcon now pass string names, not JSX elements */}
        <View style={styles.fields}>
          <TextField
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Ahmad Ali"
            leftIcon="person-outline"
            autoCapitalize="words"
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="ahmad@email.com"
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 6 characters"
            leftIcon="lock-closed-outline"
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword((p) => !p)}
          />
        </View>

        {/* ── Error ── */}
        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.critical + '15', borderColor: theme.colors.critical + '40' }]}>
            <Text style={[theme.typography.caption, { color: theme.colors.critical }]}>
              {error}
            </Text>
          </View>
        )}

        {/* ── Submit ── */}
        {/* FIX: label → title */}
        <GradientButton
          title="Create Account"
          onPress={handleSignup}
          loading={loading}
          disabled={!canSubmit}
          style={{ marginTop: 8 }}
        />

        {/* ── Email note ── */}
        <Text style={[theme.typography.small, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12 }]}>
          We'll send a verification code to your email
        </Text>

        {/* ── Login link ── */}
        <View style={styles.footer}>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[theme.typography.body, { color: theme.colors.accent, fontWeight: '700' }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 24 },
  roleRow: { flexDirection: 'row', marginBottom: 20 },
  fields: { gap: 4 },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 32,
  },
});