import React, { useEffect, useRef, useState } from 'react';
// FIX: import DimensionValue to type the password strength bar width correctly
import {
  Alert,
  DimensionValue,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// FIX: NativeStackRouteProp does not exist — use RouteProp from @react-navigation/native
import type { RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import { getApiErrorMessage } from '../../services/apiClient';
import type { AuthStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { OtpInput } from '../../components/OtpInput';
import { TextField } from '../../components/TextField';
import { GradientButton } from '../../components/GradientButton';
import { AppGradient } from '../../components/Gradient';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
// FIX: was NativeStackRouteProp — correct type is RouteProp
type Route = RouteProp<AuthStackParamList, 'ResetPassword'>;

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  function reset() {
    setRemaining(seconds);
  }
  useEffect(() => {
    if (remaining <= 0) return;
    interval.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(interval.current!);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval.current!);
  }, [remaining]);
  return { remaining, reset };
}

// FIX: return type uses DimensionValue for width so React Native accepts percentage strings
function getPasswordStrength(password: string): {
  label: string;
  color: string;
  width: DimensionValue;
} {
  if (password.length === 0)
    return { label: '', color: 'transparent', width: '0%' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', color: '#EF4444', width: '25%' };
  if (score === 2) return { label: 'Fair', color: '#F59E0B', width: '50%' };
  if (score === 3) return { label: 'Good', color: '#3B82F6', width: '75%' };
  return { label: 'Strong', color: '#10B981', width: '100%' };
}

export function ResetPasswordScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;

  const { resetPassword, forgotPassword } = useAuth();

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { remaining, reset: resetTimer } = useCountdown(60);
  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword;

  const canSubmit =
    otp.length === 6 && newPassword.length >= 6 && passwordsMatch && !loading;

  // FIX: added explicit types to regex callback parameters (implicit any error)
  const maskedEmail = email.replace(
    /^(.{1})(.+)(@.+)$/,
    (_: string, first: string, middle: string, domain: string) =>
      `${first}${'*'.repeat(Math.min(middle.length, 4))}${domain}`,
  );

  async function handleReset() {
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await resetPassword({ email, otp, newPassword });
      setSuccess(true);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (remaining > 0) return;
    setResending(true);
    setError('');
    try {
      await forgotPassword(email);
      resetTimer();
      Alert.alert('Code Sent', `A new reset code was sent to ${maskedEmail}`);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setResending(false);
    }
  }

  // ── Success Screen ──
  if (success) {
    return (
      <Screen>
        <View style={styles.successWrap}>
          <AppGradient style={styles.iconCircle}>
            <Ionicons name="checkmark-outline" size={40} color="#fff" />
          </AppGradient>
          <Text
            style={[
              theme.typography.title,
              {
                color: theme.colors.text,
                textAlign: 'center',
                marginTop: 24,
                marginBottom: 8,
              },
            ]}
          >
            Password Reset!
          </Text>
          <Text
            style={[
              theme.typography.body,
              {
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginBottom: 40,
              },
            ]}
          >
            Your password was updated. Sign in with your new password.
          </Text>
          {/* FIX: label → title */}
          <GradientButton
            title="Go to Sign In"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </Screen>
    );
  }

  // ── Normal Screen ──
  return (
    <Screen keyboard scroll>
      {/* ── Back ── */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons
          name="arrow-back-outline"
          size={22}
          color={theme.colors.text}
        />
      </TouchableOpacity>

      {/* ── Icon ── */}
      <View style={styles.iconWrap}>
        <AppGradient style={styles.iconCircle}>
          <Ionicons name="key-outline" size={36} color="#fff" />
        </AppGradient>
      </View>

      {/* ── Heading ── */}
      <Text
        style={[
          theme.typography.title,
          { color: theme.colors.text, marginBottom: 8 },
        ]}
      >
        Reset Password
      </Text>
      <Text
        style={[
          theme.typography.body,
          {
            color: theme.colors.textSecondary,
            lineHeight: 22,
            marginBottom: 28,
          },
        ]}
      >
        Enter the code sent to{' '}
        <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>
          {maskedEmail}
        </Text>{' '}
        and choose a new password.
      </Text>

      {/* ── OTP ── */}
      <Text
        style={[
          theme.typography.caption,
          {
            color: theme.colors.textSecondary,
            marginBottom: 10,
            fontWeight: '600',
          },
        ]}
      >
        RESET CODE
      </Text>
      <OtpInput value={otp} onChange={setOtp} length={6} />

      {/* ── Resend ── */}
      <View style={styles.resendRow}>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary },
          ]}
        >
          Didn't get it?{' '}
        </Text>
        <TouchableOpacity
          onPress={handleResend}
          disabled={remaining > 0 || resending}
        >
          <Text
            style={[
              theme.typography.caption,
              {
                color:
                  remaining > 0
                    ? theme.colors.textSecondary
                    : theme.colors.accent,
                fontWeight: '700',
              },
            ]}
          >
            {resending
              ? 'Sending...'
              : remaining > 0
              ? `Resend in ${remaining}s`
              : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[styles.divider, { backgroundColor: theme.colors.border }]}
      />

      {/* FIX: leftIcon and rightIcon as strings, not JSX elements */}
      <TextField
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Min. 6 characters"
        leftIcon="lock-closed-outline"
        secureTextEntry={!showNew}
        rightIcon={showNew ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowNew(v => !v)}
      />

      {/* ── Password Strength Bar ── */}
      {newPassword.length > 0 && (
        <View style={styles.strengthWrap}>
          <View
            style={[
              styles.strengthTrack,
              { backgroundColor: theme.colors.border },
            ]}
          >
            {/* FIX: width is typed as DimensionValue so '25%', '50%' etc. are accepted */}
            <View
              style={[
                styles.strengthFill,
                { width: strength.width, backgroundColor: strength.color },
              ]}
            />
          </View>
          <Text
            style={[
              theme.typography.small,
              { color: strength.color, fontWeight: '700' },
            ]}
          >
            {strength.label}
          </Text>
        </View>
      )}

      {/* FIX: leftIcon and rightIcon as strings */}
      <TextField
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter new password"
        leftIcon="lock-closed-outline"
        secureTextEntry={!showConfirm}
        rightIcon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowConfirm(v => !v)}
        error={
          confirmPassword.length > 0 && !passwordsMatch
            ? "Passwords don't match"
            : undefined
        }
      />

      {/* ── Error ── */}
      {!!error && (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: theme.colors.critical + '15',
              borderColor: theme.colors.critical + '40',
            },
          ]}
        >
          <Text
            style={[theme.typography.caption, { color: theme.colors.critical }]}
          >
            {error}
          </Text>
        </View>
      )}

      {/* FIX: label → title */}
      <GradientButton
        title="Reset Password"
        onPress={handleReset}
        loading={loading}
        disabled={!canSubmit}
        style={{ marginTop: 16 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  backBtn: { marginBottom: 16, alignSelf: 'flex-start' },
  iconWrap: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  divider: { height: 1, marginVertical: 24 },
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -8,
    marginBottom: 12,
  },
  strengthTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  errorBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 8 },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
