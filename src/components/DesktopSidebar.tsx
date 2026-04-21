import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../contexts/AppContext';
import { SIDEBAR_WIDTH, useScreenWidth } from '../utils/responsive';
import { Spacing, FontSize, BorderRadius, FontWeight, LineHeight } from '../utils/theme';

interface NavigationItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home-outline' },
  { id: 'clock', label: 'Clock', icon: 'time-outline' },
  { id: 'discover', label: 'Discover', icon: 'book-outline' },
  { id: 'community', label: 'Community', icon: 'people-outline' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline' },
];

interface DesktopSidebarProps {
  activeScreen: string;
  onNavigate: (screenId: string) => void;
}

export default function DesktopSidebar({ activeScreen, onNavigate }: DesktopSidebarProps) {
  const { colors, stats } = useApp();
  const screenWidth = useScreenWidth();
  // Auto-collapse when the window is between 769px and 900px (tight but still desktop)
  const autoCollapse = screenWidth <= 900;
  const [manualCollapsed, setManualCollapsed] = useState(false);
  const [focusedItem, setFocusedItem] = useState<string | null>(null);

  const isCollapsed = autoCollapse || manualCollapsed;
  const sidebarWidth = isCollapsed ? 60 : SIDEBAR_WIDTH;

  const styles = StyleSheet.create({
    container: {
      width: sidebarWidth,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingVertical: Spacing.lg,
      paddingHorizontal: isCollapsed ? Spacing.sm : Spacing.md,
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    header: {
      alignItems: 'center',
      marginBottom: Spacing.lg,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    logo: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: colors.accent,
      marginBottom: Spacing.sm,
      lineHeight: FontSize.lg * 1.2,
    },
    tagline: {
      fontSize: FontSize.xs,
      color: colors.textSecondary,
      lineHeight: FontSize.xs * 1.4,
    },
    navSection: {
      flex: 1,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isCollapsed ? 0 : Spacing.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      marginVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      backgroundColor: 'transparent',
      justifyContent: isCollapsed ? 'center' : 'flex-start',
    },
    navItemActive: {
      backgroundColor: colors.accentLight,
    },
    navItemFocused: {
      borderWidth: 2,
      borderColor: colors.accent,
    },
    navLabel: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: colors.text,
      display: isCollapsed ? 'none' : 'flex',
      lineHeight: FontSize.sm * 1.4,
    },
    navLabelActive: {
      color: colors.accent,
      fontWeight: FontWeight.bold,
    },
    navIcon: {
      fontSize: 20,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: Spacing.lg,
      gap: Spacing.sm,
    },
    collapseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: isCollapsed ? 'center' : 'flex-start',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.surfaceLight,
    },
    collapseLabel: {
      fontSize: FontSize.xs,
      color: colors.textSecondary,
      display: isCollapsed ? 'none' : 'flex',
      lineHeight: FontSize.xs * 1.4,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Text style={styles.logo}>🚀</Text>
        {!isCollapsed && (
          <>
            <Text style={[styles.logo, { fontSize: FontSize.md, marginBottom: 2 }]}>
              Ascend
            </Text>
            <Text style={styles.tagline}>Recovery companion</Text>
          </>
        )}
      </View>

      {/* Navigation Items */}
      <View style={styles.navSection}>
        {NAVIGATION_ITEMS.map(item => {
          const isActive = activeScreen === item.id;
          const isFocused = focusedItem === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                isActive && styles.navItemActive,
                isFocused && styles.navItemFocused,
              ]}
              onPress={() => onNavigate(item.id)}
              onFocus={() => setFocusedItem(item.id)}
              onBlur={() => setFocusedItem(null)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${item.label} navigation button`}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={isActive ? colors.accent : colors.textSecondary}
                style={styles.navIcon}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer with Collapse Button */}
      <View style={styles.footer}>
        {/* Collapse Button */}
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={() => setManualCollapsed(!manualCollapsed)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
            size={18}
            color={colors.textSecondary}
          />
          <Text style={styles.collapseLabel}>
            {isCollapsed ? '' : 'Collapse'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
