import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Spacing, BorderRadius, FontSize, FontWeight, LineHeight, Animations } from '../utils/theme';
import { useIsDesktop } from '../utils/responsive';
import StreakBadge from './StreakBadge';

interface HabitCardProps {
  id: string;
  title: string;
  time: string;
  isCompleted: boolean;
  streak: number;
  onPress: () => void;
  onToggleComplete: () => void;
}

export default function HabitCard({
  id,
  title,
  time,
  isCompleted,
  streak,
  onPress,
  onToggleComplete,
}: HabitCardProps) {
  const { colors } = useApp();
  const desktop = useIsDesktop();
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: Animations.fast,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: Animations.fast,
      useNativeDriver: true,
    }).start();
  };

  const accentBarColor = isCompleted ? colors.accent : colors.border;
  const completionButtonBorderColor = isCompleted ? colors.accent : colors.border;
  const completionButtonBgColor = isCompleted ? colors.accent : 'transparent';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderLeftColor: accentBarColor,
            borderLeftWidth: 4,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
          }
        ]}
      >
        {/* Main content */}
        <View style={styles.content}>
          {/* Title and time row */}
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: FontSize.xl,
                  fontWeight: FontWeight.semibold,
                  lineHeight: FontSize.xl * LineHeight.heading,
                }
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.time,
                {
                  color: colors.textTertiary,
                  fontSize: FontSize.sm,
                  fontWeight: FontWeight.regular,
                }
              ]}
            >
              {time}
            </Text>
          </View>

          {/* Streak and status row */}
          <View style={styles.statusRow}>
            {streak > 0 && <StreakBadge count={streak} />}
            {streak === 0 && (
              <Text style={[
                styles.newHabit,
                {
                  color: colors.textSecondary,
                  fontSize: FontSize.sm,
                }
              ]}>
                Starting
              </Text>
            )}
          </View>
        </View>

        {/* Completion button */}
        <TouchableOpacity
          onPress={onToggleComplete}
          style={[
            styles.completionButton,
            {
              borderColor: completionButtonBorderColor,
              borderWidth: 2,
              backgroundColor: completionButtonBgColor,
            }
          ]}
        >
          {isCompleted && (
            <Text style={[styles.checkmark, { color: '#FFFFFF' }]}>✓</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    elevation: 1,
  },
  content: {
    flex: 1,
    marginRight: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
  },
  time: {
    marginLeft: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newHabit: {
    fontWeight: '400',
  },
  completionButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
});
