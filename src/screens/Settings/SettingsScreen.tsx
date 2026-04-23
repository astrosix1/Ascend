import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Switch, Alert, Modal
} from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionHeader from '../../components/SectionHeader';
import { Spacing, FontSize, BorderRadius } from '../../utils/theme';

export default function SettingsScreen() {
  const { colors, theme, toggleTheme, settings, updateSettings, stats, habits, pomodoroHistory, detoxHistory, currentUserEmail, signOutUser, resetAuth, manualSync, isSyncing, lastSyncTime, syncError } = useApp();

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(settings.username);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState(settings.location);
  const [editingDND, setEditingDND] = useState(false);
  const [dndStart, setDndStart] = useState(settings.doNotDisturbStart);
  const [dndEnd, setDndEnd] = useState(settings.doNotDisturbEnd);
  const [editingMaxTime, setEditingMaxTime] = useState(false);
  const [maxTimeInput, setMaxTimeInput] = useState(settings.maxDailyAppTime.toString());
  const [editingPomodoro, setEditingPomodoro] = useState(false);
  const [pomStudyInput, setPomStudyInput] = useState(settings.pomodoroStudyTime.toString());
  const [pomBreakInput, setPomBreakInput] = useState(settings.pomodoroBreakTime.toString());
  const [editingPartner, setEditingPartner] = useState(false);
  const [partnerName, setPartnerName] = useState(settings.accountabilityPartner?.name || '');
  const [partnerContact, setPartnerContact] = useState(settings.accountabilityPartner?.contact || '');
  const [showStats, setShowStats] = useState(false);

  const canChangeUsername = () => {
    if (!settings.usernameLastChanged) return true;
    const lastChanged = new Date(settings.usernameLastChanged);
    const now = new Date();
    const diffDays = (now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 30;
  };

  const saveUsername = () => {
    if (!usernameInput.trim()) return;
    if (!canChangeUsername()) {
      Alert.alert('Too soon', 'You can change your username once every 30 days.');
      return;
    }
    updateSettings({ username: usernameInput.trim(), usernameLastChanged: new Date().toISOString() });
    setEditingUsername(false);
  };

  const saveLocation = () => {
    updateSettings({ location: locationInput.trim() });
    setEditingLocation(false);
  };

  const saveDND = () => {
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(dndStart) || !timeRegex.test(dndEnd)) {
      Alert.alert('Invalid time', 'Please use HH:MM format');
      return;
    }
    updateSettings({ doNotDisturbStart: dndStart, doNotDisturbEnd: dndEnd });
    setEditingDND(false);
  };

  const saveMaxTime = () => {
    const mins = parseInt(maxTimeInput);
    if (!isNaN(mins) && mins >= 0) {
      updateSettings({ maxDailyAppTime: mins });
      setEditingMaxTime(false);
    }
  };

  const savePomodoro = () => {
    const study = parseInt(pomStudyInput);
    const brk = parseInt(pomBreakInput);
    if (!isNaN(study) && !isNaN(brk) && study > 0 && brk > 0) {
      updateSettings({ pomodoroStudyTime: study, pomodoroBreakTime: brk });
      setEditingPomodoro(false);
    }
  };

  const sendWelcomeEmail = (name: string, email: string, username: string) => {
    if (!email.includes('@')) return; // only send to email addresses, not phone
    const subject = encodeURIComponent(`${username} has added you as an accountability partner on Ascend`);
    const body = encodeURIComponent(
      `Hi ${name},\n\n` +
      `${username} has started their journey on Ascend — an app designed to help build better habits and break bad ones.\n\n` +
      `They've chosen you as their accountability partner. Each week you'll receive a brief summary of their progress.\n\n` +
      `Your role is simple: reply with encouragement when you can. No app download needed on your end.\n\n` +
      `Here's to helping ${username} become the best version of themselves.\n\n` +
      `— The Ascend Team`
    );
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    import('react-native').then(({ Linking }) => {
      Linking.openURL(mailtoUrl).catch(() =>
        Alert.alert('Could not open email', 'Please send the welcome email manually to ' + email)
      );
    });
  };

  const savePartner = () => {
    const name = partnerName.trim();
    const contact = partnerContact.trim();
    if (!name && !contact) {
      updateSettings({ accountabilityPartner: null });
    } else {
      updateSettings({ accountabilityPartner: { name, contact } });
      // Send welcome email immediately
      sendWelcomeEmail(name, contact, settings.username);
    }
    setEditingPartner(false);
  };

  const removePartner = () => {
    Alert.alert('Remove Partner', 'Remove your accountability partner?', [
      { text: 'Cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { updateSettings({ accountabilityPartner: null }); setPartnerName(''); setPartnerContact(''); } },
    ]);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: Spacing.md },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: FontSize.md, color: colors.text, fontWeight: '600' },
    value: { fontSize: FontSize.sm, color: colors.textSecondary },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.sm,
      padding: Spacing.sm, color: colors.text, backgroundColor: colors.surfaceLight,
      fontSize: FontSize.md, marginVertical: Spacing.xs,
    },
    sectionLabel: { fontSize: FontSize.xs, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.sm },
    statBox: { alignItems: 'center', flex: 1, padding: Spacing.sm },
    statNumber: { fontSize: FontSize.xl, fontWeight: '700', color: colors.accent },
    statLabel: { fontSize: FontSize.xs, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  });

  const SettingRow = ({ label, value, onPress, icon }: { label: string; value: string; onPress: () => void; icon?: string }) => (
    <TouchableOpacity style={[s.row, { paddingVertical: Spacing.sm }]} onPress={onPress}>
      <View>
        <Text style={s.label}>{label}</Text>
        <Text style={s.value}>{value}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>→</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Profile */}
        <Text style={s.sectionLabel}>PROFILE</Text>
        <Card>
          <View style={[s.row, { marginBottom: Spacing.md }]}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: FontSize.xl, color: colors.accent, fontWeight: '700' }}>
                {settings.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: FontSize.lg }}>{settings.username}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>Level {stats.level} · {stats.xp} XP</Text>
            </View>
            <TouchableOpacity onPress={() => setShowStats(!showStats)}>
              <Text style={{ color: colors.accent, fontSize: 20 }}>📊</Text>
            </TouchableOpacity>
          </View>

          {showStats && (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: Spacing.md }}>
              <View style={{ flexDirection: 'row', marginBottom: Spacing.sm }}>
                <View style={s.statBox}>
                  <Text style={s.statNumber}>{stats.currentStreak}</Text>
                  <Text style={s.statLabel}>Current{'\n'}Streak</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statNumber}>{stats.bestStreak}</Text>
                  <Text style={s.statLabel}>Best{'\n'}Streak</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statNumber}>{stats.totalPoints}</Text>
                  <Text style={s.statLabel}>Total{'\n'}Points</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statNumber}>{habits.length}</Text>
                  <Text style={s.statLabel}>Active{'\n'}Habits</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={s.statBox}>
                  <Text style={s.statNumber}>{pomodoroHistory.length}</Text>
                  <Text style={s.statLabel}>Pomodoro{'\n'}Sessions</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statNumber}>{detoxHistory.reduce((sum, s) => sum + s.duration, 0)}</Text>
                  <Text style={s.statLabel}>Detox{'\n'}Minutes</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statNumber}>{detoxHistory.reduce((sum, s) => sum + s.pointsEarned, 0)}</Text>
                  <Text style={s.statLabel}>Detox{'\n'}Points</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: Spacing.md, paddingTop: Spacing.md }}>
            {currentUserEmail ? (
              <>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>Signed in as</Text>
                <Text style={{ color: colors.text, fontSize: FontSize.sm, marginBottom: Spacing.md }}>{currentUserEmail}</Text>
                <Button
                  title="Sign Out"
                  variant="ghost"
                  onPress={() => {
                    signOutUser().catch(err => console.error('Sign out error:', err));
                  }}
                />
              </>
            ) : (
              <>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>Using guest mode</Text>
                <Text style={{ color: colors.text, fontSize: FontSize.sm, marginBottom: Spacing.md }}>No account connected</Text>
                <Button
                  title="Log In"
                  variant="ghost"
                  onPress={() => {
                    resetAuth().catch(err => console.error('Log in error:', err));
                  }}
                />
              </>
            )}
          </View>
        </Card>

        {/* Username */}
        {editingUsername ? (
          <Card>
            <Text style={{ color: colors.text, fontWeight: '700', marginBottom: Spacing.xs }}>Change Username</Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
              Can be changed once every 30 days.
            </Text>
            <TextInput style={s.input} value={usernameInput} onChangeText={setUsernameInput} placeholder="Username" placeholderTextColor={colors.textSecondary} maxLength={24} />
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Button title="Save" onPress={saveUsername} style={{ flex: 1 }} />
              <Button title="Cancel" variant="ghost" onPress={() => setEditingUsername(false)} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <Card>
            <SettingRow label="Username" value={settings.username} onPress={() => setEditingUsername(true)} icon="pencil-outline" />
          </Card>
        )}

        {/* Location */}
        {editingLocation ? (
          <Card>
            <Text style={{ color: colors.text, fontWeight: '700', marginBottom: Spacing.xs }}>Location</Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
              Used for weather, news, and local events.
            </Text>
            <TextInput style={s.input} value={locationInput} onChangeText={setLocationInput} placeholder="City, State / Country" placeholderTextColor={colors.textSecondary} />
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Button title="Save" onPress={saveLocation} style={{ flex: 1 }} />
              <Button title="Cancel" variant="ghost" onPress={() => setEditingLocation(false)} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <Card>
            <SettingRow label="Location" value={settings.location || 'Not set'} onPress={() => setEditingLocation(true)} icon="location-outline" />
          </Card>
        )}

        {/* Theme */}
        <Text style={s.sectionLabel}>APPEARANCE</Text>
        <Card>
          <View style={s.row}>
            <View>
              <Text style={s.label}>Theme</Text>
              <Text style={s.value}>{theme === 'dark' ? 'Dark Grey' : 'Light Grey'} · Orange accent</Text>
            </View>
            <Switch
              value={theme === 'light'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.accentLight }}
              thumbColor={theme === 'light' ? colors.accent : '#888'}
            />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: Spacing.sm, lineHeight: 18 }}>
            Easy on the eyes. Reduces blue light to protect your sleep.
          </Text>
        </Card>

        {/* Healthy Boundaries */}
        <Text style={s.sectionLabel}>HEALTHY BOUNDARIES</Text>
        <Card>
          {editingMaxTime ? (
            <View>
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: Spacing.xs }}>Max Daily App Time</Text>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
                Set to 0 for unlimited. After this many minutes, the app gently locks.
              </Text>
              <TextInput style={s.input} value={maxTimeInput} onChangeText={setMaxTimeInput} placeholder="Minutes (0 = unlimited)" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                <Button title="Save" onPress={saveMaxTime} style={{ flex: 1 }} />
                <Button title="Cancel" variant="ghost" onPress={() => setEditingMaxTime(false)} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <SettingRow
              label="Max Daily App Time"
              value={settings.maxDailyAppTime === 0 ? 'Unlimited' : `${settings.maxDailyAppTime} minutes`}
              onPress={() => setEditingMaxTime(true)}
            />
          )}
        </Card>

        <Card>
          {editingDND ? (
            <View>
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: Spacing.xs }}>Do Not Disturb</Text>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>App closes automatically during these hours.</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
                <TextInput style={[s.input, { flex: 1 }]} value={dndStart} onChangeText={setDndStart} placeholder="From HH:MM" placeholderTextColor={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary }}>to</Text>
                <TextInput style={[s.input, { flex: 1 }]} value={dndEnd} onChangeText={setDndEnd} placeholder="To HH:MM" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                <Button title="Save" onPress={saveDND} style={{ flex: 1 }} />
                <Button title="Cancel" variant="ghost" onPress={() => setEditingDND(false)} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <SettingRow
              label="Do Not Disturb"
              value={`${settings.doNotDisturbStart} – ${settings.doNotDisturbEnd}`}
              onPress={() => setEditingDND(true)}
              icon="moon-outline"
            />
          )}
        </Card>

        {/* Reflection prompts */}
        <Text style={s.sectionLabel}>REFLECTION PROMPTS</Text>
        <Card>
          <Text style={s.label}>Frequency</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
            {(['daily', 'weekly', 'never'] as const).map(freq => (
              <TouchableOpacity
                key={freq}
                onPress={() => updateSettings({ reflectionFrequency: freq })}
                style={{
                  flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm,
                  borderWidth: 1, alignItems: 'center',
                  backgroundColor: settings.reflectionFrequency === freq ? colors.accentLight : 'transparent',
                  borderColor: settings.reflectionFrequency === freq ? colors.accent : colors.border,
                }}
              >
                <Text style={{ color: settings.reflectionFrequency === freq ? colors.accent : colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', textTransform: 'capitalize' }}>
                  {freq}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: Spacing.sm }}>
            Brief prompts asking what you did instead of a bad habit today.
          </Text>
        </Card>

        {/* Cloud Sync */}
        <Text style={s.sectionLabel}>CLOUD SYNC</Text>
        <Card>
          <View style={[s.row, { marginBottom: Spacing.md }]}>
            <View>
              <Text style={s.label}>Cloud Status</Text>
              <Text style={s.value}>
                {currentUserEmail ? '✓ Synced' : '○ Guest Mode'}
              </Text>
            </View>
            {currentUserEmail && (
              <TouchableOpacity
                onPress={() => manualSync()}
                disabled={isSyncing}
                style={{
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  backgroundColor: colors.accentLight,
                  borderRadius: BorderRadius.sm,
                  opacity: isSyncing ? 0.6 : 1,
                }}
              >
                <Text style={{ color: colors.accent, fontWeight: '600', fontSize: FontSize.sm }}>
                  {isSyncing ? '⟳ Syncing...' : '↻ Sync Now'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {lastSyncTime && (
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
              Last synced: {new Date(lastSyncTime).toLocaleString()}
            </Text>
          )}

          {syncError && (
            <Text style={{ color: colors.danger, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
              ⚠️ {syncError}
            </Text>
          )}

          {currentUserEmail ? (
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, lineHeight: 18 }}>
              Your data is automatically saved to the cloud and synchronized across all devices you sign into. Tap "Sync Now" to manually refresh.
            </Text>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, lineHeight: 18 }}>
              Sign in to enable cloud sync and access your data on any device.
            </Text>
          )}
        </Card>

        {/* Accountability Partner */}
        <Text style={s.sectionLabel}>ACCOUNTABILITY PARTNER</Text>
        <Card>
          {editingPartner ? (
            <View>
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: Spacing.xs }}>Accountability Partner</Text>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
                A welcome email will be sent immediately. Weekly progress summaries will follow. No app needed on their end.
              </Text>
              <TextInput style={s.input} value={partnerName} onChangeText={setPartnerName} placeholder="Their name" placeholderTextColor={colors.textSecondary} />
              <TextInput style={s.input} value={partnerContact} onChangeText={setPartnerContact} placeholder="Email or phone" placeholderTextColor={colors.textSecondary} keyboardType="email-address" />
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                <Button title="Save" onPress={savePartner} style={{ flex: 1 }} />
                <Button title="Cancel" variant="ghost" onPress={() => setEditingPartner(false)} style={{ flex: 1 }} />
              </View>
            </View>
          ) : settings.accountabilityPartner ? (
            <View>
              <View style={s.row}>
                <View>
                  <Text style={s.label}>{settings.accountabilityPartner.name}</Text>
                  <Text style={s.value}>{settings.accountabilityPartner.contact}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 }}>Weekly summaries via email</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <TouchableOpacity onPress={() => setEditingPartner(true)}>
                    <Text style={{ color: colors.textSecondary, fontSize: 16 }}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={removePartner}>
                    <Text style={{ color: colors.danger, fontSize: 16 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingPartner(true)}>
              <View style={s.row}>
                <View>
                  <Text style={s.label}>Add Accountability Partner</Text>
                  <Text style={s.value}>Keep each other accountable via email</Text>
                </View>
                <Text style={{ color: colors.accent, fontSize: 16 }}>➕</Text>
              </View>
            </TouchableOpacity>
          )}
        </Card>

      </ScrollView>
    </View>
  );
}
