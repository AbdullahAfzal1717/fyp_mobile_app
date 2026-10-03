import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Constants from 'expo-constants';

import { Screen } from '../../components/Screen';
import { AppGradient } from '../../components/Gradient';
import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { TextField } from '../../components/TextField';
import { authService } from '../../services/backend/authService';
import { useAuth } from '../../state/auth/AuthProvider';
import { useTheme } from '../../theme/AppThemeProvider';
import { getApiErrorMessage } from '../../services/apiClient';

export function SupervisorProfileScreen() {
  const theme = useTheme();
  const { state, logout, updateProfile, uploadAvatar } = useAuth();
  const user = state.user!;

  const [code, setCode] = useState<string | null>(user.supervisorCode ?? null);
  const [codeCopied, setCodeCopied] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);

  // ── Fetch latest supervisor code on mount ──────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await authService.getSupervisorCode();
        if (alive) setCode(c);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ── Copy code ──────────────────────────────────────────────────────────────
  async function handleCopy() {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2500);
    } catch {
      Alert.alert('Your Code', code);
    }
  }

  // ── Share code ─────────────────────────────────────────────────────────────
  async function handleShare() {
    if (!code) return;
    await Share.share({
      message: `Connect to me on VitalSync. My supervisor code is: ${code}`,
    });
  }

  // ── Avatar upload ──────────────────────────────────────────────────────────
  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Allow VitalSync to access your photos in Settings.',
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
        'Allow VitalSync to access your camera in Settings.',
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

  // ── Edit profile ───────────────────────────────────────────────────────────
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
            SUPERVISOR
          </Text>
        </View>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: 4 },
          ]}
        >
          {user.email}
        </Text>
      </View>

      {/* ── Supervisor Code Card ── */}
      <AppGradient style={[styles.codeCard, theme.shadows.softFloat]}>
        <Text style={styles.codeLabel}>YOUR SUPERVISOR CODE</Text>
        <Text style={styles.codeValue}>{code ?? '------'}</Text>
        <Text style={styles.codeHint}>
          Share this code with your patients so they can connect to you.
        </Text>
        <View style={styles.codeActions}>
          <TouchableOpacity
            onPress={handleCopy}
            style={[
              styles.codeBtn,
              { backgroundColor: 'rgba(255,255,255,0.18)' },
            ]}
          >
            <Ionicons
              name={codeCopied ? 'checkmark-outline' : 'copy-outline'}
              size={16}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.codeBtnText}>
              {codeCopied ? 'Copied!' : 'Copy'}
            </Text>
          </TouchableOpacity>
          <View style={{ width: 10 }} />
          <TouchableOpacity
            onPress={handleShare}
            style={[
              styles.codeBtn,
              { backgroundColor: 'rgba(255,255,255,0.18)' },
            ]}
          >
            <Ionicons
              name="share-outline"
              size={16}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.codeBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </AppGradient>

      {/* ── Account Settings ── */}
      <Text
        style={[
          theme.typography.h2,
          { color: theme.colors.text, marginTop: 24, marginBottom: 12 },
        ]}
      >
        Account
      </Text>
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        {[
          { icon: 'person-outline', label: 'Edit Profile', onPress: openEdit },
          { icon: 'mail-outline', label: 'Email', value: user.email },
          {
            icon: 'information-circle-outline',
            label: 'Version',
            value: Constants.expoConfig?.version ?? '1.0.0',
          },
        ].map((row, i, arr) => (
          <TouchableOpacity
            key={row.label}
            style={[
              styles.settingsRow,
              {
                borderBottomColor: theme.colors.border,
                borderBottomWidth:
                  i < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
              },
            ]}
            onPress={row.onPress}
            disabled={!row.onPress}
          >
            <View
              style={[
                styles.settingsIconWrap,
                { backgroundColor: theme.colors.accent + '15' },
              ]}
            >
              <Ionicons name={row.icon} size={18} color={theme.colors.accent} />
            </View>
            <View style={styles.settingsContent}>
              <Text
                style={[theme.typography.body, { color: theme.colors.text }]}
              >
                {row.label}
              </Text>
              {!!row.value && (
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {row.value}
                </Text>
              )}
            </View>
            {!!row.onPress && (
              <Ionicons
                name="chevron-forward-outline"
                size={16}
                color={theme.colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        ))}
      </GlassCard>

      {/* ── Sign Out ── */}
      <GlassCard
        style={{
          padding: 0,
          overflow: 'hidden',
          marginTop: 20,
          marginBottom: 32,
        }}
      >
        <TouchableOpacity
          style={[styles.settingsRow, { borderBottomWidth: 0 }]}
          onPress={handleLogout}
        >
          <View
            style={[
              styles.settingsIconWrap,
              { backgroundColor: theme.colors.critical + '15' },
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color={theme.colors.critical}
            />
          </View>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.critical, flex: 1 },
            ]}
          >
            Sign Out
          </Text>
        </TouchableOpacity>
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
            {/* FIX: leftIcon as string, not JSX element */}
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
  avatarSection: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
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
  codeCard: { borderRadius: 20, padding: 18 },
  codeLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  codeValue: {
    color: '#fff',
    marginTop: 10,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
  },
  codeHint: {
    color: 'rgba(255,255,255,0.80)',
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  codeActions: { flexDirection: 'row', marginTop: 16 },
  codeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  codeBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
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
