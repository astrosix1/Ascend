import React from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { FontSize, FontWeight, LineHeight, LetterSpacing } from '../utils/theme';
import { useApp } from '../contexts/AppContext';

/**
 * AppText — typed typography wrapper enforcing the app's theme scale.
 *
 * Variants map to the theme's FontSize / FontWeight / LineHeight constants so
 * hardcoded numbers never appear in screen code.
 *
 * Usage:
 *   <AppText variant="h3">Section heading</AppText>
 *   <AppText variant="label" color={colors.accent}>STREAK</AppText>
 *   <AppText variant="caption">12 Jun 2026</AppText>
 */

export type TextVariant =
  | 'hero'       // 32px, weight 800, tight tracking  — screen titles
  | 'h2'         // 24px, weight 800, tight tracking  — card headings
  | 'h3'         // 20px, weight 700                  — sub-section titles
  | 'body'       // 16px, weight 400, body line-height — standard copy
  | 'bodyBold'   // 16px, weight 700                  — emphasised body
  | 'secondary'  // 14px, weight 400                  — supporting copy
  | 'label'      // 12px, weight 700, UPPERCASE caps tracking — pill/chip labels
  | 'caption'    // 11px, weight 400                  — timestamps, hints
  | 'micro';     // 10px, weight 600                  — badge counts, tiny labels

const variantStyles: Record<TextVariant, TextStyle> = {
  hero: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
    letterSpacing: LetterSpacing.heading,
    lineHeight: FontSize.hero * LineHeight.tight,
  },
  h2: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: LetterSpacing.heading,
    lineHeight: FontSize.xxl * LineHeight.heading,
  },
  h3: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xl * LineHeight.heading,
  },
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.md * LineHeight.body,
  },
  bodyBold: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.md * LineHeight.body,
  },
  secondary: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  label: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.caps,
    lineHeight: FontSize.label * LineHeight.normal,
  },
  caption: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.caption * LineHeight.normal,
  },
  micro: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xs * LineHeight.normal,
  },
};

interface AppTextProps extends TextProps {
  /** Typography variant — defaults to 'body' */
  variant?: TextVariant;
  /** Override text color (defaults to colors.text from theme) */
  color?: string;
  style?: TextStyle | TextStyle[];
}

export default function AppText({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { colors } = useApp();
  return (
    <Text
      style={[
        variantStyles[variant],
        { color: color ?? colors.text },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
