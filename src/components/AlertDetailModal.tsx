import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import type { Alert } from '../services/backend/types';
import { useTheme } from '../theme/AppThemeProvider';
import { formatTimeAgo } from '../utils/format';
import { RiskBadge } from './RiskBadge';

type Props = {
  alert: (Alert & { patientName?: string }) | null;
  visible: boolean;
  onClose: () => void;
};

export function AlertDetailModal({ alert, visible, onClose }: Props) {
  const theme = useTheme();
  if (!alert) return null;

  const snap = alert.vitalsSnapshot;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.colors.card }]}
          onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Alert details
            </Text>
            <Pressable hitSlop={12} onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <RiskBadge
            level={alert.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING'}
          />

          {!!alert.patientName && (
            <Text style={[styles.patient, { color: theme.colors.text }]}>
              {alert.patientName}
            </Text>
          )}

          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {alert.message}
          </Text>

          <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
            {formatTimeAgo(alert.createdAt)} ·{' '}
            {new Date(alert.createdAt).toLocaleString()}
          </Text>

          {snap && (
            <View
              style={[
                styles.vitalsBox,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.bg },
              ]}>
              <Text style={[styles.vitalsTitle, { color: theme.colors.text }]}>
                Vitals at alert
              </Text>
              <Text style={[styles.vitalsLine, { color: theme.colors.textSecondary }]}>
                HR {snap.heartRate ?? '--'} bpm · SpO₂ {snap.spo2 ?? '--'}% · Temp{' '}
                {snap.temperature ?? '--'}°C
              </Text>
              <Text style={[styles.vitalsLine, { color: theme.colors.textSecondary }]}>
                Activity: {snap.activityState ?? '—'}
              </Text>
            </View>
          )}

          <Pressable
            onPress={onClose}
            style={[styles.btn, { backgroundColor: theme.colors.accent }]}>
            <Text style={styles.btnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '900' },
  patient: { marginTop: 12, fontSize: 15, fontWeight: '900' },
  message: { marginTop: 10, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  time: { marginTop: 10, fontSize: 12, fontWeight: '700' },
  vitalsBox: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  vitalsTitle: { fontSize: 12, fontWeight: '900', marginBottom: 8 },
  vitalsLine: { fontSize: 13, fontWeight: '700', lineHeight: 20 },
  btn: {
    marginTop: 18,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
