import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../contexts/AppContext';
import { Spacing, FontSize, FontSizeDesktop, BorderRadius, FontWeight, LineHeight } from '../utils/theme';
import { useIsDesktop } from '../utils/responsive';

interface TopHeaderProps {
  onToggleTheme?: () => void;
}

export default function TopHeader({ onToggleTheme }: TopHeaderProps) {
  const { colors, theme, currentUserEmail, signOutUser } = useApp();
  const desktop = useIsDesktop();

  const handleSignOut = async () => {
    await signOutUser();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    userInfo: {
      flexDirection: 'column',
      gap: 4,
    },
    userName: {
      fontSize: desktop ? FontSizeDesktop.sm : FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: colors.text,
      lineHeight: LineHeight.normal * (desktop ? FontSizeDesktop.sm : FontSize.sm),
    },
    userEmail: {
      fontSize: desktop ? FontSizeDesktop.xs : FontSize.xs,
      color: colors.textSecondary,
      lineHeight: LineHeight.normal * (desktop ? FontSizeDesktop.xs : FontSize.xs),
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    iconButton: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconButtonHover: {
      backgroundColor: colors.border,
    },
  });

  return (
    <View style={styles.container}>
      {/* Left Section: User Info */}
      <View style={styles.leftSection}>
        <View style={[styles.iconButton]}>
          <Ionicons name="person-circle" size={32} color={colors.accent} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {currentUserEmail ? currentUserEmail.split('@')[0] : 'Guest'}
          </Text>
          <Text style={styles.userEmail}>
            {currentUserEmail || 'Not signed in'}
          </Text>
        </View>
      </View>

      {/* Right Section: Actions */}
      <View style={styles.rightSection}>
        {/* Theme Toggle */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onToggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons
            name={theme === 'dark' ? 'moon' : 'sunny'}
            size={20}
            color={colors.accent}
          />
        </TouchableOpacity>

        {/* Sign Out */}
        {currentUserEmail && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out" size={20} color={colors.warning} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
