import React, { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import { getApiErrorMessage } from '../../services/apiClient';
import { Screen } from '../../components/Screen';
import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { TextField } from '../../components/TextField';
import { AppGradient } from '../../components/Gradient';

export function UserProfileScreen() {
  const theme = useTheme();
  const { state, logout, updateProfile, uploadAvatar } = useAuth();
  const user = state.user!;

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);

  // ── Avatar Upload ──────────────────────────────────────────────────────────
  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow VitalSync to access your photos in Settings.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    setAvatarLoading(true);
    try {
      await uploadAvatar(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Upload Failed', getApiErrorMessage(e));
    } finally {
      setAvatarLoading(false);
    }
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow VitalSync to access your camera in Settings.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    setAvatarLoading(true);
    try {
      await uploadAvatar(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Upload Failed', getApiErrorMessage(e));
    } finally {
      setAvatarLoading(false);
    }
  }

  function handleAvatarPress() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose from Gallery', 'Take Photo'],
          cancelButtonIndex: 0,
        },
        idx => {
          if (idx === 1) pickFromGallery();
          if (idx === 2) pickFromCamera();
        },
      );
    } else {
      Alert.alert('Change Profile Photo', 'Choose a source', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Gallery', onPress: pickFromGallery },
        { text: 'Camera', onPress: pickFromCamera },
      ]);
    }
  }

  // ── Edit Profile ───────────────────────────────────────────────────────────
  function openEdit() {
    setEditName(user.name);
    setEditEmail(user.email);
    setSaveError('');
    setEditVisible(true);
  }

  async function handleSave() {
    if (!editName.trim()) {
      setSaveError('Name cannot be empty');
      return;
    }
    if (!editEmail.trim()) {
      setSaveError('Email cannot be empty');
      return;
    }
    setSaveError('');
    setSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
      });
      setEditVisible(false);
    } catch (e) {
      setSaveError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }

  // ── Settings Row ───────────────────────────────────────────────────────────
  function SettingsRow({
    icon,
    label,
    value,
    onPress,
    danger,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
  }) {
    return (
      <TouchableOpacity
        style={[styles.settingsRow, { borderBottomColor: theme.colors.border }]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.65}
      >
        <View
          style={[
            styles.settingsIconWrap,
            {
              backgroundColor:
                (danger ? theme.colors.critical : theme.colors.accent) + '15',
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={danger ? theme.colors.critical : theme.colors.accent}
          />
        </View>
        <View style={styles.settingsContent}>
          <Text
            style={[
              theme.typography.body,
              { color: danger ? theme.colors.critical : theme.colors.text },
            ]}
          >
            {label}
          </Text>
          {!!value && (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              {value}
            </Text>
          )}
        </View>
        {!!onPress && !danger && (
          <Ionicons
            name="chevron-forward-outline"
            size={16}
            color={theme.colors.textSecondary}
          />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <Screen scroll>
      {/* ── Avatar ── */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          onPress={handleAvatarPress}
          activeOpacity={0.8}
          disabled={avatarLoading}
        >
          <View style={styles.avatarWrap}>
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <AppGradient style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {user.name.slice(0, 2).toUpperCase()}
                </Text>
              </AppGradient>
            )}
            <View
              style={[
                styles.cameraOverlay,
                {
                  backgroundColor: avatarLoading
                    ? theme.colors.border
                    : theme.colors.accent,
                },
              ]}
            >
              <Ionicons
                name={avatarLoading ? 'sync-outline' : 'camera-outline'}
                size={12}
                color="#fff"
              />
            </View>
          </View>
        </TouchableOpacity>
        <Text
          style={[
            theme.typography.h1,
            { color: theme.colors.text, marginTop: 12 },
          ]}
        >
          {user.name}
        </Text>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: theme.colors.accent + '15' },
          ]}
        >
          <Text
            style={[
              theme.typography.small,
              { color: theme.colors.accent, fontWeight: '700' },
            ]}
          >
            {user.role}
          </Text>
        </View>
      </View>

      {/* ── Account Settings ── */}
      <Text
        style={[
          theme.typography.h2,
          { color: theme.colors.text, marginBottom: 12 },
        ]}
      >
        Account
      </Text>
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <SettingsRow
          icon="person-outline"
          label="Edit Profile"
          onPress={openEdit}
        />
        <SettingsRow icon="mail-outline" label="Email" value={user.email} />
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Change Password"
          onPress={() =>
            Alert.alert(
              'Change Password',
              'Use Forgot Password on the login screen to reset your password.',
            )
          }
        />
      </GlassCard>

      <Text
        style={[
          theme.typography.h2,
          { color: theme.colors.text, marginTop: 24, marginBottom: 12 },
        ]}
      >
        App
      </Text>
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <SettingsRow
          icon="information-circle-outline"
          label="Version"
          value={Constants.expoConfig?.version ?? '1.0.0'}
        />
        <SettingsRow
          icon="document-text-outline"
          label="Privacy Policy"
          onPress={() => {}}
        />
        <SettingsRow
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() => {}}
        />
      </GlassCard>

      <GlassCard
        style={{
          padding: 0,
          overflow: 'hidden',
          marginTop: 24,
          marginBottom: 32,
        }}
      >
        <SettingsRow
          icon="log-out-outline"
          label="Sign Out"
          onPress={handleLogout}
          danger
        />
      </GlassCard>

      {/* ── Edit Modal ── */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditVisible(false)}
      >
        <View
          style={[styles.modalContainer, { backgroundColor: theme.colors.bg }]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
              Edit Profile
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text
                style={[
                  theme.typography.body,
                  {
                    color: saving
                      ? theme.colors.textSecondary
                      : theme.colors.accent,
                    fontWeight: '700',
                  },
                ]}
              >
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {/* FIX: leftIcon as string, not JSX */}
            <TextField
              label="Full Name"
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              leftIcon="person-outline"
              autoCapitalize="words"
            />
            <TextField
              label="Email"
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="your@email.com"
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!!saveError && (
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
                  {saveError}
                </Text>
              </View>
            )}
            {/* FIX: label → title */}
            <GradientButton
              title="Save Changes"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', marginBottom: 32, marginTop: 8 },
  avatarWrap: { position: 'relative' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  settingsIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsContent: { flex: 1 },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalBody: { padding: 20, gap: 4 },
  errorBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 8 },
});
