import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import { getApiErrorMessage } from '../../services/apiClient';
import type { AuthStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { GradientButton } from '../../components/GradientButton';
import { AppGradient } from '../../components/Gradient';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function ForgotPasswordScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim().length > 4 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      navigation.navigate('ResetPassword', {
        email: email.trim().toLowerCase(),
      });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboard>
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
          <Ionicons name="lock-open-outline" size={36} color="#fff" />
        </AppGradient>
      </View>

      {/* ── Heading ── */}
      <Text
        style={[
          theme.typography.title,
          { color: theme.colors.text, marginBottom: 8 },
        ]}
      >
        Forgot Password?
      </Text>
      <Text
        style={[
          theme.typography.body,
          {
            color: theme.colors.textSecondary,
            lineHeight: 22,
            marginBottom: 32,
          },
        ]}
      >
        No worries! Enter your email and we'll send you a reset code.
      </Text>

      {/* FIX: leftIcon as string icon name, not JSX element */}
      <TextField
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        placeholder="your@email.com"
        leftIcon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
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
        title="Send Reset Code"
        onPress={handleSubmit}
        loading={loading}
        disabled={!canSubmit}
        style={{ marginTop: 16 }}
      />

      {/* ── Back to login ── */}
      <TouchableOpacity
        style={styles.loginRow}
        onPress={() => navigation.navigate('Login')}
      >
        <Ionicons
          name="arrow-back-outline"
          size={14}
          color={theme.colors.accent}
        />
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.accent, fontWeight: '700', marginLeft: 4 },
          ]}
        >
          Back to Sign In
        </Text>
      </TouchableOpacity>
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
  errorBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
});
