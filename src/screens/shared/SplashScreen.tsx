import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { AppGradient } from '../../components/Gradient';
import { GradientText } from '../../components/GradientText';
import { useTheme } from '../../theme/AppThemeProvider';
import { scale } from '../../theme/utils';
import { useAuth } from '../../state/auth/AuthProvider';

export function SplashScreen() {
  const theme = useTheme();
  const { state } = useAuth();
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse, spin]);

  // RootNavigator will swap away after auth boot completes.
  // We still keep a 2s minimum impression.
  const minVisible = useRef(Date.now()).current;
  const isBooting = state.status === 'booting';
  useEffect(() => {
    if (isBooting) return;
    const elapsed = Date.now() - minVisible;
    if (elapsed >= 2000) return;
    // no-op; RootNavigator handles route swap, this is just for minimum time feel.
  }, [isBooting, minVisible]);

  const rotate = useMemo(
    () =>
      spin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    [spin],
  );

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.12],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.white }]}>
      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <Animated.View
            style={[
              styles.ring,
              {
                transform: [{ rotate }, { scale: ringScale }],
                opacity: ringOpacity,
              },
            ]}
          >
            <AppGradient style={styles.ringFill} />
          </Animated.View>

          <View
            style={[styles.logoCore, { backgroundColor: theme.colors.white }]}
          >
            <Ionicons
              name="medical"
              size={scale(30)}
              color={theme.colors.accent}
            />
          </View>
        </View>

        <GradientText style={[styles.title, { color: theme.colors.text }]}>
          VitalSync
        </GradientText>
        <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>
          Intelligent Health Surveillance
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: scale(120),
    height: scale(120),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  ring: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  ringFill: { flex: 1, opacity: 0.9 },
  logoCore: {
    width: scale(74),
    height: scale(74),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});
