import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Switch, Modal, Alert, FlatList
} from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionHeader from '../../components/SectionHeader';
import { Spacing, FontSize, BorderRadius } from '../../utils/theme';
import { PomodoroSession, DetoxSession, Alarm } from '../../utils/types';
import { useScreenWidth, BREAKPOINTS } from '../../utils/responsive';

type ClockTab = 'alarm' | 'pomodoro' | 'detox';
type PomodoroState = 'idle' | 'studying' | 'break';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VOICE_OPTIONS: { value: Alarm['voiceOption']; label: string; desc: string }[] = [
  { value: 'news', label: 'News', desc: 'Morning news update' },
  { value: 'weather', label: 'Weather', desc: "Today's weather forecast" },
  { value: 'briefing', label: 'Briefing', desc: "Yesterday's progress review" },
  { value: 'motivational', label: 'Motivational', desc: 'Motivational quote' },
  { value: 'silent', label: 'Silent', desc: 'Alarm only, no voice' },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function getTodayLocal(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}



export default function ClockScreen() {
  const { colors, settings, updateSettings, pomodoroHistory, addPomodoroSession, detoxHistory, addDetoxSession, addXP, activeTimer, timerStartTime, timerDuration, setActiveTimer, alarms, setAlarms } = useApp();
  const screenWidth = useScreenWidth();
  const desktop = screenWidth > BREAKPOINTS.tablet;
  const [activeTab, setActiveTab] = useState<ClockTab>('alarm');

  // ─── HELPER: Calculate timer state from global activeTimer ──────────────────
  // Consolidated to eliminate duplication in initial state and sync logic
  const calculatePomTimerState = useCallback(() => {
    if (activeTimer === 'pomodoro' && timerStartTime && timerDuration > 0) {
      const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
      if (elapsed < timerDuration) {
        const state = timerDuration === settings.pomodoroStudyTime * 60 ? 'studying' : 'break';
        const seconds = timerDuration - elapsed;
        return { state, seconds };
      }
    }
    return { state: 'idle' as PomodoroState, seconds: settings.pomodoroStudyTime * 60 };
  }, [activeTimer, timerStartTime, timerDuration, settings.pomodoroStudyTime]);

  const [pomState, setPomState] = useState<PomodoroState>('idle');
  const [pomSeconds, setPomSeconds] = useState(settings.pomodoroStudyTime * 60);

  // Sync timer state on mount and when global activeTimer changes
  // This consolidates the duplicate logic from getInitialPomState/getInitialPomSeconds
  useEffect(() => {
    const { state, seconds } = calculatePomTimerState();
    setPomState(state);
    setPomSeconds(seconds);
  }, [calculatePomTimerState]);

  // ─── ALARM STATE (managed in AppContext for persistence + global firing) ──
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [alarmTime, setAlarmTime] = useState('07:00');
  const [alarmAmPm, setAlarmAmPm] = useState<'AM' | 'PM'>('AM');
  const [alarmLabel, setAlarmLabel] = useState('');
  const [alarmDays, setAlarmDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [alarmVoices, setAlarmVoices] = useState<Alarm['voiceOption'][]>(['briefing']);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);

  // ─── POMODORO SETTINGS STATE ────────────────────────────────────
  const [showPomSettings, setShowPomSettings] = useState(false);
  const [pomStudyVal, setPomStudyVal] = useState(settings.pomodoroStudyTime.toString());
  const [pomBreakVal, setPomBreakVal] = useState(settings.pomodoroBreakTime.toString());

  // ─── POMODORO LOCAL STATE ───────────────────────────────────────
  const [pomSessionCount, setPomSessionCount] = useState(0);
  const [pomStartTimeStr, setPomStartTimeStr] = useState<string>('');
  const [showBreakActivity, setShowBreakActivity] = useState(false);
  const [breakActivity, setBreakActivity] = useState('');
  const [pomSort, setPomSort] = useState<'recent' | 'longest'>('recent');
  const pomInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── DETOX STATE ────────────────────────────────────────────────
  // Consolidated helper to eliminate duplication in initial state and sync logic
  const calculateDetoxTimerState = useCallback(() => {
    if (activeTimer === 'detox' && timerStartTime && timerDuration > 0) {
      const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
      const isActive = elapsed < timerDuration;
      const seconds = Math.max(0, timerDuration - elapsed);
      return { isActive, seconds };
    }
    return { isActive: false, seconds: 0 };
  }, [activeTimer, timerStartTime, timerDuration]);

  const [detoxActive, setDetoxActive] = useState(false);
  const [detoxSeconds, setDetoxSeconds] = useState(0);

  // Sync detox state on mount and when global activeTimer changes
  useEffect(() => {
    const { isActive, seconds } = calculateDetoxTimerState();
    setDetoxActive(isActive);
    setDetoxSeconds(seconds);
  }, [calculateDetoxTimerState]);
  const [detoxTotalSeconds, setDetoxTotalSeconds] = useState(1800);
  const [detoxCustom, setDetoxCustom] = useState('');
  const [detoxStartTime, setDetoxStartTime] = useState('');
  const detoxInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── POMODORO TIMER - Uses global timer state ───────────────────
  const clearPomInterval = useCallback(() => {
    if (pomInterval.current) {
      clearInterval(pomInterval.current);
      pomInterval.current = null;
    }
  }, []);

  // Calculate elapsed and remaining time from global timer state
  useEffect(() => {
    if (activeTimer === 'pomodoro' && timerStartTime) {
      pomInterval.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
        const remaining = Math.max(0, timerDuration - elapsed);
        setPomSeconds(remaining);

        if (remaining <= 0) {
          clearInterval(pomInterval.current!);
          pomInterval.current = null;
          // AppContext global watcher handles notification + clearing activeTimer.
          // Just update local UI state here.
          if (pomState === 'studying') {
            const session: PomodoroSession = {
              id: Date.now().toString(),
              startTime: pomStartTimeStr,
              endTime: new Date().toISOString(),
              duration: settings.pomodoroStudyTime,
              breakDuration: settings.pomodoroBreakTime,
              breakActivity: breakActivity || undefined,
              completed: true,
              date: getTodayLocal(),
            };
            addPomodoroSession(session);
            setPomSessionCount(prev => prev + 1);
            setPomState('idle');
            setShowBreakActivity(true);
          } else if (pomState === 'break') {
            setPomState('idle');
          }
        }
      }, 1000);
    }
    return () => {
      if (pomInterval.current) clearInterval(pomInterval.current);
    };
  }, [activeTimer, timerStartTime, timerDuration, pomState, pomStartTimeStr, breakActivity, settings, addPomodoroSession, clearPomInterval]);

  const startPomodoro = () => {
    setPomStartTimeStr(new Date().toISOString());
    setPomState('studying');
    setActiveTimer('pomodoro', settings.pomodoroStudyTime * 60);
  };

  const startBreakWithActivity = useCallback((activity: string) => {
    setBreakActivity(activity);
    setShowBreakActivity(false);
    setPomState('break');
    setActiveTimer('pomodoro', settings.pomodoroBreakTime * 60);
  }, [settings.pomodoroBreakTime, setActiveTimer]);

  const pausePomodoro = () => {
    clearPomInterval();
    setActiveTimer(null, 0);
    setPomState('idle');
  };

  const resetPomodoro = () => {
    clearPomInterval();
    setActiveTimer(null, 0);
    setPomState('idle');
    setPomSeconds(settings.pomodoroStudyTime * 60);
    setBreakActivity('');
  };

  const confirmBreakActivity = (activity: string) => {
    setBreakActivity(activity);
    setShowBreakActivity(false);
    // Auto-start next session
    setPomStartTimeStr(new Date().toISOString());
    setPomSeconds(settings.pomodoroStudyTime * 60);
    setPomState('studying');
  };

  // ─── POMODORO SETTINGS SAVE ─────────────────────────────────────
  const savePomSettings = () => {
    const study = parseInt(pomStudyVal);
    const brk = parseInt(pomBreakVal);
    if (isNaN(study) || study < 1 || isNaN(brk) || brk < 1) {
      Alert.alert('Invalid values', 'Please enter valid minutes (>0)');
      return;
    }
    updateSettings({ pomodoroStudyTime: study, pomodoroBreakTime: brk });
    clearPomInterval();
    setActiveTimer(null, 0);
    setPomState('idle');
    setPomSeconds(study * 60);
    setBreakActivity('');
    setShowPomSettings(false);
  };

  // ─── DETOX TIMER - Uses global timer state ──────────────────────
  const clearDetoxInterval = useCallback(() => {
    if (detoxInterval.current) {
      clearInterval(detoxInterval.current);
      detoxInterval.current = null;
    }
  }, []);

  // Unmount cleanup — only clears the interval, does NOT clear global state
  useEffect(() => {
    return () => {
      if (detoxInterval.current) clearInterval(detoxInterval.current);
    };
  }, []);

  // Start/restart the detox interval whenever global timer state says detox is active
  // Initial state sync is now handled by consolidated useEffect above
  useEffect(() => {
    if (activeTimer === 'detox' && timerStartTime && timerDuration > 0) {
      const startTime = timerStartTime;
      const totalSecs = timerDuration;

      // Clear any existing interval before creating a new one
      if (detoxInterval.current) clearInterval(detoxInterval.current);
      detoxInterval.current = setInterval(() => {
        const el = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, totalSecs - el);
        setDetoxSeconds(remaining);
        if (remaining <= 0) {
          clearInterval(detoxInterval.current!);
          detoxInterval.current = null;
          setDetoxActive(false);
          // AppContext global watcher fires the notification and clears activeTimer.
        }
      }, 1000);
    } else {
      clearDetoxInterval();
    }
    return () => {
      if (detoxInterval.current) clearInterval(detoxInterval.current);
    };
  }, [activeTimer, timerStartTime, timerDuration, clearDetoxInterval]);

  const startDetox = () => {
    const startTime = Date.now();
    const totalSecs = detoxTotalSeconds;
    setDetoxStartTime(new Date(startTime).toISOString());
    setActiveTimer('detox', totalSecs, startTime);
    // The useEffect above will handle starting the interval
  };

  const finishDetox = (totalSecs: number, endTime: string) => {
    setActiveTimer(null, 0);
    setDetoxActive(false);
    const minutesDone = Math.floor(totalSecs / 60);
    const pointsEarned = Math.floor(minutesDone / 30);
    const session: DetoxSession = {
      id: Date.now().toString(),
      startTime: detoxStartTime,
      endTime,
      duration: Math.floor(totalSecs / 60),
      pointsEarned: Math.max(pointsEarned, 0),
      date: getTodayLocal(),
    };
    addDetoxSession(session);
    if (pointsEarned > 0) addXP(pointsEarned * 10);
  };

  const endDetoxEarly = () => {
    const elapsedSecs = timerStartTime
      ? Math.min(detoxTotalSeconds, Math.floor((Date.now() - timerStartTime) / 1000))
      : 0;
    clearDetoxInterval();
    finishDetox(elapsedSecs, new Date().toISOString());
  };

  // ─── ALARM HELPERS ──────────────────────────────────────────────
  const resetAlarmForm = () => {
    setAlarmLabel('');
    setAlarmTime('07:00');
    setAlarmAmPm('AM');
    setAlarmDays([1, 2, 3, 4, 5]);
    setAlarmVoices(['briefing']);
    setEditingAlarmId(null);
  };

  const saveAlarm = () => {
    if (!alarmTime.match(/^\d{2}:\d{2}$/)) {
      Alert.alert('Invalid time', 'Please enter time as HH:MM');
      return;
    }
    if (editingAlarmId !== null) {
      setAlarms(alarms.map(a => a.id !== editingAlarmId ? a : {
        ...a,
        time: alarmTime,
        days: alarmDays,
        label: alarmLabel || 'Alarm',
        voiceOption: alarmVoices[0],
      }));
    } else {
      const alarm: Alarm = {
        id: Date.now().toString(),
        time: alarmTime,
        days: alarmDays,
        enabled: true,
        label: alarmLabel || 'Alarm',
        voiceOption: alarmVoices[0],
      };
      setAlarms([...alarms, alarm]);
    }
    setShowAlarmForm(false);
    resetAlarmForm();
  };

  const startEditAlarm = (alarm: Alarm) => {
    setEditingAlarmId(alarm.id);
    setAlarmTime(alarm.time);
    setAlarmLabel(alarm.label || '');
    setAlarmDays(alarm.days);
    setAlarmVoices([alarm.voiceOption]);
    setShowAlarmForm(true);
  };

  const toggleAlarmDay = (day: number) => {
    setAlarmDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleAlarmEnabled = (id: string) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id: string) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const sortedHistory = [...pomodoroHistory].sort((a, b) =>
    pomSort === 'recent'
      ? new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      : b.duration - a.duration
  );

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    tabRow: {
      flexDirection: 'row', backgroundColor: colors.surface,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
    tabText: { fontSize: FontSize.sm, fontWeight: '600' },
    scroll: { padding: Spacing.md },
    timerCircle: {
      width: 180, height: 180, borderRadius: 90,
      borderWidth: 4, borderColor: colors.accent,
      alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
      marginVertical: Spacing.xl, backgroundColor: colors.surface,
      maxWidth: '80%',
    },
    timerText: { fontSize: 40, fontWeight: '200', color: colors.text, fontVariant: ['tabular-nums'] },
    timerLabel: { fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 4 },
    btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    alarmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    alarmTime: { fontSize: FontSize.xl, fontWeight: '300', color: colors.text },
    alarmLabel: { fontSize: FontSize.sm, color: colors.textSecondary },
    dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginVertical: Spacing.xs },
    dayCircle: {
      width: 32, height: 32, borderRadius: 16, alignItems: 'center',
      justifyContent: 'center', borderWidth: 1,
    },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.sm,
      padding: Spacing.sm, color: colors.text, backgroundColor: colors.surface,
      fontSize: FontSize.md, marginBottom: Spacing.sm,
    },
    sortRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs },
    detoxScreen: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', zIndex: 99,
    },
    detoxBigTimer: { fontSize: 56, fontWeight: '100', color: '#F5A623', fontVariant: ['tabular-nums'] },
    detoxPrompt: { fontSize: FontSize.md, color: '#555', marginTop: Spacing.xl, textAlign: 'center', paddingHorizontal: Spacing.xl },
    durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    breakActivityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    voiceOpt: {
      padding: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1,
      marginBottom: Spacing.xs, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    pomSettingsCard: {
      borderColor: colors.accent, borderWidth: 1,
      marginBottom: Spacing.md,
    },
    pomSettingsRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm,
    },
    pomSettingsInput: {
      borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.sm,
      padding: Spacing.sm, color: colors.text, backgroundColor: colors.background,
      fontSize: FontSize.md, minWidth: 60, maxWidth: 90, flex: 1, textAlign: 'center',
    },
  });

  return (
    <View style={s.container}>
      {/* Full-screen detox overlay */}
      {detoxActive && (
        <View style={s.detoxScreen}>
          <Text style={{ color: '#555', fontSize: FontSize.sm, letterSpacing: 4, marginBottom: Spacing.xl }}>
            DETOX ACTIVE
          </Text>
          <Text style={s.detoxBigTimer}>{formatHMS(detoxSeconds)}</Text>
          <Text style={s.detoxPrompt}>
            Put your phone down.{'\n'}Come back when the timer ends.
          </Text>
          <TouchableOpacity
            onPress={endDetoxEarly}
            style={{ marginTop: Spacing.xxl, padding: Spacing.md, borderWidth: 1, borderColor: '#333', borderRadius: BorderRadius.sm }}
          >
            <Text style={{ color: '#555', fontSize: FontSize.sm }}>I'm back — end session</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Break Activity Modal */}
      <Modal visible={showBreakActivity} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' }}>
          <View style={{ backgroundColor: colors.surface, padding: Spacing.lg, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg }}>
            <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm }}>
              Break time! What will you do?
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.md }}>
              The time away from this screen is the real achievement.
            </Text>
            <View style={s.breakActivityRow}>
              {['Walk', 'Stretch', 'Conversation', 'Hydrate', 'Fresh air', 'Other'].map(act => (
                <TouchableOpacity
                  key={act}
                  onPress={() => confirmBreakActivity(act)}
                  style={{
                    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                    backgroundColor: colors.accentLight, borderRadius: BorderRadius.full,
                    borderWidth: 1, borderColor: colors.accent,
                  }}
                >
                  <Text style={{ color: colors.accent, fontWeight: '600' }}>{act}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Skip" variant="ghost" onPress={() => confirmBreakActivity('')} style={{ marginTop: Spacing.md }} />
          </View>
        </View>
      </Modal>

      {/* Desktop: Sidebar + content panel */}
      {desktop && (
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
          {/* Sidebar */}
          <View style={{ width: 220, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.surface }}>
            <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.text, letterSpacing: -0.5 }}>Clock</Text>
            </View>
            {([
              { id: 'alarm' as ClockTab, label: 'Alarms', icon: '🔔', sub: alarms.length + ' alarm' + (alarms.length !== 1 ? 's' : '') },
              { id: 'pomodoro' as ClockTab, label: 'Pomodoro', icon: '🍅', sub: settings.pomodoroStudyTime + 'm focus · ' + settings.pomodoroBreakTime + 'm break' },
              { id: 'detox' as ClockTab, label: 'Phone Detox', icon: '📵', sub: 'Intentional breaks' },
            ]).map(cat => {
              const isActive = activeTab === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setActiveTab(cat.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                    paddingHorizontal: Spacing.md, paddingVertical: 12,
                    backgroundColor: isActive ? colors.accentLight : 'transparent',
                    borderRightWidth: isActive ? 3 : 0, borderRightColor: colors.accent,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FontSize.sm, fontWeight: isActive ? '700' : '500', color: isActive ? colors.accent : colors.text }}>{cat.label}</Text>
                    <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{cat.sub}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Content panel */}
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ width: 3, height: 18, backgroundColor: colors.accent, borderRadius: 2, marginRight: Spacing.sm }} />
              <Text style={{ flex: 1, fontSize: FontSize.md, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
                {activeTab === 'alarm' ? 'Alarms' : activeTab === 'pomodoro' ? 'Pomodoro' : 'Phone Detox'}
              </Text>
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>
                {activeTab === 'alarm' ? 'Wake up informed, not reactive' : activeTab === 'pomodoro' ? settings.pomodoroStudyTime + 'm focus · ' + settings.pomodoroBreakTime + 'm break' : 'Intentional disconnection'}
              </Text>
            </View>
            <ScrollView style={{ flex: 1, padding: Spacing.md }} contentContainerStyle={{ paddingBottom: 40 }}>
            {activeTab === 'alarm' && <>
            {alarms.map(alarm => (
              <Card key={alarm.id}>
                <View style={s.alarmRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.alarmTime}>{alarm.time}</Text>
                    <Text style={s.alarmLabel}>{alarm.label}</Text>
                    <Text style={[s.alarmLabel, { color: colors.accent }]}>
                      {VOICE_OPTIONS.find(opt => opt.value === alarm.voiceOption)?.label ?? alarm.voiceOption}
                    </Text>
                    <View style={s.dayRow}>
                      {DAYS.map((d, i) => (
                        <View key={i} style={[s.dayCircle, {
                          backgroundColor: alarm.days.includes(i) ? colors.accentLight : 'transparent',
                          borderColor: alarm.days.includes(i) ? colors.accent : colors.border,
                        }]}>
                          <Text style={{ fontSize: 9, color: alarm.days.includes(i) ? colors.accent : colors.textSecondary }}>
                            {d.slice(0, 1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: Spacing.sm }}>
                    <Switch
                      value={alarm.enabled}
                      onValueChange={() => toggleAlarmEnabled(alarm.id)}
                      trackColor={{ false: colors.border, true: colors.accent }}
                      thumbColor="#FFF"
                    />
                    <TouchableOpacity onPress={() => startEditAlarm(alarm)}>
                      <Text style={{ color: colors.textSecondary, fontSize: 16 }}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteAlarm(alarm.id)}>
                      <Text style={{ color: colors.danger, fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}

            {alarms.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
                <Text style={{ fontSize: 48, color: colors.textSecondary, marginBottom: Spacing.sm }}>🔔</Text>
                <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>No alarms set</Text>
              </View>
            )}

            {showAlarmForm ? (
              <Card style={{ borderColor: colors.accent }}>
                <Text style={{ color: colors.text, fontWeight: '700', marginBottom: Spacing.md, fontSize: FontSize.md }}>
                  {editingAlarmId !== null ? 'Edit Alarm' : 'New Alarm'}
                </Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, alignItems: 'center' }}>
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    value={alarmTime}
                    onChangeText={setAlarmTime}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numbers-and-punctuation"
                  />
                  <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                    {(['AM', 'PM'] as const).map(period => (
                      <TouchableOpacity
                        key={period}
                        onPress={() => setAlarmAmPm(period)}
                        style={{
                          paddingHorizontal: Spacing.md,
                          paddingVertical: Spacing.xs,
                          borderRadius: 4,
                          backgroundColor: alarmAmPm === period ? colors.accent : colors.surface,
                          borderWidth: 1,
                          borderColor: alarmAmPm === period ? colors.accent : colors.border,
                        }}
                      >
                        <Text style={{ color: alarmAmPm === period ? '#1A1A1A' : colors.textSecondary, fontWeight: '600', fontSize: FontSize.sm }}>
                          {period}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TextInput
                  style={s.input}
                  value={alarmLabel}
                  onChangeText={setAlarmLabel}
                  placeholder="Label (optional)"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.xs }}>REPEAT DAYS</Text>
                <View style={s.dayRow}>
                  {DAYS.map((d, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => toggleAlarmDay(i)}
                      style={[s.dayCircle, {
                        backgroundColor: alarmDays.includes(i) ? colors.accentLight : 'transparent',
                        borderColor: alarmDays.includes(i) ? colors.accent : colors.border,
                      }]}
                    >
                      <Text style={{ fontSize: 10, color: alarmDays.includes(i) ? colors.accent : colors.textSecondary }}>
                        {d.slice(0, 2)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: Spacing.sm, marginBottom: Spacing.xs }}>
                  VOICE BRIEFING
                </Text>
                {VOICE_OPTIONS.map(opt => {
                  const selected = alarmVoices[0] === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setAlarmVoices([opt.value])}
                      style={[s.voiceOpt, {
                        backgroundColor: selected ? colors.accentLight : 'transparent',
                        borderColor: selected ? colors.accent : colors.border,
                      }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: selected ? colors.accent : colors.text, fontWeight: '600', fontSize: FontSize.sm }}>
                          {opt.label}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>{opt.desc}</Text>
                      </View>
                      {selected && (
                        <Text style={{ color: colors.accent, fontSize: 16 }}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
                <View style={[s.btnRow, { marginTop: Spacing.sm }]}>
                  <Button
                    title={editingAlarmId !== null ? 'Update Alarm' : 'Save Alarm'}
                    onPress={saveAlarm}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Cancel"
                    variant="ghost"
                    onPress={() => {
                      setShowAlarmForm(false);
                      resetAlarmForm();
                    }}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ) : (
              <Button
                title="+ Add Alarm"
                variant="secondary"
                onPress={() => {
                  resetAlarmForm();
                  setShowAlarmForm(true);
                }}
                style={{ marginTop: Spacing.sm }}
              />
            )}
          </>}
            {activeTab === 'pomodoro' && <>

            {/* Inline Pomodoro Settings Card */}
            {showPomSettings && (
              <Card style={s.pomSettingsCard}>
                <Text style={{ color: colors.text, fontWeight: '700', marginBottom: Spacing.sm, fontSize: FontSize.sm }}>
                  Timer Settings
                </Text>
                <View style={s.pomSettingsRow}>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, flex: 1 }}>Study time (min)</Text>
                  <TextInput
                    style={s.pomSettingsInput}
                    value={pomStudyVal}
                    onChangeText={setPomStudyVal}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={s.pomSettingsRow}>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, flex: 1 }}>Break time (min)</Text>
                  <TextInput
                    style={s.pomSettingsInput}
                    value={pomBreakVal}
                    onChangeText={setPomBreakVal}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={[s.btnRow, { marginTop: Spacing.xs, marginBottom: 0 }]}>
                  <Button title="Save" onPress={savePomSettings} style={{ flex: 1 }} size="small" />
                  <Button title="Cancel" variant="ghost" onPress={() => setShowPomSettings(false)} style={{ flex: 1 }} size="small" />
                </View>
              </Card>
            )}

            <TouchableOpacity style={s.timerCircle} onPress={() => {
              setPomStudyVal(settings.pomodoroStudyTime.toString());
              setPomBreakVal(settings.pomodoroBreakTime.toString());
              setShowPomSettings(v => !v);
            }}>
              <Text style={s.timerText}>{formatTime(pomSeconds)}</Text>
              <Text style={s.timerLabel}>
                {pomState === 'idle' ? 'Ready' : pomState === 'studying' ? 'Focus' : 'Break'}
              </Text>
            </TouchableOpacity>

            {pomSessionCount > 0 && (
              <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>
                  {pomSessionCount} session{pomSessionCount > 1 ? 's' : ''} completed today
                </Text>
              </View>
            )}

            <View style={s.btnRow}>
              {pomState === 'idle' ? (
                <>
                  <Button title="Start Focus" onPress={startPomodoro} style={{ flex: 1 }} />
                  <Button
                    title="Break"
                    variant="secondary"
                    onPress={() => {
                      setPomState('break');
                      setActiveTimer('pomodoro', settings.pomodoroBreakTime * 60);
                    }}
                    style={{ flex: 1 }}
                  />
                </>
              ) : (
                <Button title="Pause" variant="secondary" onPress={pausePomodoro} style={{ flex: 1 }} />
              )}
              <Button title="Reset" variant="ghost" onPress={resetPomodoro} style={{ flex: 1 }} />
            </View>

            {/* History */}
            <SectionHeader title="Session History" />
            <View style={s.sortRow}>
              {(['recent', 'longest'] as const).map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setPomSort(opt)}
                  style={{
                    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
                    borderRadius: BorderRadius.full, borderWidth: 1,
                    backgroundColor: pomSort === opt ? colors.accentLight : 'transparent',
                    borderColor: pomSort === opt ? colors.accent : colors.border,
                  }}
                >
                  <Text style={{ color: pomSort === opt ? colors.accent : colors.textSecondary, fontSize: FontSize.sm }}>
                    {opt === 'recent' ? 'Most Recent' : 'Longest First'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {sortedHistory.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md }}>
                No sessions yet. Start your first focus block.
              </Text>
            ) : (
              sortedHistory.map(session => (
                <View key={session.id} style={[s.historyItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.sm }}>
                      {session.duration} min session
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>
                      {new Date(session.startTime).toLocaleDateString()} · {session.breakActivity || 'No break logged'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.accent, fontWeight: '700' }}>{session.duration}m</Text>
                </View>
              ))
            )}
          </>}
            {activeTab === 'detox' && <>

            <SectionHeader title="Set Duration" />
            <View style={s.durationRow}>
              {[
                { label: '30 min', secs: 1800 },
                { label: '1 hour', secs: 3600 },
                { label: '2 hours', secs: 7200 },
                { label: '4 hours', secs: 14400 },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => setDetoxTotalSeconds(opt.secs)}
                  style={{
                    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                    borderRadius: BorderRadius.sm, borderWidth: 1,
                    backgroundColor: detoxTotalSeconds === opt.secs ? colors.accentLight : 'transparent',
                    borderColor: detoxTotalSeconds === opt.secs ? colors.accent : colors.border,
                  }}
                >
                  <Text style={{ color: detoxTotalSeconds === opt.secs ? colors.accent : colors.text, fontWeight: '600' }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                value={detoxCustom}
                onChangeText={setDetoxCustom}
                placeholder="Custom minutes"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <Button
                title="Set"
                variant="secondary"
                size="small"
                onPress={() => {
                  const mins = parseInt(detoxCustom);
                  if (!isNaN(mins) && mins > 0) setDetoxTotalSeconds(mins * 60);
                }}
              />
            </View>

            <View style={{ alignItems: 'center', marginVertical: Spacing.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm }}>
                Selected: {Math.floor(detoxTotalSeconds / 60)} minutes
                {' · '}
                Earn {Math.floor(detoxTotalSeconds / 1800)} point{Math.floor(detoxTotalSeconds / 1800) !== 1 ? 's' : ''}
              </Text>
            </View>

            <Button
              title="Begin Detox"
              size="large"
              onPress={startDetox}
              style={{ marginBottom: Spacing.lg }}
            />

            {/* Detox History */}
            <SectionHeader title="Past Sessions" />
            {detoxHistory.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md }}>
                No detox sessions yet.
              </Text>
            ) : (
              detoxHistory.slice(0, 10).map(session => (
                <View key={session.id} style={[s.historyItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.sm }}>
                      {session.duration} min detox
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>
                      {new Date(session.startTime).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.accent, fontWeight: '700', fontSize: FontSize.md }}>
                      +{session.pointsEarned}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>pts</Text>
                  </View>
                </View>
              ))
            )}
          </>}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Mobile: Tab-based layout */}
      {!desktop && (
        <>
          {/* Tab Bar */}
          <View style={s.tabRow}>
            {(['alarm', 'pomodoro', 'detox'] as ClockTab[]).map(tab => (
              <TouchableOpacity key={tab} style={s.tab} onPress={() => setActiveTab(tab)}>
                <Text style={[s.tabText, { color: activeTab === tab ? colors.accent : colors.textSecondary }]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                {activeTab === tab && (
                  <View style={{ height: 2, width: 30, backgroundColor: colors.accent, marginTop: 4, borderRadius: 1 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* ── ALARM TAB ─────────────────────────────────────────── */}
            {activeTab === 'alarm' && (
              <>
                <SectionHeader title="Alarms" subtitle="Wake up informed, not reactive" />
                {alarms.map(alarm => (
                  <Card key={alarm.id}>
                    <View style={s.alarmRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.alarmTime}>{alarm.time}</Text>
                        <Text style={s.alarmLabel}>{alarm.label}</Text>
                        <Text style={[s.alarmLabel, { color: colors.accent }]}>
                          {VOICE_OPTIONS.find(opt => opt.value === alarm.voiceOption)?.label ?? alarm.voiceOption}
                        </Text>
                        <View style={s.dayRow}>
                          {DAYS.map((d, i) => (
                            <View key={i} style={[s.dayCircle, {
                              backgroundColor: alarm.days.includes(i) ? colors.accentLight : 'transparent',
                              borderColor: alarm.days.includes(i) ? colors.accent : colors.border,
                            }]}>
                              <Text style={{ fontSize: 9, color: alarm.days.includes(i) ? colors.accent : colors.textSecondary }}>
                                {d.slice(0, 1)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: Spacing.sm }}>
                        <Switch
                          value={alarm.enabled}
                          onValueChange={() => toggleAlarmEnabled(alarm.id)}
                          trackColor={{ false: colors.border, true: colors.accent }}
                          thumbColor="#FFF"
                        />
                        <TouchableOpacity onPress={() => startEditAlarm(alarm)}>
                          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>✎</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteAlarm(alarm.id)}>
                          <Text style={{ color: colors.danger, fontSize: 16 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                ))}

                <SectionHeader title={showAlarmForm ? 'Edit Alarm' : 'Add Alarm'} />
                {showAlarmForm ? (
                  <Card>
                    <TextInput
                      style={s.input}
                      value={alarmTime}
                      onChangeText={setAlarmTime}
                      placeholder="HH:MM (e.g. 07:30)"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numbers-and-punctuation"
                    />
                    <TextInput
                      style={s.input}
                      value={alarmLabel}
                      onChangeText={setAlarmLabel}
                      placeholder="Label (optional)"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.xs }}>REPEAT DAYS</Text>
                    <View style={s.dayRow}>
                      {DAYS.map((d, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => toggleAlarmDay(i)}
                          style={[s.dayCircle, {
                            backgroundColor: alarmDays.includes(i) ? colors.accentLight : 'transparent',
                            borderColor: alarmDays.includes(i) ? colors.accent : colors.border,
                          }]}
                        >
                          <Text style={{ fontSize: 10, color: alarmDays.includes(i) ? colors.accent : colors.textSecondary }}>
                            {d.slice(0, 2)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: Spacing.sm, marginBottom: Spacing.xs }}>
                      VOICE BRIEFING
                    </Text>
                    {VOICE_OPTIONS.map(opt => {
                      const selected = alarmVoices[0] === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => setAlarmVoices([opt.value])}
                          style={[s.voiceOpt, {
                            backgroundColor: selected ? colors.accentLight : 'transparent',
                            borderColor: selected ? colors.accent : colors.border,
                          }]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: selected ? colors.accent : colors.text, fontWeight: '600', fontSize: FontSize.sm }}>
                              {opt.label}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>{opt.desc}</Text>
                          </View>
                          {selected && (
                            <Text style={{ color: colors.accent, fontSize: 16 }}>✓</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                    <View style={[s.btnRow, { marginTop: Spacing.sm }]}>
                      <Button
                        title={editingAlarmId !== null ? 'Update Alarm' : 'Save Alarm'}
                        onPress={saveAlarm}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Cancel"
                        variant="ghost"
                        onPress={() => {
                          setShowAlarmForm(false);
                          resetAlarmForm();
                        }}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </Card>
                ) : (
                  <Button
                    title="+ Add Alarm"
                    variant="secondary"
                    onPress={() => {
                      resetAlarmForm();
                      setShowAlarmForm(true);
                    }}
                    style={{ marginTop: Spacing.sm }}
                  />
                )}
              </>
            )}

            {/* ── POMODORO TAB ──────────────────────────────────────── */}
            {activeTab === 'pomodoro' && (
              <>
                {/* SectionHeader with inline gear icon */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                  <SectionHeader
                    title="Pomodoro"
                    subtitle={`${settings.pomodoroStudyTime} min focus · ${settings.pomodoroBreakTime} min break`}
                  />
                </View>

                {/* Inline Pomodoro Settings Card */}
                {showPomSettings && (
                  <Card style={s.pomSettingsCard}>
                    <Text style={{ color: colors.text, fontWeight: '700', marginBottom: Spacing.sm, fontSize: FontSize.sm }}>
                      Timer Settings
                    </Text>
                    <View style={s.pomSettingsRow}>
                      <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, flex: 1 }}>Study time (min)</Text>
                      <TextInput
                        style={s.pomSettingsInput}
                        value={pomStudyVal}
                        onChangeText={setPomStudyVal}
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                    </View>
                    <View style={s.pomSettingsRow}>
                      <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, flex: 1 }}>Break time (min)</Text>
                      <TextInput
                        style={s.pomSettingsInput}
                        value={pomBreakVal}
                        onChangeText={setPomBreakVal}
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                    </View>
                    <View style={[s.btnRow, { marginTop: Spacing.xs, marginBottom: 0 }]}>
                      <Button title="Save" onPress={savePomSettings} style={{ flex: 1 }} size="small" />
                      <Button title="Cancel" variant="ghost" onPress={() => setShowPomSettings(false)} style={{ flex: 1 }} size="small" />
                    </View>
                  </Card>
                )}

                <TouchableOpacity
                  style={s.timerCircle}
                  onPress={() => {
                    setPomStudyVal(settings.pomodoroStudyTime.toString());
                    setPomBreakVal(settings.pomodoroBreakTime.toString());
                    setShowPomSettings(v => !v);
                  }}
                >
                  <Text style={s.timerText}>{formatTime(pomSeconds)}</Text>
                  <Text style={s.timerLabel}>
                    {pomState === 'idle' ? 'Ready' : pomState === 'studying' ? 'Focus' : 'Break'}
                  </Text>
                </TouchableOpacity>

                {pomSessionCount > 0 && (
                  <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>
                      {pomSessionCount} session{pomSessionCount > 1 ? 's' : ''} completed today
                    </Text>
                  </View>
                )}

                <View style={s.btnRow}>
                  {pomState === 'idle' ? (
                    <>
                      <Button title="Start Focus" onPress={startPomodoro} style={{ flex: 1 }} />
                      <Button
                        title="Break"
                        variant="secondary"
                        onPress={() => {
                          setPomState('break');
                          setActiveTimer('pomodoro', settings.pomodoroBreakTime * 60);
                        }}
                        style={{ flex: 1 }}
                      />
                    </>
                  ) : (
                    <Button title="Pause" variant="secondary" onPress={pausePomodoro} style={{ flex: 1 }} />
                  )}
                  <Button title="Reset" variant="ghost" onPress={resetPomodoro} style={{ flex: 1 }} />
                </View>

                <SectionHeader title="Session History" />
                <View style={s.sortRow}>
                  {(['recent', 'longest'] as const).map(opt => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setPomSort(opt)}
                      style={{
                        paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
                        borderRadius: BorderRadius.full, borderWidth: 1,
                        backgroundColor: pomSort === opt ? colors.accentLight : 'transparent',
                        borderColor: pomSort === opt ? colors.accent : colors.border,
                      }}
                    >
                      <Text style={{ color: pomSort === opt ? colors.accent : colors.textSecondary, fontSize: FontSize.sm }}>
                        {opt === 'recent' ? 'Most Recent' : 'Longest First'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {sortedHistory.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md }}>
                    No sessions yet. Start your first focus block.
                  </Text>
                ) : (
                  sortedHistory.map(session => (
                    <View key={session.id} style={[s.historyItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                      <View>
                        <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.sm }}>
                          {session.duration} min session
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>
                          {new Date(session.startTime).toLocaleDateString()} · {session.breakActivity || 'No break logged'}
                        </Text>
                      </View>
                      <Text style={{ color: colors.accent, fontWeight: '700' }}>{session.duration}m</Text>
                    </View>
                  ))
                )}
              </>
            )}

            {/* ── DETOX TAB ─────────────────────────────────────────── */}
            {activeTab === 'detox' && (
              <>
                <SectionHeader title="Phone Detox" subtitle="Intentional disconnection" />

                <SectionHeader title="Set Duration" />
                <View style={s.durationRow}>
                  {[
                    { label: '30 min', secs: 1800 },
                    { label: '1 hour', secs: 3600 },
                    { label: '2 hours', secs: 7200 },
                    { label: '4 hours', secs: 14400 },
                  ].map(opt => (
                    <TouchableOpacity
                      key={opt.label}
                      onPress={() => setDetoxTotalSeconds(opt.secs)}
                      style={{
                        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                        borderRadius: BorderRadius.sm, borderWidth: 1,
                        backgroundColor: detoxTotalSeconds === opt.secs ? colors.accentLight : 'transparent',
                        borderColor: detoxTotalSeconds === opt.secs ? colors.accent : colors.border,
                      }}
                    >
                      <Text style={{ color: detoxTotalSeconds === opt.secs ? colors.accent : colors.text, fontWeight: '600' }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
                  <TextInput
                    style={[s.input, { flex: 1, marginBottom: 0 }]}
                    value={detoxCustom}
                    onChangeText={setDetoxCustom}
                    placeholder="Custom minutes"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                  <Button
                    title="Set"
                    variant="secondary"
                    size="small"
                    onPress={() => {
                      const mins = parseInt(detoxCustom);
                      if (!isNaN(mins) && mins > 0) setDetoxTotalSeconds(mins * 60);
                    }}
                  />
                </View>

                <View style={{ alignItems: 'center', marginVertical: Spacing.md }}>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm }}>
                    Selected: {Math.floor(detoxTotalSeconds / 60)} minutes
                    {' · '}
                    Earn {Math.floor(detoxTotalSeconds / 1800)} point{Math.floor(detoxTotalSeconds / 1800) !== 1 ? 's' : ''}
                  </Text>
                </View>

                <Button
                  title="Begin Detox"
                  size="large"
                  onPress={startDetox}
                  style={{ marginBottom: Spacing.lg }}
                />

                {/* Detox History */}
                <SectionHeader title="Past Sessions" />
                {detoxHistory.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md }}>
                    No detox sessions yet.
                  </Text>
                ) : (
                  detoxHistory.slice(0, 10).map(session => (
                    <View key={session.id} style={[s.historyItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                      <View>
                        <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.sm }}>
                          {session.duration} min detox
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>
                          {new Date(session.startTime).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: colors.accent, fontWeight: '700', fontSize: FontSize.md }}>
                          +{session.pointsEarned}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>pts</Text>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}
