import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Spacing, Typography } from '../utils/theme';
import Button from './Button';

interface EmptyStateProps {
  /** A single emoji or glyph. Decorative: hidden from screen readers. */
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** A calm, useful empty screen: say what this is and give one clear next step. */
export default function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useApp();
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {icon ? (
        <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">{icon}</Text>
      ) : null}
      <Text style={[Typography.heading, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      {message ? (
        <Text style={[Typography.body, styles.message, { color: colors.textSecondary }]}>{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: Spacing.lg }}>
          <Button title={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  icon: { fontSize: 40, marginBottom: Spacing.md },
  message: { textAlign: 'center', marginTop: Spacing.sm, maxWidth: 360 },
});
