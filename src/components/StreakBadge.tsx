import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../utils/theme';

interface StreakBadgeProps {
  count: number;
  showEmoji?: boolean;
}

export default function StreakBadge({ count, showEmoji = true }: StreakBadgeProps) {
  const { colors } = useApp();

  if (count <= 0) {
    return null;
  }

  const isGold = count > 0;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.warning,
          borderRadius: BorderRadius.md,
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs,
        }
      ]}
    >
      <Text style={[
        styles.badgeText,
        {
          color: '#FFFFFF',
          fontWeight: FontWeight.medium,
          fontSize: FontSize.label,
        }
      ]}>
        {count}-day {showEmoji ? '🔥' : 'streak'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    textAlign: 'center',
  },
});
