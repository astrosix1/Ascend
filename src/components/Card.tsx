import React, { ReactNode, useState } from 'react';
import { Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { BorderRadius, Spacing, Elevation } from '../utils/theme';
import { usePressScale } from '../utils/motion';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  /** Hover/press feedback. Implied when onPress is given. */
  interactive?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export default function Card({ children, style, interactive = false, onPress, accessibilityLabel }: CardProps) {
  const { colors } = useApp();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const { animatedStyle, handlers } = usePressScale();
  const tappable = !!onPress;
  const live = interactive || tappable;

  const body = (
    <Animated.View
      style={[
        styles.card,
        Elevation.low,
        {
          backgroundColor: live && hovered ? colors.surfaceLight : colors.surface,
          borderColor: focused ? colors.accentText : colors.border,
          borderWidth: focused ? 2 : 1,
        },
        live && animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (!live) return body;

  return (
    <Pressable
      onPress={onPress}
      disabled={!tappable}
      accessibilityRole={tappable ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...(tappable ? handlers : {})}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
});

