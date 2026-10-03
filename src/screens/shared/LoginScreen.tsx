import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE SIGN-IN SETUP INSTRUCTIONS
// 1. Install: npx expo install @react-native-google-signin/google-signin
// 2. In app.json add under "expo":
//    "plugins": [["@react-native-google-signin/google-signin", {"iosUrlScheme":"..."}]]
// 3. Get webClientId from Google Cloud Console → APIs → OAuth 2.0 Client IDs
// 4. Uncomment the GoogleSignin import + configure block below
// 5. Run: npx expo prebuild --clean
// ─────────────────────────────────────────────────────────────────────────────
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
// GoogleSignin.configure({ webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com' });

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function LoginScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { login, googleSignIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim().length > 4 && password.length >= 6 && !loading;

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
      // Uncomment when package is installed:
      // await GoogleSignin.hasPlayServices();
      // const userInfo = await GoogleSignin.signIn();
      // const idToken = userInfo.data?.idToken;
      // if (!idToken) throw new Error('Google sign-in failed — no token received');
      // await googleSignIn(idToken);

      Alert.alert(
        'Google Sign-In',
        'Follow the setup instructions in LoginScreen.tsx to enable Google Sign-In.',
      );
    } catch (e: any) {
      setError(getApiErrorMessage(e));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <Screen keyboard scroll>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[theme.typography.title, { color: theme.colors.text, marginBottom: 4 }]}>
          Welcome Back
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          Sign in to continue to VitalSync
        </Text>
      </View>

      {/* ── Google Button ── */}
      <TouchableOpacity
        style={[styles.googleBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={handleGoogleSignIn}
        disabled={googleLoading || loading}
        activeOpacity={0.75}>
        {googleLoading ? (
          <ActivityIndicator size="small" color={theme.colors.accent} />
        ) : (
          <>
            <View style={styles.googleLogo}>
              <Text style={styles.googleLogoText}>G</Text>
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
              Continue with Google
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* ── Divider ── */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginHorizontal: 12 }]}>
          or sign in with email
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
      </View>

      {/* ── Fields ── */}
      {/* FIX: leftIcon and rightIcon now pass string icon names, not JSX elements */}
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
            onRightIconPress={() => setShowPassword((p) => !p)}
          />
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[theme.typography.caption, { color: theme.colors.accent, fontWeight: '700' }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Error ── */}
      {!!error && (
        <View style={[styles.errorBox, { backgroundColor: theme.colors.critical + '15', borderColor: theme.colors.critical + '40' }]}>
          <Text style={[theme.typography.caption, { color: theme.colors.critical }]}>
            {error}
          </Text>
        </View>
      )}

      {/* ── Login Button ── */}
      {/* FIX: label → title */}
      <GradientButton
        title="Sign In"
        onPress={handleLogin}
        loading={loading}
        disabled={!canSubmit}
        style={{ marginTop: 8 }}
      />

      {/* ── Signup Link ── */}
      <View style={styles.footer}>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={[theme.typography.body, { color: theme.colors.accent, fontWeight: '700' }]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 28 },
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