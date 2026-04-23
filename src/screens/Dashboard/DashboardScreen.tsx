import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionHeader from '../../components/SectionHeader';
import ProgressBar from '../../components/ProgressBar';
import LineGraph from '../../components/LineGraph';
import { Spacing, FontSize, BorderRadius } from '../../utils/theme';
import { CalendarEvent, RealWorldWin, JournalEntry, RelapseEntry } from '../../utils/types';
import { useScreenWidth, BREAKPOINTS } from '../../utils/responsive';
import { getData, setData } from '../../utils/storage';

type DashboardTab = 'habits' | 'calendar' | 'journals';
// Mobile-responsive day labels (short on small screens, full on larger)
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_SHORT = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── helpers ────────────────────────────────────────────────────────────────

function getToday(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Build weekly bar-chart data (last 7 days completion %)
function buildWeeklyData(habits: ReturnType<typeof useApp>['habits']): number[] {
  const days: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const good = habits.filter(h => h.type === 'good');
    if (good.length === 0) {
      days.push(0);
    } else {
      const completed = good.filter(h => h.completedDates.includes(dateStr)).length;
      days.push(Math.round((completed / good.length) * 100));
    }
  }
  return days;
}

function buildMonthlyData(habits: ReturnType<typeof useApp>['habits']): number[] {
  const weeks: number[] = [];
  const now = new Date();
  for (let w = 3; w >= 0; w--) {
    let total = 0;
    let count = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date();
      date.setDate(now.getDate() - w * 7 - d);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const good = habits.filter(h => h.type === 'good');
      if (good.length > 0) {
        const completed = good.filter(h => h.completedDates.includes(dateStr)).length;
        total += Math.round((completed / good.length) * 100);
        count++;
      }
    }
    weeks.push(count > 0 ? Math.round(total / count) : 0);
  }
  return weeks;
}

function buildYearlyData(habits: ReturnType<typeof useApp>['habits']): number[] {
  const months: number[] = [];
  const now = new Date();
  for (let m = 11; m >= 0; m--) {
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    let total = 0;
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const good = habits.filter(h => h.type === 'good');
      if (good.length > 0) {
        const completed = good.filter(h => h.completedDates.includes(dateStr)).length;
        total += Math.round((completed / good.length) * 100);
        count++;
      }
    }
    months.push(count > 0 ? Math.round(total / count) : 0);
  }
  return months;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// Stat card
