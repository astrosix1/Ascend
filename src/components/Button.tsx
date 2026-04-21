import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { BorderRadius, FontSize, FontSizeDesktop, Spacing, FontWeight, LineHeight } from '../utils/theme';
import { useIsDesktop } from '../utils/responsive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function Button({ title, onPress, variant = 'primary', size = 'medium', style, textStyle, disabled }: ButtonProps) {
  const { colors } = useApp();
  const desktop = useIsDesktop();
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const bgColors = {
    primary: colors.accent,
    secondary: colors.surfaceLight,
    danger: colors.danger,
    ghost: 'transparent',
  };

  const bgColorsHover = {
    primary: '#F59C12',
    secondary: colors.border,
    danger: '#D32F2F',
    ghost: 'transparent',
  };

  const textColors = {
    primary: '#1A1A1A',
    secondary: colors.text,
    danger: '#FFFFFF',
    ghost: colors.accent,
  };

  const sizes = {
    small: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      fontSize: desktop ? FontSizeDesktop.sm : FontSize.sm,
    },
    medium: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      fontSize: desktop ? FontSizeDesktop.md : FontSize.md,
    },
    large: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      fontSize: desktop ? FontSizeDesktop.lg : FontSize.lg,
    },
  };

  const getBackgroundColor = () => {
    if (disabled) return bgColors[variant];
    if (isPressed) {
      return variant === 'ghost' ? colors.accentLight : bgColorsHover[variant];
    }
    if (isFocused && desktop) {
      return variant === 'ghost' ? colors.accentLight : bgColorsHover[variant];
    }
    return bgColors[variant];
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: sizes[size].paddingVertical,
          paddingHorizontal: sizes[size].paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: isFocused && desktop ? colors.accent : colors.accent,
          borderStyle: isFocused && desktop ? 'solid' : 'solid',
        },
        isFocused && desktop && styles.focused,
        style,
      ]}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.text,
        { color: textColors[variant], fontSize: sizes[size].fontSize, lineHeight: LineHeight.tight * sizes[size].fontSize },
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: FontWeight.semibold,
  },
  focused: {
    borderWidth: 2,
  },
});
