import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Spacing, FontSize, BorderRadius, FontWeight, LineHeight } from '../utils/theme';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}

export default function Toast({ message, onDismiss }: ToastProps) {
  const { colors } = useApp();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onDismiss(message.id);
      });
    }, message.duration || 3000);

    return () => clearTimeout(timer);
  }, [message, fadeAnim, onDismiss]);

  const typeConfig = {
    success: { bg: colors.success, icon: '✓', opacity: 0.2 },
    error: { bg: colors.danger, icon: '✕', opacity: 0.2 },
    warning: { bg: colors.warning, icon: '⚠️', opacity: 0.2 },
    info: { bg: colors.accent, icon: 'ℹ️', opacity: 0.2 },
  };

  const config = typeConfig[message.type];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[
        styles.toast,
        {
          backgroundColor: colors.surface,
          borderLeftColor: config.bg,
          borderLeftWidth: 4,
        },
      ]}>
        <Text style={[styles.icon, { fontSize: 24, color: config.bg }]}>{config.icon}</Text>
        <Text style={[
          styles.message,
          { color: colors.text, lineHeight: LineHeight.normal * FontSize.sm },
        ]}>
          {message.message}
        </Text>
        <TouchableOpacity
          onPress={() => onDismiss(message.id)}
          style={styles.closeButton}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 18 }}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  icon: {
    marginRight: Spacing.md,
  },
  message: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  closeButton: {
    marginLeft: Spacing.md,
    padding: Spacing.xs,
  },
});
