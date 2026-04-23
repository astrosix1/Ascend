import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { SIDEBAR_WIDTH, useScreenWidth } from '../utils/responsive';
import { Spacing, FontSize, BorderRadius, FontWeight, LineHeight } from '../utils/theme';

interface NavigationItem {
  id: string;
  label: string;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'clock', label: 'Clock' },
  { id: 'discover', label: 'Discover' },
  { id: 'community', label: 'Community' },
  { id: 'settings', label: 'Settings' },
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
    logo: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: colors.accent,
      marginBottom: Spacing.sm,
      lineHeight: FontSize.lg * 1.2,
      textAlign: 'center',
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
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer with Ascend Title and Collapse Button */}
      <View style={styles.footer}>
        {/* Ascend Title */}
        {!isCollapsed && (
          <Text style={[styles.logo, { fontSize: FontSize.sm, marginBottom: Spacing.md }]}>
            Ascend
          </Text>
        )}

        {/* Collapse Button */}
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={() => setManualCollapsed(!manualCollapsed)}
          activeOpacity={0.7}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
            {isCollapsed ? '›' : '‹'}
          </Text>
          <Text style={styles.collapseLabel}>
            {isCollapsed ? '' : 'Collapse'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
