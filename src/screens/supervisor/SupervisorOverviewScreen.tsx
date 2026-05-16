import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { Chip } from '../../components/Chip';
import { GlassCard } from '../../components/GlassCard';
import { RiskBadge } from '../../components/RiskBadge';
import { Screen } from '../../components/Screen';
import { connectionsService } from '../../services/backend/connectionsService';
import type { PatientLite, Vital } from '../../services/backend/types';
import { vitalsService } from '../../services/backend/vitalsService';
import { getSocket } from '../../services/realtime/socket';
import { useTheme } from '../../theme/AppThemeProvider';

type Filter = 'All' | 'At Risk' | 'Active' | 'Offline';

function patientId(p: PatientLite) {
  return String((p as PatientLite & { id?: string }).id ?? p._id);
}

export function SupervisorOverviewScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const goDetail = (userId: string, patientName: string) => {
    const params = { userId, patientName };
    const tabParent = navigation.getParent();
    const stackNav = tabParent?.getParent?.() ?? tabParent;
    if (stackNav) stackNav.navigate('UserDetail' as never, params as never);
    else navigation.navigate('UserDetail' as never, params as never);
  };

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [patients, setPatients] = useState<PatientLite[]>([]);
  const [vitalsByUser, setVitalsByUser] = useState<Record<string, Vital | null>>({});
  const [refreshing, setRefreshing] = useState(false);
  const pulse = useState(() => new Animated.Value(1))[0];

  const load = useCallback(async () => {
    const list = await connectionsService.myUsers();
    setPatients(list);
    const entries = await Promise.all(
      list.map(async (u) => {
        const id = patientId(u);
        const v = await vitalsService.getLiveOrNull(id);
        return [id, v] as const;
      }),
    );
    setVitalsByUser(Object.fromEntries(entries));
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

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const patientIds = useMemo(() => new Set(patients.map(patientId)), [patients]);

  useEffect(() => {
    const s = getSocket();
    const onVitals = (payload: { userId: string; vital: Vital }) => {
      const uid = String(payload.userId);
      if (!patientIds.has(uid)) return;
      setVitalsByUser((prev) => ({ ...prev, [uid]: payload.vital }));
    };
    s?.on('vitals:update', onVitals);
    return () => {
      s?.off('vitals:update', onVitals);
    };
  }, [patientIds]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = patients;
    if (q) {
      list = list.filter((p) => {
        const name = (p.name ?? '').toLowerCase();
        const email = (p.email ?? '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    const STALE_MS = 15 * 60 * 1000;
    const ACTIVE_MS = 10 * 60 * 1000;
    const now = Date.now();

    return list.filter((p) => {
      const id = patientId(p);
      const v = vitalsByUser[id];
      const ts = v?.timestamp ? new Date(v.timestamp).getTime() : 0;
      const stale = !v || now - ts > STALE_MS;
      const active = v && now - ts <= ACTIVE_MS;
      const atRisk = v && (v.riskLevel === 'WARNING' || v.riskLevel === 'CRITICAL');

      if (filter === 'All') return true;
      if (filter === 'At Risk') return Boolean(atRisk);
      if (filter === 'Active') return Boolean(active);
      return stale;
    });
  }, [filter, patients, query, vitalsByUser]);

  const totalCount = patients.length;

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>My Patients</Text>
        <View style={styles.headerRight}>
          <View style={[styles.countBadge, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
            <Text style={[styles.countText, { color: theme.colors.accent }]}>{totalCount}</Text>
          </View>
          <Pressable hitSlop={12} onPress={() => setSearchOpen((o) => !o)} style={styles.iconBtn}>
            <Ionicons name="search" size={22} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>

      {searchOpen ? (
        <View style={[styles.searchWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
          <Ionicons name="search" size={18} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search by name or email"
            placeholderTextColor={theme.colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: theme.colors.text }]}
          />
        </View>
      ) : null}

      <View style={[styles.chipsRow, { flexWrap: 'wrap' }]}>
        {(['All', 'At Risk', 'Active', 'Offline'] as Filter[]).map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => patientId(item)}
        scrollEnabled={false}
        ListEmptyComponent={
          <GlassCard style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No patients match this filter.
            </Text>
          </GlassCard>
        }
        renderItem={({ item }) => {
          const id = patientId(item);
          const v = vitalsByUser[id];
          const criticalGlow = v?.riskLevel === 'CRITICAL';

          return (
            <Pressable onPress={() => goDetail(id, item.name ?? 'Patient')}>
              <GlassCard
                style={[
                  styles.card,
                  criticalGlow && {
                    shadowColor: theme.colors.critical,
                    shadowOpacity: 0.22,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 8 },
                  },
                ]}>
                <View style={styles.row}>
                  <View style={styles.avatarCol}>
                    <View style={[styles.avatar, { backgroundColor: 'rgba(37,99,235,0.10)' }]}>
                      <Ionicons name="person" size={20} color={theme.colors.accent} />
                    </View>
                    <View style={[styles.onlineDot, { backgroundColor: v ? theme.colors.safe : theme.colors.textSecondary }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.liveRow}>
                      <Animated.View style={{ transform: [{ scale: pulse }] }}>
                        <Ionicons name="heart" size={14} color={theme.colors.critical} style={{ marginRight: 6 }} />
                      </Animated.View>
                      <Text style={[styles.hr, { color: theme.colors.textSecondary }]}>
                        {v?.heartRate != null ? `${Math.round(v.heartRate)} bpm` : '—'}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      {v ? (
                        <View style={{ marginRight: 8 }}>
                          <RiskBadge level={v.riskLevel} />
                        </View>
                      ) : null}
                      <View style={[styles.actChip, { borderColor: theme.colors.border }]}>
                        <Text style={[styles.actText, { color: theme.colors.textSecondary }]}>
                          {v?.activityState ?? '—'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </View>
              </GlassCard>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  title: { fontSize: 22, fontWeight: '900' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  countBadge: {
    marginRight: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  countText: { fontSize: 12, fontWeight: '900' },
  iconBtn: { padding: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', marginTop: 12 },
  card: { marginTop: 12, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarCol: { marginRight: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: { fontSize: 15, fontWeight: '900' },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  hr: { fontSize: 13, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  actChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 4,
  },
  actText: { fontSize: 11, fontWeight: '800' },
  empty: { marginTop: 20, padding: 18 },
  emptyText: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
});
