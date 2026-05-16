import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Screen } from '../../components/Screen';
import { GlassCard } from '../../components/GlassCard';
import { connectionsService } from '../../services/backend/connectionsService';
import { getApiErrorMessage } from '../../services/apiClient';
import { useTheme } from '../../theme/AppThemeProvider';

export function SupervisorRequestsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<Array<any>>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const pending = await connectionsService.pendingForSupervisor();
    setItems(pending);
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        // ignore
      }
    })();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function accept(id: string) {
    try {
      await connectionsService.accept(id);
      await load();
    } catch (e) {
      Alert.alert('Failed', getApiErrorMessage(e));
    }
  }

  async function reject(id: string) {
    try {
      await connectionsService.reject(id);
      await load();
    } catch (e) {
      Alert.alert('Failed', getApiErrorMessage(e));
    }
  }

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Requests</Text>
        <View style={[styles.badge, { backgroundColor: 'rgba(37,99,235,0.12)', borderColor: 'rgba(37,99,235,0.25)' }]}>
          <Text style={[styles.badgeText, { color: theme.colors.accent }]}>{items.length}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <GlassCard style={styles.empty}>
          <Ionicons name="mail-outline" size={26} color={theme.colors.accent} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No pending requests</Text>
          <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>New connection requests will appear here.</Text>
        </GlassCard>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x._id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: 'rgba(37,99,235,0.10)' }]}>
                  <Ionicons name="person" size={20} color={theme.colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.colors.text }]}>{item.userId?.name ?? 'User'}</Text>
                  <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>Wants you as supervisor</Text>
                </View>
              </View>

              <View style={{ height: 12 }} />
              <View style={styles.actions}>
                <Pressable
                  onPress={() => reject(item._id)}
                  style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.25)' }]}>
                  <Text style={[styles.actionText, { color: theme.colors.critical }]}>Reject</Text>
                </Pressable>
                <View style={{ width: 12 }} />
                <Pressable
                  onPress={() => accept(item._id)}
                  style={[styles.actionBtn, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.25)' }]}>
                  <Text style={[styles.actionText, { color: theme.colors.safe }]}>Accept</Text>
                </Pressable>
              </View>
            </GlassCard>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  title: { fontSize: 20, fontWeight: '900' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '900' },
  empty: { marginTop: 14, padding: 18, alignItems: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '900' },
  emptySub: { marginTop: 8, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  card: { marginTop: 12, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { fontSize: 14, fontWeight: '900' },
  sub: { marginTop: 6, fontSize: 12, fontWeight: '800' },
  actions: { flexDirection: 'row' },
  actionBtn: { flex: 1, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 13, fontWeight: '900' },
});