function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  const { colors } = useApp();
  return (
    <View style={[statCardStyles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[statCardStyles.value, { color: accent }]}>{value}</Text>
      <Text style={[statCardStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const statCardStyles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: Spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    lineHeight: FontSize.xl * 1.2,
  },
  label: {
    fontSize: FontSize.xs,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: FontSize.xs * 1.4,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const {
    colors,
    habits,
    stats,
    calendarEvents,
    realWorldWins,
    relapseLog,
    journalEntries,
    addRealWorldWin,
    addRelapseEntry,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    toggleHabit: contextToggleHabit,
    addCalendarEvent,
    removeCalendarEvent,
    removeHabit,
    addHabit,
    updateHabit,
  } = useApp();

  const today = getToday();
  const now = new Date();

  // ── XP System Handler ──────────────────────────────────────────────────────
  const handleToggleHabit = (habitId: string, date: string) => {
    // Check if habit was completed before toggle
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const wasCompleted = habit.completedDates.includes(date);

    // Calculate completed good habits before and after toggle for tracking bonus
    const goodHabits = habits.filter(h => h.type === 'good');
    const completedBefore = goodHabits.filter(h => h.completedDates.includes(date)).length;
    const totalGoodHabits = goodHabits.length;
    const allCompletedBefore = completedBefore === totalGoodHabits && totalGoodHabits > 0;

    // Toggle the habit (contextToggleHabit handles ALL XP: ±1 per habit + ±2 bonus)
    contextToggleHabit(habitId, date);

    // Calculate completed good habits after the toggle for bonus state tracking
    const completedAfter = goodHabits.filter(h => {
      if (h.id === habitId) {
        // The habit we just toggled will have opposite status
        return !wasCompleted;
      }
      return h.completedDates.includes(date);
    }).length;
    const allCompletedAfter = completedAfter === totalGoodHabits && totalGoodHabits > 0;

    // Track bonus state locally (for UI purposes, XP is handled in AppContext)
    if (habit.type === 'good') {
      if (allCompletedAfter && !allCompletedBefore && !bonusEarnedToday) {
        // Just completed all habits for the first time today
        setBonusEarnedToday(true);
      } else if (!allCompletedAfter && allCompletedBefore && bonusEarnedToday) {
        // Breaking the all-complete state
        setBonusEarnedToday(false);
      }
    }
  };

  // ── Stats / Chart state ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<DashboardTab>('habits');
  const [chartTab, setChartTab] = useState<'Week' | 'Month' | 'Year'>('Week');
  const [bonusEarnedToday, setBonusEarnedToday] = useState(false);
  const [lastBonusDate, setLastBonusDate] = useState<string | null>(null);

  // Reset bonus state when day changes (fixed to handle edge cases at midnight)
  // Uses persistent timestamp instead of just date string to handle app restarts
  useEffect(() => {
    const resetBonusIfDateChanged = async () => {
      try {
        // Load last bonus date from storage
        const stored = await getData<string>('bonus_last_reset_date');

        // If no stored date or date has changed, reset bonus
        if (!stored || stored !== today) {
          // Save current date to storage for persistence across app restarts
          await setData('bonus_last_reset_date', today);
          setLastBonusDate(today);
          setBonusEarnedToday(false);
        } else {
          // Same day, check if bonus should be set based on completed habits
          const goodHabits = habits.filter(h => h.type === 'good');
          const completedToday = goodHabits.filter(h => h.completedDates.includes(today)).length;
          const allCompletedToday = completedToday === goodHabits.length && goodHabits.length > 0;

          setBonusEarnedToday(allCompletedToday);
          setLastBonusDate(today);
        }
      } catch (err) {
        // Fallback to non-persisted logic if storage fails
        if (lastBonusDate === null) {
          setLastBonusDate(today);
          const goodHabits = habits.filter(h => h.type === 'good');
          const completedToday = goodHabits.filter(h => h.completedDates.includes(today)).length;
          if (completedToday === goodHabits.length && goodHabits.length > 0) {
            setBonusEarnedToday(true);
          }
        } else if (lastBonusDate !== today) {
          setLastBonusDate(today);
          setBonusEarnedToday(false);
        }
      }
    };

    resetBonusIfDateChanged();
  }, [today, habits]);

  const weeklyData = useMemo(() => buildWeeklyData(habits), [habits]);
  const monthlyData = useMemo(() => buildMonthlyData(habits), [habits]);
  const yearlyData = useMemo(() => buildYearlyData(habits), [habits]);

  const chartData = chartTab === 'Week' ? weeklyData : chartTab === 'Month' ? monthlyData : yearlyData;
  const chartLabels = useMemo(() => {
    if (chartTab === 'Week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return DAY_LABELS[d.getDay()];
      });
    }
    if (chartTab === 'Month') {
      // Show actual date ranges for each week
      const weeks = [];
      for (let w = 3; w >= 0; w--) {
        const startDate = new Date();
        startDate.setDate(now.getDate() - w * 7);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        weeks.push(`${startDate.getMonth() + 1}/${startDate.getDate()}-${endDate.getDate()}`);
      }
      return weeks;
    }
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return MONTH_NAMES[d.getMonth()].slice(0, 3);
    });
  }, [chartTab]);

  // ── Calendar state ─────────────────────────────────────────────────────────
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventDate, setNewEventDate] = useState(today);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const eventDates = useMemo(
    () => new Set(calendarEvents.map(e => e.date)),
    [calendarEvents],
  );

  const selectedDayEvents = useMemo(
    () => (selectedDay ? calendarEvents.filter(e => e.date === selectedDay) : []),
    [calendarEvents, selectedDay],
  );

  function handlePrevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function handleNextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  function handleAddEvent() {
    if (!newEventTitle.trim()) return;
    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEventTitle.trim(),
      date: newEventDate,
      time: newEventTime.trim() || undefined,
    };
    addCalendarEvent(event);
    setNewEventTitle('');
    setNewEventTime('');
    setNewEventDate(today);
    setShowAddEventModal(false);
  }

  // ── Real World Wins state ──────────────────────────────────────────────────
  const [winsExpanded, setWinsExpanded] = useState(true);
  const [showAddWin, setShowAddWin] = useState(false);
  const [newWinText, setNewWinText] = useState('');

  function handleAddWin() {
    if (!newWinText.trim()) return;
    const win: RealWorldWin = {
      id: Date.now().toString(),
      text: newWinText.trim(),
      date: today,
    };
    addRealWorldWin(win);
    setNewWinText('');
    setShowAddWin(false);
  }

  // ── Relapse state ──────────────────────────────────────────────────────────
  const [relapseExpanded, setRelapseExpanded] = useState(false);
  const [showRelapseForm, setShowRelapseForm] = useState(false);
  const [relapseHabitId, setRelapseHabitId] = useState('');
  const [relapseHabitName, setRelapseHabitName] = useState('');
  const [relapseTrigger, setRelapseTrigger] = useState('');
  const [relapseLesson, setRelapseLesson] = useState('');
  const [relapseMicro, setRelapseMicro] = useState('');

  const badHabits = habits.filter(h => h.type === 'bad');

  function openRelapseForm(habitId: string, habitName: string) {
    setRelapseHabitId(habitId);
    setRelapseHabitName(habitName);
    setRelapseTrigger('');
    setRelapseLesson('');
    setRelapseMicro('');
    setShowRelapseForm(true);
    setRelapseExpanded(true);
  }

  function handleSubmitRelapse() {
    if (!relapseTrigger.trim() && !relapseLesson.trim()) return;
    const entry: RelapseEntry = {
      id: Date.now().toString(),
      habitId: relapseHabitId,
      habitName: relapseHabitName,
      trigger: relapseTrigger.trim(),
      lesson: relapseLesson.trim(),
      microHabitRetry: relapseMicro.trim() || undefined,
      date: today,
    };
    addRelapseEntry(entry);
    setShowRelapseForm(false);
    setRelapseTrigger('');
    setRelapseLesson('');
    setRelapseMicro('');
  }

  // ── Journal state ──────────────────────────────────────────────────────────
  const [journalExpanded, setJournalExpanded] = useState(false);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalHabitId, setJournalHabitId] = useState('');
  const [journalHabitName, setJournalHabitName] = useState('');
  const [journalText, setJournalText] = useState('');
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);

  const goodHabits = habits.filter(h => h.type === 'good');
  const completedGoodHabits = goodHabits.filter(h => h.completedDates.includes(today));

  function openJournalForm(habitId: string, habitName: string) {
    setJournalHabitId(habitId);
    setJournalHabitName(habitName);
    setJournalText('');
    setEditingJournalId(null);
    setShowJournalForm(true);
    setJournalExpanded(true);
  }

  function openJournalEdit(entry: JournalEntry) {
    setEditingJournalId(entry.id);
    setJournalHabitId(entry.habitId);
    setJournalHabitName(entry.habitName);
    setJournalText(entry.text);
    setShowJournalForm(true);
    setJournalExpanded(true);
  }

  function handleSubmitJournal() {
    if (!journalText.trim()) return;

    if (editingJournalId) {
      // Update existing entry
      updateJournalEntry(editingJournalId, { text: journalText.trim() });
    } else {
      // Create new entry
      const entry: JournalEntry = {
        id: Date.now().toString(),
        habitId: journalHabitId,
        habitName: journalHabitName,
        text: journalText.trim(),
        date: today,
      };
      addJournalEntry(entry);
    }

    setJournalText('');
    setEditingJournalId(null);
    setShowJournalForm(false);
  }

  function handleDeleteJournal(entryId: string) {
    Alert.alert('Delete Entry', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel' },
      { text: 'Delete', onPress: () => deleteJournalEntry(entryId), style: 'destructive' },
    ]);
  }

  // ── Edit Habits state ──────────────────────────────────────────────────────
  const [showEditHabits, setShowEditHabits] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState<'good' | 'bad'>('good');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editHabitName, setEditHabitName] = useState('');
  const [editHabitType, setEditHabitType] = useState<'good' | 'bad'>('good');

  function handleAddHabit() {
    if (!newHabitName.trim()) return;
    addHabit({
      id: Date.now().toString(),
      name: newHabitName.trim(),
      type: newHabitType,
      description: newHabitDescription.trim() || undefined,
      streak: 0,
      bestStreak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    });
    setNewHabitName('');
    setNewHabitType('good');
    setNewHabitDescription('');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const screenWidth = useScreenWidth();
  const desktop = screenWidth > BREAKPOINTS.tablet;
  const contentPadding = desktop ? Spacing.md : Spacing.sm;

  // 3-column responsive layout (desktop) + tab-based layout (mobile/tablet)
  const mainContent = desktop ? (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      {/* ━━ LEFT COLUMN: HABITS (Stats + Habits) ━━ */}
      <ScrollView
        style={[styles.scroll, { flex: 1, borderRightWidth: 1, borderRightColor: colors.border }]}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Column Header */}
        <View style={{ paddingHorizontal: contentPadding, paddingTop: contentPadding, paddingBottom: Spacing.xs }}>
          <SectionHeader title="Habits" subtitle={`${goodHabits.length} good · ${badHabits.length} bad`} />
        </View>

        {/* Stats row */}
        <View style={{ paddingHorizontal: contentPadding, paddingTop: Spacing.xs, paddingBottom: Spacing.sm }}>
          <View style={styles.statRow}>
            <StatCard label="XP" value={stats.xp} accent={colors.accent} />
            <StatCard label="Level" value={stats.level} accent={colors.success} />
            <StatCard label="Streak" value={`${stats.currentStreak}d`} accent={colors.warning} />
          </View>
        </View>

        {/* Good Habits */}
        <View style={{ paddingHorizontal: contentPadding, paddingTop: Spacing.sm, paddingBottom: Spacing.xs }}>
          <View style={styles.habitChecklistHeader}>
            <View style={styles.habitChecklistHeaderLeft}>
              <Text style={[styles.subsectionLabel, { color: colors.success }]}>Good Habits</Text>
            </View>
            <Button title="Edit" variant="ghost" size="small" onPress={() => setShowEditHabits(true)} />
          </View>
          <Card style={{ marginBottom: Spacing.md }}>
            {goodHabits.length === 0 && (
              <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No good habits yet. Add some!</Text>
            )}
            {goodHabits.map(habit => {
              const done = habit.completedDates.includes(today);
              return (
                <View key={habit.id} style={[styles.habitRow, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={() => handleToggleHabit(habit.id, today)}
                    style={[
                      styles.checkbox,
                      {
                        borderColor: colors.success,
                        backgroundColor: done ? colors.success : 'transparent',
                      },
                    ]}
                  >
                    {done && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                    <Text style={[styles.habitStreak, { color: colors.textSecondary }]}>
                      🔥 {habit.streak} day streak
                    </Text>
                  </View>
                  {done && (
                    <TouchableOpacity
                      onPress={() => openJournalForm(habit.id, habit.name)}
                      style={[styles.whyBtn, { borderColor: colors.accent }]}
                    >
                      <Text style={[styles.whyBtnText, { color: colors.accent }]}>Why?</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </Card>
        </View>

        {/* Bad Habits */}
        <View style={{ paddingHorizontal: contentPadding, paddingBottom: contentPadding }}>
          <View style={styles.habitChecklistHeader}>
            <View style={styles.habitChecklistHeaderLeft}>
              <Text style={[styles.subsectionLabel, { color: colors.danger }]}>Bad Habits</Text>
            </View>
            <Button title="Edit" variant="ghost" size="small" onPress={() => setShowEditHabits(true)} />
          </View>
          <Card style={{ marginBottom: Spacing.md }}>
            {badHabits.length === 0 && (
              <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No bad habits tracked yet.</Text>
            )}
            {badHabits.map(habit => {
              const avoided = habit.completedDates.includes(today);
              return (
                <View key={habit.id} style={[styles.habitRow, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={() => handleToggleHabit(habit.id, today)}
                    style={[styles.checkbox, { borderColor: avoided ? colors.danger : colors.textSecondary, backgroundColor: avoided ? colors.danger : 'transparent' }]}
                  >
                    {avoided && <Text style={styles.checkmark}>✗</Text>}
                  </TouchableOpacity>
                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                    <Text style={[styles.habitStreak, { color: colors.textSecondary }]}>
                      {avoided ? '⚠️ Marked today' : `${habit.streak} days avoided`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => openRelapseForm(habit.id, habit.name)} style={[styles.relapseBtn, { borderColor: colors.danger }]}>
                    <Text style={[styles.relapseBtnText, { color: colors.danger }]}>Relapsed</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </Card>
        </View>
      </ScrollView>

      {/* ━━ MIDDLE COLUMN: CALENDAR (Chart + Calendar) ━━ */}
      <ScrollView
        style={[styles.scroll, { flex: 1, borderRightWidth: 1, borderRightColor: colors.border }]}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Column Header */}
        <View style={{ paddingHorizontal: contentPadding, paddingTop: contentPadding, paddingBottom: Spacing.xs }}>
          <SectionHeader title="Calendar" subtitle="Progress & schedule" />
        </View>

        {/* Chart section */}
        <View style={{ paddingHorizontal: contentPadding, paddingTop: Spacing.xs, paddingBottom: Spacing.xs }}>
          <Card style={[styles.chartCard, { paddingBottom: Spacing.sm }]}>
            <View style={styles.tabRow}>
              {(['Week', 'Month', 'Year'] as const).map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setChartTab(tab)}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: chartTab === tab ? colors.accent : colors.surfaceLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: chartTab === tab ? '#1A1A1A' : colors.textSecondary },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.chartTitle, { color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: 2 }]}>
              Good-habit completion %
            </Text>
            <View style={[styles.graphContainer, { marginLeft: -Spacing.md, marginRight: -Spacing.md, marginBottom: -Spacing.md, marginTop: -3, height: 120 }]}>
              <LineGraph data={chartData} labels={chartLabels} paddingHorizontal={Spacing.md} />
            </View>
          </Card>
        </View>

        {/* Calendar */}
        <View style={{ paddingHorizontal: contentPadding, paddingTop: Spacing.xs, paddingBottom: contentPadding }}>
          <Card>
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn}>
                <Text style={[styles.calNavText, { color: colors.accent }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[styles.calMonthLabel, { color: colors.text }]}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
                <Text style={[styles.calNavText, { color: colors.accent }]}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calDayLabels}>
              {(screenWidth < 500 ? DAY_LABELS_SHORT : DAY_LABELS).map((d, i) => (
                <Text key={i} style={[styles.calDayLabel, { color: colors.textSecondary, fontSize: screenWidth < 500 ? FontSize.xs - 2 : FontSize.xs }]}>{d}</Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calCell} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateStr === today;
                const hasEvent = eventDates.has(dateStr);
                const isSelected = selectedDay === dateStr;
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedDay(isSelected ? null : dateStr)}
                    style={[
                      styles.calCell,
                      isToday && { backgroundColor: colors.accentLight },
                      isSelected && { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.calDayNum,
                        { color: isSelected ? '#1A1A1A' : isToday ? colors.accent : colors.text },
                      ]}
                    >
                      {day}
                    </Text>
                    {hasEvent && (
                      <View style={[styles.eventDot, { backgroundColor: isSelected ? '#1A1A1A' : colors.accent }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedDay && (
              <View style={[styles.selectedDayPanel, { borderTopColor: colors.border }]}>
                <Text style={[styles.selectedDayTitle, { color: colors.text }]}>
                  {formatDisplayDate(selectedDay)}
                </Text>
                {selectedDayEvents.length === 0 ? (
                  <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>
                    No events — tap "Add Event" to create one.
                  </Text>
                ) : (
                  selectedDayEvents.map(evt => (
                    <View key={evt.id} style={[styles.eventRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.eventRowInfo}>
                        {evt.time && <Text style={[styles.eventTime, { color: colors.accent }]}>{evt.time}</Text>}
                        <Text style={[styles.eventTitle, { color: colors.text }]}>{evt.title}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeCalendarEvent(evt.id)}>
                        <Text style={[styles.removeText, { color: colors.danger }]}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}

            <Button
              title="+ Add Event"
              variant="ghost"
              size="small"
              style={styles.addEventBtn}
              onPress={() => { setNewEventDate(selectedDay ?? today); setShowAddEventModal(true); }}
            />
          </Card>
        </View>
      </ScrollView>

      {/* ━━ RIGHT COLUMN: JOURNALS (Wins + Relapse + Journals) ━━ */}
      <ScrollView
        style={[styles.scroll, { flex: 1 }]}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Column Header */}
        <View style={{ paddingHorizontal: contentPadding, paddingTop: contentPadding, paddingBottom: Spacing.xs }}>
          <SectionHeader title="Journals" subtitle="Reflections & wins" />
        </View>

        {/* Real World Wins */}
        <View style={{ paddingHorizontal: contentPadding, paddingTop: Spacing.xs, paddingBottom: Spacing.xs }}>
          <Card style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: winsExpanded ? Spacing.md : 0 }}>
              <TouchableOpacity onPress={() => setWinsExpanded(!winsExpanded)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.sm }}>
                <Text style={[styles.subsectionLabel, { color: colors.success }]}>Real World Wins</Text>
                <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>({realWorldWins.length})</Text>
                <Text style={{ marginLeft: 'auto', color: colors.textSecondary, fontSize: 14 }}>
                  {winsExpanded ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {winsExpanded && (
                <Button title="+ Add" variant="ghost" size="small" onPress={() => setShowAddWin(true)} />
              )}
            </View>
            {winsExpanded && (
              <>
                {realWorldWins.length === 0 && (
                  <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No wins recorded yet. Celebrate your progress!</Text>
                )}
                {realWorldWins.slice(0, 3).map(win => (
                  <View key={win.id} style={[styles.winEntry, { borderLeftColor: colors.success }]}>
                    <Text style={[styles.winText, { color: colors.text }]}>{win.text}</Text>
                    <Text style={[styles.winDate, { color: colors.textSecondary }]}>{formatDisplayDate(win.date)}</Text>
                  </View>
                ))}
                {realWorldWins.length > 3 && (
                  <TouchableOpacity style={{ paddingTop: Spacing.sm, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text style={{ color: colors.accent, fontSize: FontSize.sm, textAlign: 'center' }}>
                      View All Wins ({realWorldWins.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Card>
        </View>

        {/* Relapse Recovery */}
        <View style={{ paddingHorizontal: contentPadding, paddingBottom: Spacing.xs }}>
          <Card style={{ marginBottom: Spacing.md }}>
            <TouchableOpacity onPress={() => setRelapseExpanded(!relapseExpanded)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: relapseExpanded ? Spacing.md : 0 }}>
              <Text style={[styles.subsectionLabel, { color: colors.danger }]}>Relapse Recovery</Text>
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>({relapseLog.length})</Text>
              <Text style={{ marginLeft: 'auto', color: colors.textSecondary, fontSize: 14 }}>
                {relapseExpanded ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            {relapseExpanded && (
              <>
                {relapseLog.length === 0 ? (
                  <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No relapses logged. Keep it up!</Text>
                ) : (
                  <>
                    {relapseLog.slice(0, 2).map(entry => (
                      <View key={entry.id} style={[styles.recoveryEntry, { borderLeftColor: colors.danger }]}>
                        <Text style={[styles.recoveryHabit, { color: colors.danger, fontWeight: '700' }]}>{entry.habitName}</Text>
                        <Text style={[styles.recoveryTrigger, { color: colors.textSecondary }]}>Trigger: {entry.trigger}</Text>
                        {entry.lesson && <Text style={[styles.recoveryLesson, { color: colors.text }]}>Lesson: {entry.lesson}</Text>}
                        <Text style={[styles.recoveryDate, { color: colors.textSecondary, fontSize: FontSize.xs }]}>{formatDisplayDate(entry.date)}</Text>
                      </View>
                    ))}
                    {relapseLog.length > 2 && (
                      <TouchableOpacity style={{ paddingTop: Spacing.sm, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <Text style={{ color: colors.accent, fontSize: FontSize.sm, textAlign: 'center' }}>
                          View History ({relapseLog.length})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </>
            )}
          </Card>
        </View>

        {/* Why Journals */}
        <View style={{ paddingHorizontal: contentPadding, paddingBottom: contentPadding }}>
          <Card>
            <TouchableOpacity onPress={() => setJournalExpanded(!journalExpanded)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: journalExpanded ? Spacing.md : 0 }}>
              <Text style={[styles.subsectionLabel, { color: colors.accent }]}>Why Journals</Text>
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>({journalEntries.length})</Text>
              <Text style={{ marginLeft: 'auto', color: colors.textSecondary, fontSize: 14 }}>
                {journalExpanded ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            {journalExpanded && (
              <>
                {journalEntries.length === 0 ? (
                  <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No journal entries yet. Tap "Why?" after completing a habit.</Text>
                ) : (
                  <>
                    {journalEntries.slice(0, 2).map(entry => (
                      <View key={entry.id} style={[styles.journalEntry, { borderLeftColor: colors.success }]}>
                        <View style={styles.journalEntryHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.journalEntryHabit, { color: colors.success }]}>{entry.habitName}</Text>
                            <Text style={[styles.relapseEntryDate, { color: colors.textSecondary }]}>{formatDisplayDate(entry.date)}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                            <TouchableOpacity onPress={() => openJournalEdit(entry)}>
                              <Text style={{ color: colors.accent, fontSize: 16 }}>✎</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteJournal(entry.id)}>
                              <Text style={{ color: colors.danger, fontSize: 16 }}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text style={[styles.journalEntryText, { color: colors.text }]}>{entry.text}</Text>
                      </View>
                    ))}
                    {journalEntries.length > 2 && (
                      <TouchableOpacity style={{ paddingTop: Spacing.sm, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <Text style={{ color: colors.accent, fontSize: FontSize.sm, textAlign: 'center' }}>
                          View All ({journalEntries.length})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </>
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  ) : (
    // ━━━━━━━━ MOBILE/TABLET: TAB-BASED LAYOUT ━━━━━━━━
    <>
      {/* Tab Bar */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {(['habits', 'calendar', 'journals'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: Spacing.md,
              borderBottomWidth: activeTab === tab ? 2 : 0,
              borderBottomColor: colors.accent,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                color: activeTab === tab ? colors.accent : colors.textSecondary,
                fontWeight: activeTab === tab ? '700' : '400',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { padding: contentPadding, paddingBottom: Spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ━━ HABITS TAB ━━ */}
        {activeTab === 'habits' && (
          <>
            <View style={styles.statRow}>
              <StatCard label="XP" value={stats.xp} accent={colors.accent} />
              <StatCard label="Level" value={stats.level} accent={colors.success} />
              <StatCard label="Streak" value={`${stats.currentStreak}d`} accent={colors.warning} />
            </View>

            {/* Good Habits */}
            <View style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>
              <View style={styles.habitChecklistHeader}>
                <View style={styles.habitChecklistHeaderLeft}>
                  <Text style={[styles.subsectionLabel, { color: colors.success }]}>Good Habits</Text>
                </View>
                <Button title="Edit" variant="ghost" size="small" onPress={() => setShowEditHabits(true)} />
              </View>
              <Card style={{ marginBottom: Spacing.md }}>
                {goodHabits.length === 0 && (
                  <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No good habits yet. Add some!</Text>
                )}
                {goodHabits.map(habit => {
                  const done = habit.completedDates.includes(today);
                  return (
                    <View key={habit.id} style={[styles.habitRow, { borderBottomColor: colors.border }]}>
                      <TouchableOpacity
                        onPress={() => handleToggleHabit(habit.id, today)}
                        style={[
                          styles.checkbox,
                          {
                            borderColor: colors.success,
                            backgroundColor: done ? colors.success : 'transparent',
                          },
                        ]}
                      >
                        {done && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                      <View style={styles.habitInfo}>
                        <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                        <Text style={[styles.habitStreak, { color: colors.textSecondary }]}>
                          🔥 {habit.streak} day streak
                        </Text>
                      </View>
                      {done && (
                        <TouchableOpacity
                          onPress={() => openJournalForm(habit.id, habit.name)}
                          style={[styles.whyBtn, { borderColor: colors.accent }]}
                        >
                          <Text style={[styles.whyBtnText, { color: colors.accent }]}>Why?</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </Card>
            </View>

            {/* Bad Habits */}
            <View style={{ marginBottom: Spacing.md }}>
              <View style={styles.habitChecklistHeader}>
                <View style={styles.habitChecklistHeaderLeft}>
                  <Text style={[styles.subsectionLabel, { color: colors.danger }]}>Bad Habits</Text>
                </View>
                <Button title="Edit" variant="ghost" size="small" onPress={() => setShowEditHabits(true)} />
              </View>
              <Card style={{ marginBottom: Spacing.md }}>
                {badHabits.length === 0 && (
                  <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No bad habits tracked yet.</Text>
                )}
                {badHabits.map(habit => {
                  const avoided = habit.completedDates.includes(today);
                  return (
                    <View key={habit.id} style={[styles.habitRow, { borderBottomColor: colors.border }]}>
                      <TouchableOpacity
                        onPress={() => handleToggleHabit(habit.id, today)}
                        style={[styles.checkbox, { borderColor: avoided ? colors.danger : colors.textSecondary, backgroundColor: avoided ? colors.danger : 'transparent' }]}
                      >
                        {avoided && <Text style={styles.checkmark}>✗</Text>}
                      </TouchableOpacity>
                      <View style={styles.habitInfo}>
                        <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                        <Text style={[styles.habitStreak, { color: colors.textSecondary }]}>
                          {avoided ? '⚠️ Marked today' : `${habit.streak} days avoided`}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => openRelapseForm(habit.id, habit.name)} style={[styles.relapseBtn, { borderColor: colors.danger }]}>
                        <Text style={[styles.relapseBtnText, { color: colors.danger }]}>Relapsed</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </Card>
            </View>
          </>
        )}

        {/* ━━ CALENDAR TAB ━━ */}
        {activeTab === 'calendar' && (
          <>
            {/* Graph */}
            <Card style={[styles.chartCard, { marginBottom: Spacing.md, paddingBottom: Spacing.sm }]}>
              <View style={styles.tabRow}>
                {(['Week', 'Month', 'Year'] as const).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setChartTab(tab)}
                    style={[styles.tab, { backgroundColor: chartTab === tab ? colors.accent : colors.surfaceLight }]}
                  >
                    <Text style={[styles.tabText, { color: chartTab === tab ? '#1A1A1A' : colors.textSecondary }]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.chartTitle, { color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: 2 }]}>Good-habit completion %</Text>
              <View style={[styles.graphContainer, { marginHorizontal: -Spacing.md, marginBottom: -Spacing.md, marginTop: -3, height: 120 }]}>
                <LineGraph data={chartData} labels={chartLabels} />
              </View>
            </Card>

            {/* Calendar */}
            <Card>
              <View style={styles.calHeader}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn}>
                  <Text style={[styles.calNavText, { color: colors.accent }]}>‹</Text>
                </TouchableOpacity>
                <Text style={[styles.calMonthLabel, { color: colors.text }]}>{MONTH_NAMES[calMonth]} {calYear}</Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
                  <Text style={[styles.calNavText, { color: colors.accent }]}>›</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.calDayLabels}>
                {(screenWidth < 500 ? DAY_LABELS_SHORT : DAY_LABELS).map((d, i) => (
                  <Text key={i} style={[styles.calDayLabel, { color: colors.textSecondary, fontSize: screenWidth < 500 ? FontSize.xs - 2 : FontSize.xs }]}>{d}</Text>
                ))}
              </View>
              <View style={styles.calGrid}>
                {Array.from({ length: firstDay }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.calCell} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === today;
                  const hasEvent = eventDates.has(dateStr);
                  const isSelected = selectedDay === dateStr;
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.calCell,
                        isToday && { backgroundColor: colors.accentLight },
                        isSelected && { borderWidth: 1, borderColor: colors.accent },
                      ]}
                      onPress={() => setSelectedDay(isSelected ? null : dateStr)}
                    >
                      <Text style={{ color: isToday ? colors.accent : colors.text, fontSize: FontSize.xs, fontWeight: isToday ? '700' : '400' }}>
                        {day}
                      </Text>
                      {hasEvent && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginTop: 2 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedDay && (
                <View style={{ marginTop: Spacing.md }}>
                  <Text style={{ color: colors.accent, fontWeight: '700', marginBottom: Spacing.xs }}>{formatDisplayDate(selectedDay)}</Text>
                  {selectedDayEvents.length === 0 ? (
                    <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No events — tap "Add Event" to create one.</Text>
                  ) : (
                    selectedDayEvents.map(evt => (
                      <View key={evt.id} style={[styles.eventRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.eventRowInfo}>
                          {evt.time && <Text style={[styles.eventTime, { color: colors.accent }]}>{evt.time}</Text>}
                          <Text style={[styles.eventTitle, { color: colors.text }]}>{evt.title}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeCalendarEvent(evt.id)}>
                          <Text style={[styles.removeText, { color: colors.danger }]}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}
              <Button title="+ Add Event" variant="ghost" size="small" style={styles.addEventBtn}
                onPress={() => { setNewEventDate(selectedDay ?? today); setShowAddEventModal(true); }} />
            </Card>
          </>
        )}

        {/* ━━ JOURNALS TAB ━━ */}
        {activeTab === 'journals' && (
          <>
            <Card style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: winsExpanded ? Spacing.md : 0 }}>
                <TouchableOpacity onPress={() => setWinsExpanded(!winsExpanded)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.sm }}>
                  <Text style={[styles.subsectionLabel, { color: colors.success }]}>Real World Wins</Text>
                  <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>({realWorldWins.length})</Text>
                  <Text style={{ marginLeft: 'auto', color: colors.textSecondary, fontSize: 14 }}>
                    {winsExpanded ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>
                {winsExpanded && (
                  <Button title="+ Add" variant="ghost" size="small" onPress={() => setShowAddWin(true)} />
                )}
              </View>
              {winsExpanded && (
                <>
                  {realWorldWins.length === 0 && (
                    <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No wins recorded yet. Celebrate your progress!</Text>
                  )}
                  {realWorldWins.slice(0, 3).map(win => (
                    <View key={win.id} style={[styles.winEntry, { borderLeftColor: colors.success }]}>
                      <Text style={[styles.winText, { color: colors.text }]}>{win.text}</Text>
                      <Text style={[styles.winDate, { color: colors.textSecondary }]}>{formatDisplayDate(win.date)}</Text>
                    </View>
                  ))}
                  {realWorldWins.length > 3 && (
                    <TouchableOpacity
                      style={{ paddingTop: Spacing.sm, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}
                    >
                      <Text style={{ color: colors.accent, fontSize: FontSize.sm, textAlign: 'center' }}>
                        View All Wins ({realWorldWins.length})
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </Card>

            <Card style={{ marginBottom: Spacing.md }}>
              <TouchableOpacity onPress={() => setRelapseExpanded(!relapseExpanded)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: relapseExpanded ? Spacing.md : 0 }}>
                <Text style={[styles.subsectionLabel, { color: colors.danger }]}>Relapse Recovery</Text>
                <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>({relapseLog.length})</Text>
                <Text style={{ marginLeft: 'auto', color: colors.textSecondary, fontSize: 14 }}>
                  {relapseExpanded ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {relapseExpanded && (
                <>
                  {relapseLog.length === 0 ? (
                    <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No relapses logged. Keep it up!</Text>
                  ) : (
                    <>
                      {relapseLog.slice(0, 2).map(entry => (
                        <View key={entry.id} style={[styles.recoveryEntry, { borderLeftColor: colors.danger }]}>
                          <Text style={[styles.recoveryHabit, { color: colors.danger, fontWeight: '700' }]}>{entry.habitName}</Text>
                          <Text style={[styles.recoveryTrigger, { color: colors.textSecondary }]}>Trigger: {entry.trigger}</Text>
                          {entry.lesson && <Text style={[styles.recoveryLesson, { color: colors.text }]}>Lesson: {entry.lesson}</Text>}
                          <Text style={[styles.recoveryDate, { color: colors.textSecondary, fontSize: FontSize.xs }]}>{formatDisplayDate(entry.date)}</Text>
                        </View>
                      ))}
                      {relapseLog.length > 2 && (
                        <TouchableOpacity
                          style={{ paddingTop: Spacing.sm, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}
                        >
                          <Text style={{ color: colors.accent, fontSize: FontSize.sm, textAlign: 'center' }}>
                            View History ({relapseLog.length})
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </>
              )}
            </Card>

            <Card>
              <TouchableOpacity onPress={() => setJournalExpanded(!journalExpanded)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: journalExpanded ? Spacing.md : 0 }}>
                <Text style={[styles.subsectionLabel, { color: colors.accent }]}>Why Journals</Text>
                <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>({journalEntries.length})</Text>
                <Text style={{ marginLeft: 'auto', color: colors.textSecondary, fontSize: 14 }}>
                  {journalExpanded ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {journalExpanded && (
                <>
                  {journalEntries.length === 0 ? (
                    <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No journal entries yet. Tap "Why?" after completing a habit.</Text>
                  ) : (
                    <>
                      {journalEntries.slice(0, 2).map(entry => (
                        <View key={entry.id} style={[styles.journalEntry, { borderLeftColor: colors.success }]}>
                          <View style={styles.journalEntryHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.journalEntryHabit, { color: colors.success }]}>{entry.habitName}</Text>
                              <Text style={[styles.relapseEntryDate, { color: colors.textSecondary }]}>{formatDisplayDate(entry.date)}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                              <TouchableOpacity onPress={() => openJournalEdit(entry)}>
                                <Text style={{ color: colors.accent, fontSize: 16 }}>✎</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteJournal(entry.id)}>
                                <Text style={{ color: colors.danger, fontSize: 16 }}>🗑️</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                          <Text style={[styles.journalEntryText, { color: colors.text }]}>{entry.text}</Text>
                        </View>
                      ))}
                      {journalEntries.length > 2 && (
                        <TouchableOpacity
                          style={{ paddingTop: Spacing.sm, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}
                        >
                          <Text style={{ color: colors.accent, fontSize: FontSize.sm, textAlign: 'center' }}>
                            View All ({journalEntries.length})
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RETURN (Render with modals)
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {mainContent}

      {/* ── ADD EVENT MODAL ────────────────────────────────────────────────── */}
      <Modal
        visible={showAddEventModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Calendar Event</Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title *</Text>
            <TextInput
              placeholder="Event title"
              placeholderTextColor={colors.textSecondary}
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              accessibilityLabel="Event title input"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date (YYYY-MM-DD)</Text>
            <TextInput
              placeholder={today}
              placeholderTextColor={colors.textSecondary}
              value={newEventDate}
              onChangeText={setNewEventDate}
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              accessibilityLabel="Event date input, format YYYY-MM-DD"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Time (HH:MM, optional)</Text>
            <TextInput
              placeholder="e.g. 09:30"
              placeholderTextColor={colors.textSecondary}
              value={newEventTime}
              onChangeText={setNewEventTime}
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              accessibilityLabel="Event time input, optional, format HH:MM"
            />

            <View style={styles.formButtonRow}>
              <Button
                title="Add Event"
                variant="primary"
                size="small"
                onPress={handleAddEvent}
                style={styles.formBtnFlex}
              />
              <Button
                title="Cancel"
                variant="ghost"
                size="small"
                onPress={() => setShowAddEventModal(false)}
                style={styles.formBtnFlex}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── JOURNAL FORM MODAL ───────────────────────────────────────────── */}
      <Modal
        visible={showJournalForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJournalForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingJournalId ? '✏️ Edit Entry' : 'Why did you do it? 💪'}
            </Text>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Habit: <Text style={{ color: colors.accent, fontWeight: '700' }}>{journalHabitName}</Text>
            </Text>
            <TextInput
              placeholder="What motivated you? How did it make you feel?"
              placeholderTextColor={colors.textSecondary}
              value={journalText}
              onChangeText={setJournalText}
              multiline
              numberOfLines={4}
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, minHeight: 100, textAlignVertical: 'top' }]}
              accessibilityLabel="Journal entry textarea, describe what motivated you and how it made you feel"
            />
            <View style={styles.formButtonRow}>
              <Button
                title={editingJournalId ? 'Update' : 'Save'}
                variant="primary"
                size="small"
                onPress={handleSubmitJournal}
                style={styles.formBtnFlex}
              />
              <Button
                title="Cancel"
                variant="ghost"
                size="small"
                onPress={() => {
                  setShowJournalForm(false);
                  setEditingJournalId(null);
                  setJournalText('');
                }}
                style={styles.formBtnFlex}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── RELAPSE FORM MODAL ────────────────────────────────────────────── */}
      <Modal
        visible={showRelapseForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRelapseForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Relapse Recovery 🔄</Text>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Habit: <Text style={{ color: colors.danger, fontWeight: '700' }}>{relapseHabitName}</Text>
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>What triggered it? *</Text>
            <TextInput
              placeholder="e.g. stress, boredom, social pressure…"
              placeholderTextColor={colors.textSecondary}
              value={relapseTrigger}
              onChangeText={setRelapseTrigger}
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              accessibilityLabel="Relapse trigger input, describe what caused the relapse"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>What did you learn? *</Text>
            <TextInput
              placeholder="e.g. I need to avoid X situation…"
              placeholderTextColor={colors.textSecondary}
              value={relapseLesson}
              onChangeText={setRelapseLesson}
              multiline
              numberOfLines={3}
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' }]}
              accessibilityLabel="Relapse lesson textarea, describe what you learned from this relapse"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Micro-habit to retry (optional)</Text>
            <TextInput
              placeholder="One tiny step for next time…"
              placeholderTextColor={colors.textSecondary}
              value={relapseMicro}
              onChangeText={setRelapseMicro}
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              accessibilityLabel="Micro-habit input, optional, describe a tiny step to try next time"
            />

            <View style={styles.formButtonRow}>
              <Button
                title="Save"
                variant="primary"
                size="small"
                onPress={handleSubmitRelapse}
                style={styles.formBtnFlex}
              />
              <Button
                title="Cancel"
                variant="ghost"
                size="small"
                onPress={() => setShowRelapseForm(false)}
                style={styles.formBtnFlex}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── ADD WIN MODAL ─────────────────────────────────────────────────── */}
      <Modal
        visible={showAddWin}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddWin(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add a Real World Win 🏆</Text>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>What did you accomplish?</Text>
            <TextInput
              placeholder="e.g. went for a run, cooked a healthy meal…"
              placeholderTextColor={colors.textSecondary}
              value={newWinText}
              onChangeText={setNewWinText}
              multiline
              numberOfLines={3}
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' }]}
              accessibilityLabel="Real world win textarea, describe what you accomplished"
            />
            <View style={styles.formButtonRow}>
              <Button
                title="Add Win"
                variant="primary"
                size="small"
                onPress={handleAddWin}
                style={styles.formBtnFlex}
              />
              <Button
                title="Cancel"
                variant="ghost"
                size="small"
                onPress={() => setShowAddWin(false)}
                style={styles.formBtnFlex}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── EDIT HABITS MODAL ────────────────────────────────────────────── */}
      <Modal
        visible={showEditHabits}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditHabits(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, styles.editHabitsModalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Modal header */}
            <View style={styles.editHabitsHeader}>
              <Text style={[styles.modalTitle, styles.editHabitsTitle, { color: colors.text }]}>
                Edit Habits
              </Text>
              <TouchableOpacity
                onPress={() => setShowEditHabits(false)}
                style={styles.editHabitsCloseBtn}
              >
                <Text style={{ color: colors.text, fontSize: 24 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editHabitsScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Habit list */}
              {habits.length === 0 && (
                <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>
                  No habits yet. Add one below!
                </Text>
              )}
              {habits.map(habit => (
                <View
                  key={habit.id}
                  style={[styles.editHabitRow, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.editHabitInfo}>
                    <Text style={[styles.editHabitName, { color: colors.text }]} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <View style={styles.editHabitMeta}>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: habit.type === 'good' ? colors.success : colors.danger },
                        ]}
                      >
                        <Text style={styles.typeBadgeText}>
                          {habit.type === 'good' ? 'GOOD' : 'BAD'}
                        </Text>
                      </View>
                      <Text style={[styles.editHabitStreak, { color: colors.textSecondary }]}>
                        🔥 {habit.streak} streak
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingHabitId(habit.id);
                      setEditHabitName(habit.name);
                      setEditHabitType(habit.type);
                    }}
                    style={styles.deleteHabitBtn}
                  >
                    <Text style={{ color: colors.accent, fontSize: 18 }}>✎</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Habit form */}
              <View style={[styles.addHabitForm, { borderTopColor: colors.border }]}>
                <Text style={[styles.addHabitFormTitle, { color: colors.text }]}>Add Habit</Text>

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name *</Text>
                <TextInput
                  placeholder="e.g. Morning run"
                  placeholderTextColor={colors.textSecondary}
                  value={newHabitName}
                  onChangeText={setNewHabitName}
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  accessibilityLabel="Habit name input"
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Type</Text>
                <View style={styles.habitTypeToggleRow}>
                  <Text style={[styles.habitTypeLabel, { color: newHabitType === 'good' ? colors.success : colors.textSecondary }]}>
                    Good
                  </Text>
                  <Switch
                    value={newHabitType === 'bad'}
                    onValueChange={val => setNewHabitType(val ? 'bad' : 'good')}
                    trackColor={{ false: colors.success, true: colors.danger }}
                    thumbColor="#FFFFFF"
                    style={styles.habitTypeSwitch}
                  />
                  <Text style={[styles.habitTypeLabel, { color: newHabitType === 'bad' ? colors.danger : colors.textSecondary }]}>
                    Bad
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description (optional)</Text>
                <TextInput
                  placeholder="Brief description…"
                  placeholderTextColor={colors.textSecondary}
                  value={newHabitDescription}
                  onChangeText={setNewHabitDescription}
                  multiline
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  accessibilityLabel="Habit description input, optional"
                />

                <Button
                  title="Save Habit"
                  variant="primary"
                  size="small"
                  onPress={handleAddHabit}
                  style={styles.saveHabitBtn}
                />
              </View>

              {/* Edit Habit form */}
              {editingHabitId && (
                <View style={[styles.addHabitForm, { borderTopColor: colors.border, marginTop: Spacing.lg }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                    <Text style={[styles.addHabitFormTitle, { color: colors.text }]}>Edit Habit</Text>
                    <TouchableOpacity onPress={() => setEditingHabitId(null)}>
                      <Text style={{ color: colors.textSecondary, fontSize: 20 }}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name *</Text>
                  <TextInput
                    placeholder="e.g. Morning run"
                    placeholderTextColor={colors.textSecondary}
                    value={editHabitName}
                    onChangeText={setEditHabitName}
                    style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  />

                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Type</Text>
                  <View style={styles.habitTypeToggleRow}>
                    <Text style={[styles.habitTypeLabel, { color: editHabitType === 'good' ? colors.success : colors.textSecondary }]}>
                      Good
                    </Text>
                    <Switch
                      value={editHabitType === 'bad'}
                      onValueChange={val => setEditHabitType(val ? 'bad' : 'good')}
                      trackColor={{ false: colors.success, true: colors.danger }}
                      thumbColor="#FFFFFF"
                      style={styles.habitTypeSwitch}
                    />
                    <Text style={[styles.habitTypeLabel, { color: editHabitType === 'bad' ? colors.danger : colors.textSecondary }]}>
                      Bad
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
                    <Button
                      title="Update"
                      variant="primary"
                      size="small"
                      onPress={() => {
                        if (editHabitName.trim() && editingHabitId) {
                          updateHabit(editingHabitId, { name: editHabitName.trim(), type: editHabitType });
                          setEditingHabitId(null);
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Delete"
                      variant="ghost"
                      size="small"
                      onPress={() => {
                        if (editingHabitId) {
                          removeHabit(editingHabitId);
                          setEditingHabitId(null);
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Split-pane panels
  leftPanel: {
    flex: 0.5,
    backgroundColor: 'transparent',
  },
  rightPanel: {
    flex: 0.5,
    backgroundColor: 'transparent',
  },

  // Stats
  statRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  chartCard: {
    marginBottom: Spacing.sm,
  },
  graphContainer: {
    overflow: 'hidden',
    borderRadius: BorderRadius.sm,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  chartTitle: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },

  // Habit Checklist header row
  habitChecklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  habitChecklistHeaderLeft: {
    flex: 1,
  },

  // Habit cards container - responsive layout
  habitCardsRow: {
    flexDirection: 'column',
    marginBottom: Spacing.sm,
  },

  // Quick stats card (right panel)
  quickStatsCard: {
    marginBottom: Spacing.sm,
  },
  quickStatRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  quickStatLabel: {
    fontSize: FontSize.xs,
  },

  // Journal entry compact (right panel)
  journalEntryCompact: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },

  // Real World Wins section
  winEntry: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  winText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  winDate: {
    fontSize: FontSize.xs,
  },

  // Relapse Recovery section
  recoveryEntry: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  recoveryHabit: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  recoveryTrigger: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },
  recoveryLesson: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
    fontStyle: 'italic',
  },
  recoveryDate: {
    marginTop: Spacing.xs,
  },

  // Habits
  subsectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    marginBottom: Spacing.xs,
    marginTop: 0,
    textTransform: 'uppercase',
    letterSpacing: 1,
    lineHeight: FontSize.sm * 1.3,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkmark: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    lineHeight: FontSize.md * 1.4,
  },
  habitStreak: {
    fontSize: FontSize.xs,
    marginTop: 4,
    lineHeight: FontSize.xs * 1.4,
  },
  whyBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginLeft: Spacing.xs,
  },
  whyBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  relapseBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginLeft: Spacing.xs,
  },
  relapseBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // Calendar
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  calNavBtn: {
    padding: Spacing.xs,
  },
  calNavText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    lineHeight: 26,
  },
  calMonthLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  calDayLabels: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  calDayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
  },
  calDayNum: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  selectedDayPanel: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  selectedDayTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  eventRowInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  eventTime: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    minWidth: 40,
  },
  eventTitle: {
    fontSize: FontSize.sm,
    flex: 1,
  },
  removeText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    paddingHorizontal: Spacing.xs,
  },
  addEventBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },

  // Collapsible
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  collapsibleTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  collapsibleCount: {
    fontSize: FontSize.sm,
  },

  // Wins (list row variant)
  winRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },

  // Relapse
  relapseIntro: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  relapseEntry: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  relapseEntryHabit: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  relapseEntryDate: {
    fontSize: FontSize.xs,
    marginBottom: 4,
  },
  relapseEntryText: {
    fontSize: FontSize.sm,
    lineHeight: 18,
  },

  // Journal
  journalEntry: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  journalEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  journalEntryHabit: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  journalEntryText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  // Shared form elements
  habitPillBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
    alignSelf: 'flex-start',
  },
  habitPillText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    minHeight: 44,
    marginBottom: Spacing.xs,
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  formBtnFlex: {
    flex: 1,
  },
  emptyNote: {
    fontSize: FontSize.sm,
    fontStyle: 'italic',
    paddingVertical: Spacing.xs,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },

  // Edit Habits Modal
  editHabitsModalBox: {
    maxHeight: '85%',
    paddingBottom: Spacing.lg,
  },
  editHabitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  editHabitsTitle: {
    marginBottom: 0,
  },
  editHabitsCloseBtn: {
    padding: Spacing.xs,
  },
  editHabitsScroll: {
    flexGrow: 0,
  },
  editHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  editHabitInfo: {
    flex: 1,
  },
  editHabitName: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  editHabitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  typeBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  editHabitStreak: {
    fontSize: FontSize.xs,
  },
  deleteHabitBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  addHabitForm: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  addHabitFormTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  habitTypeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  habitTypeLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  habitTypeSwitch: {
    marginHorizontal: Spacing.xs,
  },
  saveHabitBtn: {
    marginTop: Spacing.sm,
  },

  bottomPad: {
    height: Spacing.xl,
  },
});
