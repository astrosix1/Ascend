import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { DESKTOP_PADDING, DESKTOP_MAX_WIDTH } from '../utils/responsive';
import { Spacing } from '../utils/theme';

interface DesktopLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  maxWidth?: number;
}

export default function DesktopLayout({
  children,
  style,
  padding = DESKTOP_PADDING,
  maxWidth = DESKTOP_MAX_WIDTH,
}: DesktopLayoutProps) {
  const { colors } = useApp();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: padding,
      backgroundColor: colors.background,
    },
    contentWrapper: {
      maxWidth: maxWidth,
      alignSelf: 'center',
      width: '100%',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.contentWrapper}>
        {children}
      </View>
    </View>
  );
}
