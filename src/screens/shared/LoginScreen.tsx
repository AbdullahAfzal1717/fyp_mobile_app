import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useGoogleIdTokenAuth } from '../../services/googleAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { GradientButton } from '../../components/GradientButton';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function LoginScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { login, googleSignIn } = useAuth();
  const { ready, response, idToken, promptAsync } = useGoogleIdTokenAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim().length > 4 && password.length >= 6 && !loading;

  // When Google auth session returns an id token → finish login with our backend
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!idToken) return;
      setGoogleLoading(true);
      setError('');
      try {
        await googleSignIn(idToken, 'USER');
      } catch (e) {
        if (alive) setError(getApiErrorMessage(e));
      } finally {
        if (alive) setGoogleLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [idToken, googleSignIn]);

  useEffect(() => {
    if (response?.type === 'error') {
      setError('Google sign-in was cancelled or failed. Try again.');
      setGoogleLoading(false);
    }
  }, [response]);

  async function handleLogin() {
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        setGoogleLoading(false);
        if (result.type === 'dismiss' || result.type === 'cancel') {
          setError('Google sign-in cancelled.');
        }
      }
      // success path handled by useEffect(idToken)
    } catch (e) {
      setError(getApiErrorMessage(e));
      setGoogleLoading(false);
    }
  }

  return (
    <Screen keyboard scroll>
      <View style={styles.header}>
        <Text style={[styles.brand, { color: theme.colors.accent }]}>VitalSync</Text>
        <Text style={[theme.typography.title, { color: theme.colors.text, marginBottom: 4 }]}>
          Welcome back
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          Sign in to monitor vitals or supervise your team
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.googleBtn,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
        onPress={handleGoogleSignIn}
        disabled={googleLoading || loading || !ready}
        activeOpacity={0.75}>
        {googleLoading ? (
          <ActivityIndicator size="small" color={theme.colors.accent} />
        ) : (
          <>
            <View style={styles.googleLogo}>
              <Text style={styles.googleLogoText}>G</Text>
            </View>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.text, fontWeight: '600' },
              ]}>
              Continue with Google
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginHorizontal: 12 },
          ]}>
          or email
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
      </View>

      <View style={styles.fields}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View>
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            leftIcon="lock-closed-outline"
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(p => !p)}
          />
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.accent, fontWeight: '700' },
              ]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {!!error && (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: theme.colors.critical + '15',
              borderColor: theme.colors.critical + '40',
            },
          ]}>
          <Text style={[theme.typography.caption, { color: theme.colors.critical }]}>
            {error}
          </Text>
        </View>
      )}

      <GradientButton
        title="Sign In"
        onPress={handleLogin}
        loading={loading}
        disabled={!canSubmit}
        style={{ marginTop: 8 }}
      />

      <View style={styles.footer}>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.accent, fontWeight: '700' },
            ]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 28 },
  brand: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
    marginBottom: 20,
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1 },
  fields: { gap: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 4, paddingVertical: 2 },
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
