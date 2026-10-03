import React, { ReactNode, useEffect, useRef } from 'react';
import { Modal, View, Pressable, Animated, Text, StyleSheet, Platform } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useIsDesktop } from '../utils/responsive';
import { BorderRadius, Spacing, Typography, Motion, Elevation, Touch } from '../utils/theme';
import { resolveDuration, useReducedMotion } from '../utils/motion';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Bottom sheet on mobile, centered panel on desktop. Closes on backdrop tap,
 * the close button and Escape (web). Slides in unless reduced motion is on.
 */
export default function Sheet({ visible, onClose, title, children }: SheetProps) {
  const { colors } = useApp();
  const desktop = useIsDesktop();
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: resolveDuration(Motion.duration.standard, reduced),
      useNativeDriver: true,
    }).start();
  }, [visible, reduced, progress]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [desktop ? 12 : 80, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={[styles.root, { justifyContent: desktop ? 'center' : 'flex-end', alignItems: 'center' }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.72] }) }]} />
        </Pressable>

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.panel,
            Elevation.high,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              maxWidth: desktop ? 520 : undefined,
              width: '100%',
              borderBottomLeftRadius: desktop ? BorderRadius.xl : 0,
              borderBottomRightRadius: desktop ? BorderRadius.xl : 0,
              opacity: progress,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[Typography.heading, { color: colors.text, flex: 1 }]} numberOfLines={1}>{title}</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.close}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 20 }}>✕</Text>
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  panel: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  close: { minWidth: Touch.minTarget, minHeight: Touch.minTarget, alignItems: 'center', justifyContent: 'center' },
});
