import React, { useState } from 'react';
import { Pressable, Animated, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { BorderRadius, FontSize, FontSizeDesktop, Spacing, FontWeight, LineHeight, Touch } from '../utils/theme';
import { useIsDesktop } from '../utils/responsive';
import { usePressScale } from '../utils/motion';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  /** Shows a spinner and blocks presses (e.g. while saving). */
  loading?: boolean;
  accessibilityHint?: string;
}

export default function Button({
  title, onPress, variant = 'primary', size = 'medium', style, textStyle,
  disabled, loading, accessibilityHint,
}: ButtonProps) {
  const { colors } = useApp();
  const desktop = useIsDesktop();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const { animatedStyle, handlers } = usePressScale();
  const inactive = !!disabled || !!loading;

  const fill = {
    primary: hovered ? colors.accentDark : colors.accent,
    secondary: hovered ? colors.border : colors.surfaceLight,
    danger: colors.danger,
    ghost: hovered ? colors.accentLight : 'transparent',
  }[variant];

  const textColor = {
    primary: colors.textOnAccent,
    secondary: colors.text,
    danger: colors.textOnDanger,
    ghost: colors.accentText,
  }[variant];

  const sizes = {
    small: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, fontSize: desktop ? FontSizeDesktop.sm : FontSize.sm },
    medium: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, fontSize: desktop ? FontSizeDesktop.md : FontSize.md },
    large: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, fontSize: desktop ? FontSizeDesktop.lg : FontSize.lg },
  }[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...handlers}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: fill,
            paddingVertical: sizes.paddingVertical,
            paddingHorizontal: sizes.paddingHorizontal,
            opacity: disabled ? 0.5 : 1,
            borderWidth: variant === 'ghost' || focused ? 1 : 0,
            borderColor: focused ? colors.accentText : colors.accent,
          },
          focused && { borderWidth: 2 },   // visible keyboard focus ring
          animatedStyle,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Text
            style={[
              styles.text,
              { color: textColor, fontSize: sizes.fontSize, lineHeight: LineHeight.tight * sizes.fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Touch.minTarget,
  },
  text: {
    fontWeight: FontWeight.semibold,
  },
});
