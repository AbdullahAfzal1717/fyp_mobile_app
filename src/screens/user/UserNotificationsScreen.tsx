import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

import { Screen } from '../../components/Screen';
import { Chip } from '../../components/Chip';
import { GlassCard } from '../../components/GlassCard';
import { AlertDetailModal } from '../../components/AlertDetailModal';
import { alertsService } from '../../services/backend/alertsService';
import type { Alert as AlertType } from '../../services/backend/types';
import { getApiErrorMessage } from '../../services/apiClient';
import { getSocket } from '../../services/realtime/socket';
import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import { formatTimeAgo } from '../../utils/format';

export function UserNotificationsScreen() {
  const theme = useTheme();
  const { state } = useAuth();
  const user = state.user!;

  const [filter, setFilter] = useState<'All' | 'Critical' | 'Caution'>('All');
  const [items, setItems] = useState<AlertType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AlertType | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await alertsService.listByUser(user.id);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItems([]);
      setError(getApiErrorMessage(e));
    }
  }, [user.id]);

  useFocusEffect(
    useCallback(() => {
      load();
      const s = getSocket();
      const onAlert = (a: AlertType) => {
        if (String(a.userId) !== String(user.id)) return;
        setItems(prev => [a, ...prev.filter(x => x._id !== a._id)]);
      };
      s?.on('alert:triggered', onAlert);
      return () => s?.off('alert:triggered', onAlert);
    }, [load, user.id]),
  );

  const filtered = useMemo(() => {
    if (filter === 'All') return items;
    if (filter === 'Critical') {
      return items.filter(a => a.riskLevel === 'CRITICAL');
    }
    return items.filter(a => a.riskLevel === 'WARNING');
  }, [filter, items]);

  async function openAlert(item: AlertType) {
    setSelected(item);
    if (item.isRead) return;
    try {
      const updated = await alertsService.markRead(item._id);
      setItems(prev => prev.map(a => (a._id === updated._id ? updated : a)));
      setSelected(updated);
    } catch {
      // still show detail even if mark-read fails
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Notifications
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: 12,
          fontWeight: '700',
          marginTop: 4,
        }}>
        Signed in as {user.email} · {filtered.length} shown
        {items.length !== filtered.length ? ` (${items.length} total)` : ''}
      </Text>

      <View style={styles.chipsRow}>
        <Chip
          label="All"
          selected={filter === 'All'}
          onPress={() => setFilter('All')}
        />
        <Chip
          label="Critical"
          selected={filter === 'Critical'}
          onPress={() => setFilter('Critical')}
        />
        <Chip
          label="Caution"
          selected={filter === 'Caution'}
          onPress={() => setFilter('Caution')}
        />
      </View>

      {!!error && (
        <GlassCard style={styles.empty}>
          <Text style={{ color: theme.colors.critical, fontWeight: '800' }}>
            {error}
          </Text>
        </GlassCard>
      )}

      {filtered.length === 0 ? (
        <GlassCard style={styles.empty}>
          <Ionicons
            name="notifications-outline"
            size={26}
            color={theme.colors.accent}
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No alerts
          </Text>
          <Text
            style={[styles.emptySub, { color: theme.colors.textSecondary }]}>
            Tap an alert later to open full details. Alerts appear for WARNING /
            CRITICAL risk.
          </Text>
        </GlassCard>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={a => String(a._id)}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable onPress={() => openAlert(item)}>
              <View
                style={[
                  styles.alertCard,
                  {
                    borderColor: theme.colors.border,
                    borderLeftColor:
                      item.riskLevel === 'CRITICAL'
                        ? theme.colors.critical
                        : theme.colors.caution,
                    backgroundColor: theme.colors.card,
                  },
                ]}>
                <View style={styles.alertRow}>
                  <Ionicons
                    name={
                      item.riskLevel === 'CRITICAL'
                        ? 'warning'
                        : 'alert-circle'
                    }
                    size={18}
                    color={
                      item.riskLevel === 'CRITICAL'
                        ? theme.colors.critical
                        : theme.colors.caution
                    }
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.alertTitle, { color: theme.colors.text }]}>
                      {item.riskLevel === 'CRITICAL'
                        ? 'Critical alert'
                        : 'Caution alert'}
                    </Text>
                    <Text
                      style={[
                        styles.alertDesc,
                        { color: theme.colors.textSecondary },
                      ]}
                      numberOfLines={2}>
                      {item.message}
                    </Text>
                    <Text
                      style={[
                        styles.alertTime,
                        { color: theme.colors.textSecondary },
                      ]}>
                      {formatTimeAgo(item.createdAt)} · Tap for details
                    </Text>
                  </View>
                  {!item.isRead ? (
                    <View
                      style={[
                        styles.unreadDot,
                        { backgroundColor: theme.colors.accent },
                      ]}
                    />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      <AlertDetailModal
        alert={selected}
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '900', marginTop: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginBottom: 8 },
  empty: { marginTop: 14, padding: 18, alignItems: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '900' },
  emptySub: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  alertCard: {
    borderWidth: 1,
    borderLeftWidth: 5,
    borderRadius: 20,
    padding: 14,
    marginTop: 12,
  },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start' },
  alertTitle: { fontSize: 13, fontWeight: '900' },
  alertDesc: { marginTop: 6, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  alertTime: { marginTop: 8, fontSize: 11, fontWeight: '800' },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginLeft: 10,
    marginTop: 3,
  },
});
