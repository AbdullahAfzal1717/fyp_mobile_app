import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Screen } from '../../components/Screen';
import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { OtpInput } from '../../components/OtpInput';
import { connectionsService } from '../../services/backend/connectionsService';
import { useTheme } from '../../theme/AppThemeProvider';
import { getApiErrorMessage } from '../../services/apiClient';

export function SendRequestScreen() {
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const canSend = useMemo(() => code.replace(/\D/g, '').length === 6, [code]);

  async function send() {
    if (!canSend || loading) return;
    setLoading(true);
    try {
      const res = await connectionsService.sendRequest(code.replace(/\D/g, ''));
      Alert.alert('Request sent', `Status: ${res.status}`);
    } catch (e) {
      Alert.alert('Failed', getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  return (
    <Screen>
      <Text style={[styles.title, { color: theme.colors.text }]}>Send Request</Text>

      <GlassCard style={styles.info}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: 'rgba(37,99,235,0.10)' }]}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.accent} />
          </View>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Enter the 6‑digit supervisor code provided by your supervisor. They will review and accept your request.
          </Text>
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Supervisor code</Text>
        <View style={{ height: 12 }} />
        <OtpInput value={code} onChange={setCode} />
        <View style={{ height: 16 }} />
        <GradientButton title="Send Request" icon="paper-plane-outline" onPress={send} disabled={!canSend} loading={loading} />
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '900', paddingHorizontal: 20, paddingTop: 10 },
  info: { marginHorizontal: 20, marginTop: 14, padding: 14 },
  infoRow: { flexDirection: 'row' },
  infoIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoText: { flex: 1, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  card: { marginHorizontal: 20, marginTop: 14, padding: 16 },
  label: { fontSize: 12, fontWeight: '900', letterSpacing: 0.2 },
});

