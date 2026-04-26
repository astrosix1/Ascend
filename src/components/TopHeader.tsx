import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, ScrollView, Switch } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Spacing, FontSize, FontSizeDesktop, BorderRadius, FontWeight, LineHeight } from '../utils/theme';
import { useIsDesktop } from '../utils/responsive';
import { SyncStatusIndicator } from './SyncStatusIndicator';

interface TopHeaderProps {
  onToggleTheme?: () => void;
}

const DEFAULT_PREFS = {
  showMotivationQuote: true,
  showStreakHighlight: true,
  showAvoidedBadHabits: true,
  showSummary: true,
  showAnalyticsButton: true,
  showCalendar: true,
  showWins: true,
  showRelapse: true,
  showJournals: true,
};

export default function TopHeader({ onToggleTheme }: TopHeaderProps) {
  const { colors, theme, currentUserEmail, signOutUser, syncError, clearSyncError, manualSync, settings, updateSettings } = useApp();
  const desktop = useIsDesktop();

  // ── Dashboard Customize ──────────────────────────────────────────────────────
  const [showCustomize, setShowCustomize] = useState(false);
  const [localPrefs, setLocalPrefs] = useState(DEFAULT_PREFS);

  function openCustomize() {
    setLocalPrefs({ ...DEFAULT_PREFS, ...(settings.dashboardPreferences || {}) });
    setShowCustomize(true);
  }

  function savePrefs() {
    updateSettings({ dashboardPreferences: localPrefs });
    setShowCustomize(false);
  }

  const handleSignOut = async () => {
    await signOutUser();
  };

  const handleSyncPress = () => {
    manualSync();
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
    <>
      <View style={styles.container}>
        {/* Left Section: User Info */}
        <View style={styles.leftSection}>
          <View style={[styles.iconButton]}>
            <Text style={{ fontSize: 32, color: colors.accent }}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {currentUserEmail ? currentUserEmail.split('@')[0].split(/[._]/)[0] : 'Guest'}
            </Text>
            <Text style={styles.userEmail}>
              {currentUserEmail || 'Not signed in'}
            </Text>
          </View>
        </View>

        {/* Right Section: Actions */}
        <View style={styles.rightSection}>
          {/* Sync Status Indicator */}
          <SyncStatusIndicator onPress={handleSyncPress} />

          {/* Dashboard Customize (desktop only) */}
          {desktop && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={openCustomize}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
          )}

          {/* Theme Toggle */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onToggleTheme}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20, color: colors.accent }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </Text>
          </TouchableOpacity>

          {/* Sign Out */}
          {currentUserEmail && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16, color: colors.warning }}>⎋</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Dashboard Customize Modal */}
      <Modal
        visible={showCustomize}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomize(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.border, padding: Spacing.lg, width: 360, maxHeight: '80%' }}>
            <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs }}>⚙️ Customize Dashboard</Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.md }}>Toggle cards on or off. Preferences are saved per device.</Text>
            <ScrollView>
              {([
                { key: 'showMotivationQuote',  label: '💬 Daily Motivation Quote' },
                { key: 'showStreakHighlight',   label: '🔥 Streak Highlight' },
                { key: 'showAvoidedBadHabits', label: '✨ Avoided Bad Habits Badge' },
                { key: 'showSummary',          label: '📈 Weekly / Monthly Summary' },
                { key: 'showAnalyticsButton',  label: '📊 Analytics Button' },
              ] as const).map(({ key, label }) => (
                <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ color: colors.text, fontSize: FontSize.sm }}>{label}</Text>
                  <Switch
                    value={localPrefs[key]}
                    onValueChange={(val) => setLocalPrefs(p => ({ ...p, [key]: val }))}
                    thumbColor={localPrefs[key] ? colors.accent : colors.border}
                    trackColor={{ false: colors.surfaceLight, true: colors.accentLight }}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
              <TouchableOpacity
                onPress={savePrefs}
                style={{ flex: 1, backgroundColor: colors.accent, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center' }}
              >
                <Text style={{ color: '#1A1A1A', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCustomize(false)}
                style={{ flex: 1, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sync Error Banner */}
      {syncError && (
        <TouchableOpacity
          style={{
            backgroundColor: colors.warning,
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onPress={clearSyncError}
        >
          <Text style={{ color: '#1A1A1A', fontSize: FontSize.xs, flex: 1 }}>
            ⚠️ {syncError}
          </Text>
          <Text style={{ color: '#1A1A1A', marginLeft: Spacing.sm }}>✕</Text>
        </TouchableOpacity>
      )}
    </>
  );
}
