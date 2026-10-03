import React, { useState } from 'react';
import { Pressable, Animated, Text, StyleSheet } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { BorderRadius, Spacing, Typography, Touch } from '../utils/theme';
import { usePressScale } from '../utils/motion';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Filter / category pill. Selected state is a blue fill with white text. */
export default function Chip({ label, selected = false, onPress }: ChipProps) {
  const { colors } = useApp();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const { animatedStyle, handlers } = usePressScale();

  const bg = selected ? colors.accent : hovered ? colors.surfaceLight : 'transparent';
  const fg = selected ? colors.textOnAccent : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...handlers}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: bg,
            borderColor: focused ? colors.accentText : selected ? colors.accent : colors.border,
            borderWidth: focused ? 2 : 1,
          },
          animatedStyle,
        ]}
      >
        <Text style={[Typography.bodySmall, { color: fg, fontWeight: '600' }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: Touch.minTarget - 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
