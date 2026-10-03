import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
// FIX: NativeStackRouteProp does not exist — use RouteProp from @react-navigation/native
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import { getApiErrorMessage } from '../../services/apiClient';
import type { AuthStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { OtpInput } from '../../components/OtpInput';
import { GradientButton } from '../../components/GradientButton';
import { AppGradient } from '../../components/Gradient';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
// FIX: was NativeStackRouteProp — correct type is RouteProp
type Route = RouteProp<AuthStackParamList, 'EmailVerification'>;

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

export function EmailVerificationScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;

  const { verifyEmail, resendVerificationOtp } = useAuth();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const { remaining, reset: resetTimer } = useCountdown(60);

  // FIX: added explicit types to regex callback parameters (implicit any error)
  const maskedEmail = email.replace(
    /^(.{1})(.+)(@.+)$/,
    (_: string, first: string, middle: string, domain: string) =>
      `${first}${'*'.repeat(Math.min(middle.length, 4))}${domain}`,
  );

  async function handleVerify() {
    if (otp.length < 6) return;
    setError('');
    setLoading(true);
    try {
      await verifyEmail({ email, otp });
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
      await resendVerificationOtp(email);
      resetTimer();
      Alert.alert('Code Sent', `A new code was sent to ${maskedEmail}`);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setResending(false);
    }
  }

  useEffect(() => {
    if (otp.length === 6 && !loading) {
      handleVerify();
    }
  }, [otp]);

  return (
    <Screen keyboard>
      {/* ── Icon ── */}
      <View style={styles.iconWrap}>
        <AppGradient style={styles.iconCircle}>
          <Ionicons name="mail-open-outline" size={36} color="#fff" />
        </AppGradient>
      </View>

      {/* ── Heading ── */}
      <Text
        style={[
          theme.typography.title,
          { color: theme.colors.text, textAlign: 'center', marginBottom: 8 },
        ]}
      >
        Check Your Email
      </Text>
      <Text
        style={[
          theme.typography.body,
          {
            color: theme.colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
          },
        ]}
      >
        We sent a 6-digit code to{'\n'}
        <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>
          {maskedEmail}
        </Text>
      </Text>

      {/* ── OTP ── */}
      <View style={styles.otpWrap}>
        <OtpInput value={otp} onChange={setOtp} length={6} />
      </View>

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
        title="Verify Email"
        onPress={handleVerify}
        loading={loading}
        disabled={otp.length < 6 || loading}
        style={{ marginTop: 8 }}
      />

      {/* ── Resend ── */}
      <View style={styles.resendRow}>
        <Text
          style={[theme.typography.body, { color: theme.colors.textSecondary }]}
        >
          Didn't receive the code?{' '}
        </Text>
        <TouchableOpacity
          onPress={handleResend}
          disabled={remaining > 0 || resending}
        >
          <Text
            style={[
              theme.typography.body,
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
              : 'Resend'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Wrong email ── */}
      <TouchableOpacity
        style={styles.backRow}
        onPress={() => navigation.navigate('Signup')}
      >
        <Ionicons
          name="arrow-back-outline"
          size={16}
          color={theme.colors.textSecondary}
        />
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginLeft: 4 },
          ]}
        >
          Wrong email? Go back to sign up
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpWrap: { marginVertical: 28 },
  errorBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  backRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});
