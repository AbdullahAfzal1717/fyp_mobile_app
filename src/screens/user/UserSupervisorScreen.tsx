import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../../components/Screen';
import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import {
  connectionsService,
  type MySupervisorResult,
} from '../../services/backend/connectionsService';
import { getApiErrorMessage } from '../../services/apiClient';
import { getSocket } from '../../services/realtime/socket';
import type { UserStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<UserStackParamList>;

export function UserSupervisorScreen() {
  const theme = useTheme();
  const nav = useNavigation<Nav>();
  const { state } = useAuth();
  const user = state.user!;

  const [connection, setConnection] = useState<MySupervisorResult>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // ── Load connection status on every tab focus ──────────────────────────────
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const result = await connectionsService.mySupervisor();
          if (alive) setConnection(result);
        } catch {
          // ignore — stays null
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  // ── Real-time: update when supervisor accepts ──────────────────────────────
  useEffect(() => {
    let alive = true;
    const s = getSocket();
    const onAccepted = async () => {
      if (!alive) return;
      try {
        const result = await connectionsService.mySupervisor();
        if (alive) setConnection(result);
      } catch {
        /* ignore */
      }
    };
    s?.on('connection:accepted', onAccepted);
    return () => {
      alive = false;
      s?.off('connection:accepted', onAccepted);
    };
  }, []);

  // ── Pull to refresh ────────────────────────────────────────────────────────
  async function onRefresh() {
    setRefreshing(true);
    try {
      const result = await connectionsService.mySupervisor();
      setConnection(result);
    } finally {
      setRefreshing(false);
    }
  }

  // ── Cancel pending request ─────────────────────────────────────────────────
  function handleCancel() {
    if (!connection) return;
    Alert.alert(
      'Cancel Request',
      `Cancel your connection request to ${connection.supervisorName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await connectionsService.cancelRequest(connection.connectionId);
              setConnection(null);
            } catch (e) {
              Alert.alert('Error', getApiErrorMessage(e));
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  }

  const isAccepted = connection?.status === 'ACCEPTED';
  const isPending = connection?.status === 'PENDING';
  const isRejected = connection?.status === 'REJECTED';
  const hasNoConnection = !connection;

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        My Supervisor
      </Text>

      {/* ── Loading ── */}
      {loading && (
        <GlassCard style={styles.card}>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, textAlign: 'center' },
            ]}
          >
            Loading...
          </Text>
        </GlassCard>
      )}

      {/* ── ACCEPTED ── */}
      {!loading && isAccepted && connection && (
        <>
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: theme.colors.safe + '15',
                borderColor: theme.colors.safe + '40',
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={theme.colors.safe}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.safe, marginLeft: 6, fontWeight: '700' },
              ]}
            >
              Connected &amp; Monitored
            </Text>
          </View>

          <GlassCard style={styles.card}>
            <View style={styles.row}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.accent + '15' },
                ]}
              >
                <Ionicons name="medkit" size={22} color={theme.colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[theme.typography.h2, { color: theme.colors.text }]}
                >
                  {connection.supervisorName}
                </Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {connection.supervisorEmail}
                </Text>
                <Text
                  style={[
                    theme.typography.small,
                    { color: theme.colors.textSecondary, marginTop: 4 },
                  ]}
                >
                  Your Supervisor
                </Text>
              </View>
              <View
                style={[styles.liveDot, { backgroundColor: theme.colors.safe }]}
              />
            </View>
            <View
              style={[styles.infoRow, { borderTopColor: theme.colors.border }]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={theme.colors.accent}
              />
              <Text
                style={[
                  theme.typography.small,
                  { color: theme.colors.textSecondary, marginLeft: 6, flex: 1 },
                ]}
              >
                Your vitals are being monitored in real-time by your supervisor.
              </Text>
            </View>
          </GlassCard>
        </>
      )}

      {/* ── PENDING ── */}
      {!loading && isPending && connection && (
        <>
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: theme.colors.caution + '15',
                borderColor: theme.colors.caution + '40',
              },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={theme.colors.caution}
            />
            <Text
              style={[
                theme.typography.caption,
                {
                  color: theme.colors.caution,
                  marginLeft: 6,
                  fontWeight: '700',
                },
              ]}
            >
              Request Pending
            </Text>
          </View>

          <GlassCard style={styles.card}>
            <View style={styles.row}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.caution + '15' },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={22}
                  color={theme.colors.caution}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[theme.typography.h2, { color: theme.colors.text }]}
                >
                  {connection.supervisorName}
                </Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  Waiting for approval
                </Text>
              </View>
            </View>
            <View
              style={[styles.infoRow, { borderTopColor: theme.colors.border }]}
            >
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={theme.colors.caution}
              />
              <Text
                style={[
                  theme.typography.small,
                  { color: theme.colors.textSecondary, marginLeft: 6, flex: 1 },
                ]}
              >
                Your request is pending. The supervisor will be notified and can
                accept or reject it.
              </Text>
            </View>
            {/* FIX: label → title */}
            <GradientButton
              title={cancelling ? 'Cancelling...' : 'Cancel Request'}
              onPress={handleCancel}
              disabled={cancelling}
              style={{ marginTop: 12 }}
            />
          </GlassCard>
        </>
      )}

      {/* ── REJECTED ── */}
      {!loading && isRejected && (
        <>
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: theme.colors.critical + '15',
                borderColor: theme.colors.critical + '40',
              },
            ]}
          >
            <Ionicons
              name="close-circle-outline"
              size={16}
              color={theme.colors.critical}
            />
            <Text
              style={[
                theme.typography.caption,
                {
                  color: theme.colors.critical,
                  marginLeft: 6,
                  fontWeight: '700',
                },
              ]}
            >
              Request Rejected
            </Text>
          </View>

          <GlassCard style={styles.card}>
            <View style={styles.center}>
              <Ionicons
                name="close-circle-outline"
                size={32}
                color={theme.colors.critical}
              />
              <Text
                style={[
                  theme.typography.h2,
                  { color: theme.colors.text, marginTop: 10 },
                ]}
              >
                Request Not Approved
              </Text>
              <Text
                style={[
                  theme.typography.body,
                  {
                    color: theme.colors.textSecondary,
                    textAlign: 'center',
                    marginTop: 6,
                  },
                ]}
              >
                Your request was rejected. You can send a new request to a
                different supervisor.
              </Text>
            </View>
            {/* FIX: label → title */}
            <GradientButton
              title="Send New Request"
              onPress={() => nav.navigate('SendRequest')}
              style={{ marginTop: 16 }}
            />
          </GlassCard>
        </>
      )}

      {/* ── NO CONNECTION ── */}
      {!loading && hasNoConnection && (
        <GlassCard style={styles.emptyCard}>
          <View style={styles.center}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.colors.accent + '12' },
              ]}
            >
              <Ionicons
                name="link-outline"
                size={32}
                color={theme.colors.accent}
              />
            </View>
            <Text
              style={[
                theme.typography.h2,
                { color: theme.colors.text, marginTop: 14 },
              ]}
            >
              No Supervisor Yet
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
              Connect to a supervisor to have your vitals monitored in
              real-time. Ask your supervisor for their 6-digit code.
            </Text>
          </View>

          <View style={{ height: 20 }} />

          {[
            { n: '1', text: 'Get the 6-digit code from your supervisor' },
            { n: '2', text: 'Tap the button below and enter the code' },
            { n: '3', text: 'Wait for your supervisor to accept' },
          ].map(step => (
            <View key={step.n} style={styles.stepRow}>
              <View
                style={[
                  styles.stepNum,
                  { backgroundColor: theme.colors.accent },
                ]}
              >
                <Text style={styles.stepNumText}>{step.n}</Text>
              </View>
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.text, flex: 1 },
                ]}
              >
                {step.text}
              </Text>
            </View>
          ))}

          <View style={{ height: 20 }} />
          {/* FIX: label → title */}
          <GradientButton
            title="Send Connection Request"
            onPress={() => nav.navigate('SendRequest')}
          />
        </GlassCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '900', marginTop: 6, marginBottom: 14 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  card: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: { width: 12, height: 12, borderRadius: 6 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  emptyCard: { padding: 20 },
  center: { alignItems: 'center' },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: '900' },
});
