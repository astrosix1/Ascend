import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { FontSize, FontSizeDesktop, Spacing, FontWeight, LineHeight } from '../utils/theme';
import { useIsDesktop } from '../utils/responsive';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  const { colors } = useApp();
  const desktop = useIsDesktop();

  return (
    <View style={styles.container}>
      <Text style={[
        styles.title,
        { color: colors.text },
        desktop && styles.titleDesktop,
      ]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[
          styles.subtitle,
          { color: colors.textSecondary },
          desktop && styles.subtitleDesktop,
        ]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    lineHeight: LineHeight.tight * FontSize.lg,
  },
  titleDesktop: {
    fontSize: FontSizeDesktop.xl,
    lineHeight: LineHeight.tight * FontSizeDesktop.xl,
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    lineHeight: LineHeight.normal * FontSize.sm,
  },
  subtitleDesktop: {
    fontSize: FontSizeDesktop.sm,
    lineHeight: LineHeight.normal * FontSizeDesktop.sm,
  },
});
