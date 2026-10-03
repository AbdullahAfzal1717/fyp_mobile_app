import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../../components/Screen';
import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { OtpInput } from '../../components/OtpInput';
import { connectionsService } from '../../services/backend/connectionsService';
import { useTheme } from '../../theme/AppThemeProvider';
import { getApiErrorMessage } from '../../services/apiClient';
import { AppGradient } from '../../components/Gradient';
import type { UserStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<UserStackParamList>;

export function SendRequestScreen() {
  const theme = useTheme();
  const nav = useNavigation<Nav>();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const canSend = code.replace(/[^a-zA-Z0-9]/g, '').length === 6 && !loading;

  async function handleSend() {
    if (!canSend) return;
    setError('');
    setLoading(true);
    try {
      const cleanCode = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      await connectionsService.sendRequest(cleanCode);
      setSent(true);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  // ── Success Screen ──
  if (sent) {
    return (
      <Screen>
        <View style={styles.successWrap}>
          <AppGradient style={styles.successIcon}>
            <Ionicons name="paper-plane-outline" size={36} color="#fff" />
          </AppGradient>

          <Text
            style={[
              theme.typography.title,
              { color: theme.colors.text, textAlign: 'center', marginTop: 24 },
            ]}
          >
            Request Sent!
          </Text>
          <Text
            style={[
              theme.typography.body,
              {
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 22,
              },
            ]}
          >
            Your connection request has been sent. Your supervisor will receive
            a notification and can accept or reject it.
          </Text>

          <GlassCard style={styles.pendingCard}>
            <View style={styles.pendingRow}>
              <Ionicons
                name="time-outline"
                size={20}
                color={theme.colors.caution}
              />
              <Text
                style={[
                  theme.typography.body,
                  {
                    color: theme.colors.text,
                    marginLeft: 8,
                    fontWeight: '700',
                  },
                ]}
              >
                Status: Pending
              </Text>
            </View>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 6 },
              ]}
            >
              Check the "My Supervisor" tab to see the status. You can cancel
              the request from there if needed.
            </Text>
          </GlassCard>

          {/* FIX: label → title */}
          <GradientButton
            title="Back to My Supervisor"
            onPress={() => nav.goBack()}
            style={{ marginTop: 24 }}
          />
        </View>
      </Screen>
    );
  }

  // ── Normal Screen ──
  return (
    <Screen keyboard>
      {/* ── Back ── */}
      <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
        <Ionicons
          name="arrow-back-outline"
          size={22}
          color={theme.colors.text}
        />
      </TouchableOpacity>

      <Text
        style={[
          theme.typography.title,
          { color: theme.colors.text, marginBottom: 6 },
        ]}
      >
        Connect to Supervisor
      </Text>
      <Text
        style={[
          theme.typography.body,
          { color: theme.colors.textSecondary, marginBottom: 24 },
        ]}
      >
        Enter the unique code your supervisor shared with you.
      </Text>

      {/* ── Info card ── */}
      <GlassCard style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View
            style={[
              styles.infoIcon,
              { backgroundColor: theme.colors.accent + '15' },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.colors.accent}
            />
          </View>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, flex: 1, lineHeight: 18 },
            ]}
          >
            The code is 6 characters (letters + numbers). It is shown on your
            supervisor's profile screen.
          </Text>
        </View>
      </GlassCard>

      {/* ── Code entry ── */}
      <GlassCard style={styles.inputCard}>
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.textSecondary,
              fontWeight: '700',
              letterSpacing: 0.5,
              marginBottom: 14,
            },
          ]}
        >
          SUPERVISOR CODE
        </Text>
        <OtpInput value={code} onChange={setCode} length={6} />

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
              style={[
                theme.typography.caption,
                { color: theme.colors.critical },
              ]}
            >
              {error}
            </Text>
          </View>
        )}

        {/* FIX: label → title */}
        <GradientButton
          title="Send Request"
          onPress={handleSend}
          disabled={!canSend}
          loading={loading}
          style={{ marginTop: 16 }}
        />
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backBtn: { marginBottom: 16, alignSelf: 'flex-start' },
  infoCard: { marginBottom: 16, padding: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputCard: { padding: 16 },
  errorBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12 },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCard: { marginTop: 24, padding: 16, width: '100%' },
  pendingRow: { flexDirection: 'row', alignItems: 'center' },
});
