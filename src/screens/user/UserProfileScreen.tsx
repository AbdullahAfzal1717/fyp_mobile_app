import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';

import { GradientButton } from '../../components/GradientButton';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { GlassCard } from '../../components/GlassCard';
import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import type { UserStackParamList } from '../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function UserProfileScreen() {
  const theme = useTheme();
  const { state, logout, updateProfile } = useAuth();
  const user = state.user!;
  const navigation = useNavigation<NativeStackNavigationProp<UserStackParamList>>();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim().toLowerCase() });
      setEditOpen(false);
    } catch {
      Alert.alert('Update failed', 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  function row(icon: string, label: string, onPress: () => void) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.row, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }, theme.shadows.softCard]}>
        <View style={[styles.rowIcon, { backgroundColor: 'rgba(37,99,235,0.08)' }]}>
          <Ionicons name={icon} size={18} color={theme.colors.accent} />
        </View>
        <Text style={[styles.rowLabel, { color: theme.colors.text }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
      </Pressable>
    );
  }

  return (
    <Screen scroll>
      <GlassCard style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: 'rgba(37,99,235,0.10)' }]}>
          <Ionicons name="person" size={28} color={theme.colors.accent} />
        </View>
        <Text style={[styles.userName, { color: theme.colors.text }]}>{user.name}</Text>
        <View style={[styles.roleBadge, { borderColor: theme.colors.border }]}>
          <Text style={[styles.roleText, { color: theme.colors.accent }]}>User</Text>
        </View>
      </GlassCard>

      <Text style={[styles.section, { color: theme.colors.textSecondary }]}>Settings</Text>
      {row('create-outline', 'Edit Profile', () => {
        setName(user.name);
        setEmail(user.email);
        setEditOpen(true);
      })}
      {row('notifications-outline', 'Notification Preferences', () =>
        Alert.alert('Notifications', 'Preference toggles can be wired to backend later.'),
      )}
      {row('watch-outline', 'Watch Settings', () => navigation.navigate('WatchConnect'))}
      {row('help-circle-outline', 'Help', () => Alert.alert('Help', 'Contact your supervisor or IT support.'))}
      {row('log-out-outline', 'Logout', () => {
        Alert.alert('Logout', 'Sign out of Command-X?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: () => logout() },
        ]);
      })}

      <Text style={[styles.version, { color: theme.colors.textSecondary }]}>Command-X v{version}</Text>

      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit profile</Text>
            <TextField label="Name" value={name} onChangeText={setName} leftIcon="person-outline" />
            <View style={{ height: 12 }} />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon="mail-outline"
            />
            <View style={{ height: 16 }} />
            <GradientButton title="Save" loading={saving} onPress={saveProfile} />
            <View style={{ height: 10 }} />
            <Pressable onPress={() => setEditOpen(false)}>
              <Text style={[styles.cancel, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 20 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { marginTop: 12, fontSize: 18, fontWeight: '900' },
  roleBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleText: { fontSize: 12, fontWeight: '900' },
  section: { marginTop: 18, marginBottom: 10, fontSize: 12, fontWeight: '900', letterSpacing: 0.2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '800' },
  version: { textAlign: 'center', marginTop: 18, fontSize: 12, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: { padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  cancel: { textAlign: 'center', fontSize: 14, fontWeight: '800' },
});
