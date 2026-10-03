import React from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { Typography, LetterSpacing } from '../utils/theme';
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
  hero: { ...Typography.display },
  h2: { ...Typography.title },
  h3: { ...Typography.heading },
  body: { ...Typography.body },
  bodyBold: { ...Typography.subheading },
  secondary: { ...Typography.bodySmall },
  label: { ...Typography.label, textTransform: 'uppercase', letterSpacing: LetterSpacing.caps },
  caption: { ...Typography.caption },
  micro: { fontSize: 10, lineHeight: 14, fontWeight: '500' },
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
