import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Chip } from '../../components/Chip';
import { GlassCard } from '../../components/GlassCard';
import { RiskBadge } from '../../components/RiskBadge';
import { Screen } from '../../components/Screen';
import type { Alert as AlertRow } from '../../services/backend/types';
import type { PatientLite } from '../../services/backend/types';
import { alertsService } from '../../services/backend/alertsService';
import { connectionsService } from '../../services/backend/connectionsService';
import { getSocket } from '../../services/realtime/socket';
import { useTheme } from '../../theme/AppThemeProvider';
import { formatTimeAgo } from '../../utils/format';

type SeverityFilter = 'All' | 'Critical' | 'Caution';

function pid(p: PatientLite) {
  return String((p as PatientLite & { id?: string }).id ?? p._id);
}

export function SupervisorAlertsScreen() {
  const theme = useTheme();
  const [patients, setPatients] = useState<PatientLite[]>([]);
  const [alerts, setAlerts] = useState<Array<AlertRow & { patientName?: string }>>([]);
  const [userFilter, setUserFilter] = useState<string | 'all'>('all');
  const [severity, setSeverity] = useState<SeverityFilter>('All');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await connectionsService.myUsers();
    setPatients(list);
    const ids = list.map(pid);
    const merged = await alertsService.listForPatients(ids);
    const nameById = new Map(list.map((u) => [pid(u), u.name ?? 'Patient']));
    setAlerts(
      merged.map((a) => ({
        ...a,
        patientName: nameById.get(String(a.userId)),
      })),
    );
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        // ignore
      }
    })();
  }, [load]);

  const patientIds = useMemo(() => new Set(patients.map(pid)), [patients]);

  useEffect(() => {
    const s = getSocket();
    const onAlert = (a: AlertRow) => {
      const uid = String(a.userId);
      if (!patientIds.has(uid)) return;
      const name = patients.find((p) => pid(p) === uid)?.name;
      setAlerts((prev) => [{ ...a, patientName: name }, ...prev.filter((x) => x._id !== a._id)]);
    };
    s?.on('alert:triggered', onAlert);
    return () => s?.off('alert:triggered', onAlert);
  }, [patientIds, patients]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    let list = alerts;
    if (userFilter !== 'all') list = list.filter((a) => String(a.userId) === userFilter);
    if (severity === 'Critical') list = list.filter((a) => a.riskLevel === 'CRITICAL');
    if (severity === 'Caution') list = list.filter((a) => a.riskLevel === 'WARNING');
    return list;
  }, [alerts, severity, userFilter]);

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Alerts log</Text>

      <Text style={[styles.section, { color: theme.colors.textSecondary }]}>Patient</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.userChips}>
        <Chip label="All Users" selected={userFilter === 'all'} onPress={() => setUserFilter('all')} />
        {patients.map((p) => {
          const id = pid(p);
          return (
            <Chip
              key={id}
              label={p.name ?? 'Patient'}
              selected={userFilter === id}
              onPress={() => setUserFilter(id)}
              style={{ marginBottom: 8 }}
            />
          );
        })}
      </ScrollView>

      <Text style={[styles.section, { color: theme.colors.textSecondary }]}>Severity</Text>
      <View style={styles.chipsRow}>
        {(['All', 'Critical', 'Caution'] as SeverityFilter[]).map((s) => (
          <Chip key={s} label={s} selected={severity === s} onPress={() => setSeverity(s)} />
        ))}
      </View>

      {filtered.length === 0 ? (
        <GlassCard style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={26} color={theme.colors.accent} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No alerts match filters.</Text>
        </GlassCard>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a._id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: 'rgba(37,99,235,0.10)' }]}>
                  <Ionicons name="person" size={18} color={theme.colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.patientName, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.patientName ?? 'Patient'}
                  </Text>
                  <Text style={[styles.msg, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <View style={styles.bottomRow}>
                    <RiskBadge level={item.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING'} />
                    <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
                      {formatTimeAgo(item.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '900', marginTop: 6 },
  section: { marginTop: 14, fontSize: 12, fontWeight: '900', letterSpacing: 0.2 },
  userChips: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  empty: { marginTop: 16, padding: 18, alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 13, fontWeight: '800' },
  card: { marginTop: 12, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientName: { fontSize: 14, fontWeight: '900' },
  msg: { marginTop: 6, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  time: { fontSize: 11, fontWeight: '800' },
});
