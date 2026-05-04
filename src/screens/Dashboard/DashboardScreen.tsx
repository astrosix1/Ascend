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
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionHeader from '../../components/SectionHeader';
import ProgressBar from '../../components/ProgressBar';
import LineGraph from '../../components/LineGraph';
import { Spacing, FontSize, BorderRadius } from '../../utils/theme';
import { CalendarEvent, RealWorldWin, JournalEntry, RelapseEntry, GoalEntry, Todo } from '../../utils/types';
import { useScreenWidth, BREAKPOINTS } from '../../utils/responsive';
import { getData, setData } from '../../utils/storage';
import { TEMPTATION_ADVICE, getRandomAdviceForHabit } from '../../data/temptationAdvice';
import DailyProgressRing from '../../components/DailyProgressRing';

type DashboardTab = 'habits' | 'progress' | 'calendar' | 'journals';
// Mobile-responsive day labels (short on small screens, full on larger)
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_SHORT = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Motivation quotes for daily inspiration (v2.1)
const MOTIVATION_QUOTES = [
  '🔥 Every day is a chance to build a better you.',
  '💪 Small steps lead to big changes.',
  '🎯 You\'re stronger than you think.',
  '✨ Progress over perfection.',
  '🚀 Consistency beats intensity.',
  '🏆 Your future self is watching you right now.',
  '💡 You don\'t have to be great to start. You have to start to be great.',
  '⚡ The only way to do great work is to love what you do.',
  '🌟 You are capable of amazing things.',
  '💥 Success is the sum of small efforts.',
  '🎪 Believe you can and you\'re halfway there.',
  '🔑 Your time is limited, don\'t waste it.',
  '💎 Habits are the compound interest of self-improvement.',
  '🌱 Plant seeds of good habits; reap harvests of success.',
  '🎯 One small habit, done consistently, changes everything.',
  '✅ You\'ve got this. Keep going.',
  '🌈 Every habit is a vote for the person you want to be.',
  '⭐ Your consistency will astonish you.',
  '🔔 The secret of getting ahead is getting started.',
  '🎨 You are the artist of your own life.',
  '💪 Progress requires effort. You are not afraid of effort.',
  '🎁 Today is a gift. That\'s why it\'s called the present.',
  '🌍 Change your habits, change your world.',
  '🔥 Be so good they can\'t ignore you.',
  '📈 Track it, build it, own it.',
  '🏅 Champion habits create champion results.',
  '🎯 Focus on the process, trust the progress.',
  '⚙️ Systems are the solution.',
  '🌟 You are one habit away from a different life.',
  '💖 Fall in love with the process, not just the result.',
  '🚀 Dream big, start small, act now.',
  '🎪 Make it easy, make it obvious, make it attractive.',
  '🌸 Bloom where you are planted.',
  '⚡ Energy and enthusiasm are fuel.',
  '🎯 Be the energy you want to attract.',
  '💫 Your vibe attracts your tribe.',
  '🏆 Show up for yourself, always.',
  '✨ You are worthy of your own effort.',
  '🔥 Discipline is choosing between what you want now and what you want most.',
  '🌟 Every morning is a new opportunity.',
  // Subscription-focused quotes (motivate users to cancel streaming services, etc.)
  '🎬 Netflix costs money. You cost more. Invest in yourself.',
  '💰 That subscription? Cancel it. Invest those hours in building real skills.',
  '📺 Streaming services are designed to keep you scrolling. Break free.',
  '🎮 Cancel the subscription. Your time is your most valuable asset.',
  '☕ Every subscription cancelled = more time for habits that matter.',
  '💪 Quit paying for entertainment. Create your own story instead.',
  '📚 One hour of Netflix = One chapter of a book you\'ve always wanted to read.',
  '🎯 The best entertainment is becoming the best version of yourself.',
  '✨ Stop consuming. Start creating. Cancel that subscription.',
  '🌟 What if you spent that subscription money on yourself instead?',
  '🚀 Replace streaming with dreaming. What\'s your real goal?',
  '💡 That show will be there tomorrow. Your goals won\'t wait.',
  '🏆 Replace passive scrolling with active progress.',
  '🔥 Your favorite series doesn\'t love you back. But your goals do.',
  '⚡ Unsubscribe from distraction. Subscribe to your own growth.',
  '🎨 The world needs your talent, not another viewer statistic.',
  '💎 Real binge-watching? Watching yourself transform.',
  '🌈 Life is the greatest series. And you\'re the protagonist.',
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

// Get consistent daily motivation quote
function getQuoteForDay(date: string): string {
  const seed = parseInt(date.replace(/-/g, ''));
  return MOTIVATION_QUOTES[seed % MOTIVATION_QUOTES.length];
}

// Get daily habit completion level (0-3) for calendar heatmap
// Returns: 0=no activity, 1=1-2 habits, 2=3+ habits, 3=all good habits completed
function getDailyCompletionLevel(date: string, habits: any[]): number {
  const goodHabits = habits.filter(h => h.type === 'good');
  if (goodHabits.length === 0) return 0;

  const completedCount = goodHabits.filter(h => h.completedDates.includes(date)).length;

  if (completedCount === 0) return 0;
  if (completedCount === goodHabits.length) return 3; // Perfect day
  if (completedCount >= 3) return 2; // Most habits
  return 1; // Some habits
}

// Calculate completion rate for a habit
function getHabitCompletionRate(habit: { completedDates: string[]; createdAt: string }): number {
  const daysSinceCreated = Math.max(1,
    Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / (24 * 60 * 60 * 1000))
  );
  return Math.round((habit.completedDates.length / daysSinceCreated) * 100);
}

// Calculate week statistics
function calculateWeekStats(habits: any[], today: string) {
  const weekAgo = new Date(new Date(today).getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;

  const goodHabits = habits.filter(h => h.type === 'good');
  const badHabits = habits.filter(h => h.type === 'bad');

  const goodCompleted = goodHabits.reduce((count, habit) => {
    return count + habit.completedDates.filter((d: string) => d >= weekAgoStr && d <= today).length;
  }, 0);

  const badAvoided = badHabits.filter(h => !h.completedDates.includes(today)).length;

  const goodDays = goodHabits.length * 7;
  const completionRate = goodDays > 0 ? Math.round((goodCompleted / goodDays) * 100) : 0;

  return { completedCount: goodCompleted, completionRate, avoidedBadCount: badAvoided };
}

// Calculate month statistics
function calculateMonthStats(habits: any[], today: string) {
  const monthAgo = new Date(new Date(today).getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthAgoStr = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, '0')}-${String(monthAgo.getDate()).padStart(2, '0')}`;

  const goodHabits = habits.filter(h => h.type === 'good');
  const badHabits = habits.filter(h => h.type === 'bad');

  const goodCompleted = goodHabits.reduce((count, habit) => {
    return count + habit.completedDates.filter((d: string) => d >= monthAgoStr && d <= today).length;
  }, 0);

  const badAvoided = badHabits.filter(h => !h.completedDates.includes(today)).length;

  const goodDays = goodHabits.length * 30;
  const completionRate = goodDays > 0 ? Math.round((goodCompleted / goodDays) * 100) : 0;

  return { completedCount: goodCompleted, completionRate, avoidedBadCount: badAvoided };
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

function buildCumulativeWeeklyData(habits: ReturnType<typeof useApp>['habits']): number[] {
  const days: number[] = [];
  let cumulativeTotal = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const good = habits.filter(h => h.type === 'good');
    const completed = good.filter(h => h.completedDates.includes(dateStr)).length;
    cumulativeTotal += completed;
    days.push(cumulativeTotal);
  }
  return days;
}

function buildCumulativeMonthlyData(habits: ReturnType<typeof useApp>['habits']): number[] {
  const weeks: number[] = [];
  const now = new Date();
  let cumulativeTotal = 0;
  for (let w = 3; w >= 0; w--) {
    let weekTotal = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date();
      date.setDate(now.getDate() - w * 7 - d);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const good = habits.filter(h => h.type === 'good');
      const completed = good.filter(h => h.completedDates.includes(dateStr)).length;
      weekTotal += completed;
    }
    cumulativeTotal += weekTotal;
    weeks.push(cumulativeTotal);
  }
  return weeks;
}

function buildCumulativeYearlyData(habits: ReturnType<typeof useApp>['habits']): number[] {
  const months: number[] = [];
  const now = new Date();
  let cumulativeTotal = 0;
  for (let m = 11; m >= 0; m--) {
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    let monthTotal = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const good = habits.filter(h => h.type === 'good');
      const completed = good.filter(h => h.completedDates.includes(dateStr)).length;
      monthTotal += completed;
    }
    cumulativeTotal += monthTotal;
    months.push(cumulativeTotal);
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
  const navigation = useNavigation<any>();
  const {
    colors,
    habits,
    stats,
    settings,
    updateSettings,
    calendarEvents,
    realWorldWins,
    relapseLog,
    journalEntries,
    goals,
    addRealWorldWin,
    addRelapseEntry,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    addGoal,
    updateGoal,
    deleteGoal,
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    toggleHabit: contextToggleHabit,
    addCalendarEvent,
    removeCalendarEvent,
    removeHabit,
    addHabit,
    updateHabit,
    addXP,
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
  // Unified tab state for mobile/desktop persistence
  const [currentTab, setCurrentTab] = useState<'today' | 'progress' | 'journals' | 'calendar'>('today');
  // Derived activeTab for display purposes (maps 'today' to 'habits' in UI)
  const activeTab = currentTab === 'today' ? 'habits' : currentTab;
  const [chartTab, setChartTab] = useState<'Week' | 'Month' | 'Year'>('Week');
  const [bonusEarnedToday, setBonusEarnedToday] = useState(false);
  const [lastBonusDate, setLastBonusDate] = useState<string | null>(null);
  const [lastBadHabitXpDate, setLastBadHabitXpDate] = useState<string | null>(null);

  // ── Analytics & gamification state ──────────────────────────────────────────
  const [summaryMode, setSummaryMode] = useState<'week' | 'month'>('week');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHabitHistory, setShowHabitHistory] = useState(false);
  const [selectedHabitForHistory, setSelectedHabitForHistory] = useState<string | null>(null);
  const [historyDateFilter, setHistoryDateFilter] = useState<'week' | 'month' | 'all'>('all');

  // ── Sidebar state ──
  // dashboardCategory is now derived from currentTab
  const dashboardCategory = currentTab;
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Reset bonus state when day changes (fixed to handle edge cases at midnight)
  // Uses persistent timestamp instead of just date string to handle app restarts
  // Also awards 1 XP for each unchecked bad habit at day end
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

          // Award 1 XP for each avoided (unchecked) bad habit
          const badHabits = habits.filter(h => h.type === 'bad');
          const avoidedCount = badHabits.filter(h => !h.completedDates.includes(today)).length;
          if (avoidedCount > 0) {
            // Award 1 XP for each avoided bad habit
            addXP(avoidedCount);
          }
          // Mark that we've awarded bad habit XP for today
          await setData('bad_habit_xp_date', today);
          setLastBadHabitXpDate(today);
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

  // ── Keyboard shortcuts: 1=Today 2=Progress 3=Journals 4=Calendar; Arrow keys for mobile tab nav ──────────
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;

      // Number shortcuts for desktop category navigation
      if (e.key === '1') setCurrentTab('today');
      if (e.key === '2') setCurrentTab('progress');
      if (e.key === '3') setCurrentTab('journals');
      if (e.key === '4') { setCurrentTab('calendar'); if (!selectedDay) setSelectedDay(today); }

      // Arrow keys for mobile tab navigation (Left = previous, Right = next)
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentTab(prev => {
          if (prev === 'today') return 'progress';
          if (prev === 'progress') return 'journals';
          if (prev === 'journals') return 'calendar';
          return 'today';
        });
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTab(prev => {
          if (prev === 'today') return 'calendar';
          if (prev === 'calendar') return 'journals';
          if (prev === 'journals') return 'progress';
          if (prev === 'progress') return 'today';
          return 'today';
        });
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [today, selectedDay]);

  const weeklyData = useMemo(() => buildWeeklyData(habits), [habits]);
  const monthlyData = useMemo(() => buildMonthlyData(habits), [habits]);
  const yearlyData = useMemo(() => buildYearlyData(habits), [habits]);
  const cumulativeWeeklyData = useMemo(() => buildCumulativeWeeklyData(habits), [habits]);
  const cumulativeMonthlyData = useMemo(() => buildCumulativeMonthlyData(habits), [habits]);
  const cumulativeYearlyData = useMemo(() => buildCumulativeYearlyData(habits), [habits]);

  const chartData = chartTab === 'Week' ? weeklyData : chartTab === 'Month' ? monthlyData : yearlyData;
  const cumulativeChartData = chartTab === 'Week' ? cumulativeWeeklyData : chartTab === 'Month' ? cumulativeMonthlyData : cumulativeYearlyData;
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

  const currentMonthEventCount = useMemo(() => {
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    return calendarEvents.filter(e => e.date.startsWith(prefix)).length;
  }, [calendarEvents, calYear, calMonth]);

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
  const [quickAddBuildText, setQuickAddBuildText] = useState('');
  const [quickAddBreakText, setQuickAddBreakText] = useState('');
  const [quickAddTodoText, setQuickAddTodoText] = useState('');
  const [inlineJournalHabitId, setInlineJournalHabitId] = useState<string | null>(null);
  const [inlineJournalText, setInlineJournalText] = useState('');
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

  // ── Goals state ─────────────────────────────────────────────────────────────
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalProgress, setGoalProgress] = useState(0);
  const [goalRelatedHabits, setGoalRelatedHabits] = useState<string[]>([]);
  const [goalNotes, setGoalNotes] = useState('');

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const abandonedGoals = goals.filter(g => g.status === 'abandoned');

  function handleAddGoal() {
    if (!goalTitle.trim()) return;

    const goalEntry: GoalEntry = editingGoalId ? {
      id: editingGoalId,
      title: goalTitle,
      description: goalDescription,
      targetDate: goalTargetDate,
      status: 'active',
      progress: goalProgress,
      relatedHabits: goalRelatedHabits,
      createdAt: goals.find(g => g.id === editingGoalId)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: goalNotes,
    } : {
      id: Date.now().toString(),
      title: goalTitle,
      description: goalDescription,
      targetDate: goalTargetDate,
      status: 'active',
      progress: goalProgress,
      relatedHabits: goalRelatedHabits,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: goalNotes,
    };

    if (editingGoalId) {
      updateGoal(editingGoalId, goalEntry);
      setEditingGoalId(null);
    } else {
      addGoal(goalEntry);
    }

    // Reset form
    setGoalTitle('');
    setGoalDescription('');
    setGoalTargetDate('');
    setGoalProgress(0);
    setGoalRelatedHabits([]);
    setGoalNotes('');
    setShowAddGoalModal(false);
  }

  function openEditGoal(goal: GoalEntry) {
    setEditingGoalId(goal.id);
    setGoalTitle(goal.title);
    setGoalDescription(goal.description);
    setGoalTargetDate(goal.targetDate);
    setGoalProgress(goal.progress);
    setGoalRelatedHabits(goal.relatedHabits);
    setGoalNotes(goal.notes);
    setShowAddGoalModal(true);
    setGoalsExpanded(true);
  }

  // ── Temptation state ────────────────────────────────────────────────────────
  const [showTemptationModal, setShowTemptationModal] = useState(false);
  const [temptationHabitId, setTemptationHabitId] = useState('');
  const [temptationHabitName, setTemptationHabitName] = useState('');
  const [temptationAdvice, setTemptationAdvice] = useState('');

  function openTemptationModal(habitId: string, habitName: string) {
    setTemptationHabitId(habitId);
    setTemptationHabitName(habitName);
    const advice = getRandomAdviceForHabit(habitName);
    setTemptationAdvice(advice);
    setShowTemptationModal(true);
  }

  function handleIResisted() {
    // Award XP for resisting temptation
    addXP(2);
    setShowTemptationModal(false);
  }

  function handleLogRelapse() {
    openRelapseForm(temptationHabitId, temptationHabitName);
    setShowTemptationModal(false);
  }

  // ── Dashboard Customization ─────────────────────────────────────────────────
  const defaultPrefs = {
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
  const prefs = { ...defaultPrefs, ...(settings.dashboardPreferences || {}) };
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [localPrefs, setLocalPrefs] = useState(prefs);

  function savePrefs() {
    updateSettings({ dashboardPreferences: localPrefs });
    setShowCustomizeModal(false);
  }

  // ── Analytics calculations ──────────────────────────────────────────────────
  const longestStreak = useMemo(() =>
    habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0,
    [habits]
  );

  const habitWithLongestStreak = useMemo(() =>
    habits.find(h => h.streak === longestStreak),
    [habits, longestStreak]
  );

  const avoidedBadHabitsCount = useMemo(() => {
    return badHabits.filter(h => !h.completedDates.includes(today)).length;
  }, [badHabits, today]);

  const completedBadHabitsCount = useMemo(() => {
    return badHabits.filter(h => h.completedDates.includes(today)).length;
  }, [badHabits, today]);

  const dailyQuote = getQuoteForDay(today);

  const weekStats = useMemo(() => calculateWeekStats(habits, today), [habits, today]);
  const monthStats = useMemo(() => calculateMonthStats(habits, today), [habits, today]);

  const bestHabits = useMemo(() => {
    return [...habits]
      .sort((a, b) => getHabitCompletionRate(b) - getHabitCompletionRate(a))
      .slice(0, 3);
  }, [habits]);

  const worstHabits = useMemo(() => {
    return [...habits]
      .sort((a, b) => getHabitCompletionRate(a) - getHabitCompletionRate(b))
      .slice(0, 3);
  }, [habits]);

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
  const [editDateForHabit, setEditDateForHabit] = useState<string>(today);
  const [showAddForm, setShowAddForm] = useState(false);

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

  function toggleHabitForDate(habitId: string, date: string) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const newCompletedDates = habit.completedDates.includes(date)
      ? habit.completedDates.filter(d => d !== date)
      : [...habit.completedDates, date];

    updateHabit(habitId, { completedDates: newCompletedDates });
  }

  function handleInlineJournalSave() {
    if (!inlineJournalText.trim() || !inlineJournalHabitId) return;
    const h = habits.find(x => x.id === inlineJournalHabitId);
    if (!h) return;
    addJournalEntry({ id: Date.now().toString(), habitId: inlineJournalHabitId, habitName: h.name, text: inlineJournalText.trim(), date: today });
    setInlineJournalHabitId(null);
    setInlineJournalText('');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const screenWidth = useScreenWidth();
  const desktop = screenWidth > BREAKPOINTS.tablet;
  const contentPadding = desktop ? Spacing.md : Spacing.sm;

  // Helper for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  // ── Shared habit row renderer (used by Build + Break sections) ──────────────
  const renderHabitRow = (habit: typeof habits[number]) => {
    const isCompleted = habit.completedDates.includes(today);
    const isGood = habit.type === 'good';
    const habitColor = isGood ? colors.success : colors.danger;
    const accentBarColor = isCompleted ? (isGood ? colors.accent : colors.danger) : colors.border;
    const streakText = isGood
      ? `🔥 ${habit.streak} day streak`
      : isCompleted ? '⚠️ Marked today' : `${habit.streak} days avoided`;
    const streakColor = isGood && habit.streak > 0 ? colors.warning : colors.textSecondary;
    const isTimerHabit = habit.name.toLowerCase().includes('pomodoro') || habit.name.toLowerCase().includes('timer');
    return (
      <View
        key={habit.id}
        style={{
          flexDirection: 'row', alignItems: 'center',
          paddingVertical: Spacing.md, paddingRight: contentPadding, paddingLeft: contentPadding - 4,
          borderBottomWidth: 1, borderBottomColor: colors.border,
          borderLeftWidth: 4, borderLeftColor: accentBarColor,
          backgroundColor: colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => handleToggleHabit(habit.id, today)}
          style={{
            width: 32, height: 32, borderRadius: 8, borderWidth: 2,
            borderColor: habitColor, backgroundColor: isCompleted ? habitColor : 'transparent',
            alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
          }}
        >
          {isCompleted && <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>{isGood ? '✓' : '✗'}</Text>}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: colors.text, lineHeight: FontSize.md * 1.3 }}>{habit.name}</Text>
          <Text style={{ fontSize: FontSize.xs, color: streakColor, marginTop: 2, fontWeight: habit.streak > 0 && isGood ? '600' : '400' }}>{streakText}</Text>
        </View>
        {isCompleted && isGood && (
          inlineJournalHabitId === habit.id ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <TextInput
                placeholder="Why did you do this?"
                value={inlineJournalText}
                onChangeText={setInlineJournalText}
                onSubmitEditing={handleInlineJournalSave}
                style={{ width: 150, fontSize: FontSize.xs, color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 2, paddingHorizontal: Spacing.xs }}
                placeholderTextColor={colors.textTertiary}
                autoFocus
                returnKeyType="done"
              />
              <TouchableOpacity onPress={handleInlineJournalSave} style={{ backgroundColor: colors.accent, borderRadius: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3 }}>
                <Text style={{ color: '#FFF', fontSize: FontSize.xs, fontWeight: '700' }}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setInlineJournalHabitId(null)}>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { setInlineJournalHabitId(habit.id); setInlineJournalText(''); }} style={[styles.whyBtn, { borderColor: colors.accent }]}>
              <Text style={[styles.whyBtnText, { color: colors.accent }]}>Why?</Text>
            </TouchableOpacity>
          )
        )}
        {isCompleted && !isGood && (
          <TouchableOpacity onPress={() => openRelapseForm(habit.id, habit.name)} style={[styles.relapseBtn, { borderColor: colors.danger }]}>
            <Text style={[styles.relapseBtnText, { color: colors.danger }]}>Relapsed</Text>
          </TouchableOpacity>
        )}
        {!isCompleted && !isGood && (
          <TouchableOpacity onPress={() => openTemptationModal(habit.id, habit.name)} style={[styles.temptedBtn, { borderColor: colors.warning }]}>
            <Text style={[styles.temptedBtnText, { color: colors.warning }]}>Tempted</Text>
          </TouchableOpacity>
        )}
        {isTimerHabit && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Clock')}
            style={{ marginLeft: Spacing.xs, backgroundColor: colors.accentLight, borderRadius: 6, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: colors.accent }}
          >
            <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700' }}>🍅 Timer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 3-column responsive layout (desktop) + tab-based layout (mobile/tablet)
  const mainContent = desktop ? (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ━━ SIDEBAR + CONTENT PANEL ━━ */}
      <View style={{ flex: 1, flexDirection: 'row' }}>

        {/* Sidebar */}
        <View style={{ width: sidebarCollapsed ? 48 : 220, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.surface }}>
          {/* Dashboard title + collapse toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: sidebarCollapsed ? Spacing.xs : Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            {!sidebarCollapsed && (
              <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>Dashboard</Text>
            )}
            <TouchableOpacity onPress={() => setSidebarCollapsed(c => !c)} style={{ padding: Spacing.xs }}>
              <Text style={{ fontSize: FontSize.md, color: colors.textSecondary }}>{sidebarCollapsed ? '›' : '‹'}</Text>
            </TouchableOpacity>
          </View>
          {/* Category nav */}
          {([
            { id: 'today' as const, label: "Today's Habits", icon: '🏠', sub: completedGoodHabits.length + '/' + goodHabits.length + ' completed' },
            { id: 'progress' as const, label: 'Progress', icon: '📊', sub: 'Ring · Chart' },
            { id: 'journals' as const, label: 'Journals', icon: '📓', sub: 'Wins · Goals · Notes' },
            { id: 'calendar' as const, label: 'Calendar', icon: '📅', sub: MONTH_NAMES[calMonth] + ' ' + calYear + (currentMonthEventCount > 0 ? ' · ' + currentMonthEventCount + ' event' + (currentMonthEventCount !== 1 ? 's' : '') : '') },
          ]).map(cat => {
            const isActive = dashboardCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => { setCurrentTab(cat.id); if (cat.id === 'calendar' && !selectedDay) setSelectedDay(today); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                  paddingHorizontal: sidebarCollapsed ? 0 : Spacing.md,
                  paddingVertical: 12,
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  backgroundColor: isActive ? colors.accentLight : 'transparent',
                  borderRightWidth: isActive ? 3 : 0, borderRightColor: colors.accent,
                }}
              >
                <View style={{ position: 'relative' }}>
                  <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                  {cat.id === 'today' && sidebarCollapsed && (goodHabits.length - completedGoodHabits.length) > 0 && (
                    <View style={{ position: 'absolute', top: -4, right: -6, backgroundColor: colors.warning, borderRadius: 6, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>{goodHabits.length - completedGoodHabits.length}</Text>
                    </View>
                  )}
                </View>
                {!sidebarCollapsed && (
                  <>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: FontSize.sm, fontWeight: isActive ? '700' : '500', color: isActive ? colors.accent : colors.text }}>{cat.label}</Text>
                      <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{cat.sub}</Text>
                    </View>
                    {cat.id === 'today' && (goodHabits.length - completedGoodHabits.length) > 0 && (
                      <View style={{ backgroundColor: colors.warning, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{goodHabits.length - completedGoodHabits.length}</Text>
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content panel */}
        <View style={{ flex: 1, overflow: 'hidden' }}>
          {/* Panel header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ width: 3, height: 18, backgroundColor: colors.accent, borderRadius: 2, marginRight: Spacing.sm }} />
            <Text style={{ flex: 1, fontSize: FontSize.md, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
              {dashboardCategory === 'today' ? "Today's Habits" : dashboardCategory === 'progress' ? 'Progress' : dashboardCategory === 'journals' ? 'Journals' : 'Calendar'}
            </Text>
            {dashboardCategory === 'today' && (
              <Button title="+ Add/Edit" variant="ghost" size="small" onPress={() => setShowEditHabits(true)} />
            )}
            {dashboardCategory === 'progress' && (
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>Ring · Chart</Text>
            )}
            {dashboardCategory === 'journals' && (
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>Wins · Goals · Notes</Text>
            )}
            {dashboardCategory === 'calendar' && (
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{MONTH_NAMES[calMonth]} {calYear}</Text>
            )}
          </View>

        {/* ━━ TODAY content ━━ */}
        {dashboardCategory === 'today' && (
        <View style={{ flex: 1 }}>

          {/* Daily quote (compact banner) */}
          {prefs.showMotivationQuote && (
            <View style={{
              paddingHorizontal: contentPadding,
              paddingVertical: Spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: colors.accentLight,
            }}>
              <Text style={{ color: colors.accent, fontSize: FontSize.sm, fontStyle: 'italic', lineHeight: FontSize.sm * 1.5 }} numberOfLines={2}>
                {dailyQuote}
              </Text>
            </View>
          )}

          {/* Habit list — scrollable, split into Build + Break sections */}
          <ScrollView style={{ flex: 1, backgroundColor: colors.background }} keyboardShouldPersistTaps="handled">
            {habits.length === 0 && (
              <View style={{ padding: contentPadding, alignItems: 'center', paddingTop: Spacing.xl }}>
                <Text style={{ fontSize: 36, marginBottom: Spacing.md }}>🌱</Text>
                <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.xs }}>No habits yet</Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: FontSize.sm * 1.6 }}>
                  Tap "+ Add/Edit" to create your first habit.
                </Text>
              </View>
            )}

            {/* ── BUILD: habits to grow ── */}
            {goodHabits.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: contentPadding, paddingTop: Spacing.sm, paddingBottom: Spacing.xs, backgroundColor: colors.background }}>
                <View style={{ width: 3, height: 12, backgroundColor: colors.accent, borderRadius: 2, marginRight: Spacing.xs }} />
                <Text style={{ flex: 1, fontSize: FontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' }}>Build</Text>
                <Text style={{ fontSize: FontSize.xs, color: completedGoodHabits.length === goodHabits.length && goodHabits.length > 0 ? colors.accent : colors.textSecondary, fontWeight: '600' }}>
                  {completedGoodHabits.length}/{goodHabits.length} done
                </Text>
              </View>
            )}
            {goodHabits.map(renderHabitRow)}

            {/* ── Quick-add build habit ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: contentPadding, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
              <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13 }}>✅</Text>
              </View>
              <TextInput
                placeholder='Quick-add a build habit…'
                value={quickAddBuildText}
                onChangeText={setQuickAddBuildText}
                onSubmitEditing={() => { if (quickAddBuildText.trim()) { const name = quickAddBuildText.trim(); addHabit({ id: Date.now().toString(), name, type: 'good', streak: 0, bestStreak: 0, completedDates: [], createdAt: new Date().toISOString() }); setQuickAddBuildText(''); } }}
                style={{ flex: 1, fontSize: FontSize.sm, color: colors.text, paddingVertical: Spacing.xs }}
                placeholderTextColor={colors.textTertiary}
                returnKeyType="done"
              />
              {quickAddBuildText.trim().length > 0 && (
                <TouchableOpacity onPress={() => { if (quickAddBuildText.trim()) { const name = quickAddBuildText.trim(); addHabit({ id: Date.now().toString(), name, type: 'good', streak: 0, bestStreak: 0, completedDates: [], createdAt: new Date().toISOString() }); setQuickAddBuildText(''); } }} style={{ backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}>
                  <Text style={{ color: '#FFF', fontSize: FontSize.xs, fontWeight: '700' }}>Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── BREAK: habits to quit ── */}
            {badHabits.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: contentPadding, paddingTop: Spacing.md, paddingBottom: Spacing.xs, backgroundColor: colors.background }}>
                <View style={{ width: 3, height: 12, backgroundColor: colors.danger, borderRadius: 2, marginRight: Spacing.xs }} />
                <Text style={{ flex: 1, fontSize: FontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' }}>Break</Text>
                <Text style={{ fontSize: FontSize.xs, color: colors.success, fontWeight: '600' }}>
                  {badHabits.filter(h => !h.completedDates.includes(today)).length} avoided today
                </Text>
              </View>
            )}
            {badHabits.map(renderHabitRow)}

            {/* ── Quick-add break habit ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: contentPadding, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
              <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#FFE8E8', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13 }}>🚫</Text>
              </View>
              <TextInput
                placeholder='Quick-add a break habit…'
                value={quickAddBreakText}
                onChangeText={setQuickAddBreakText}
                onSubmitEditing={() => { if (quickAddBreakText.trim()) { addHabit({ name: quickAddBreakText.trim(), type: 'bad' }); setQuickAddBreakText(''); } }}
                style={{ flex: 1, fontSize: FontSize.sm, color: colors.text, paddingVertical: Spacing.xs }}
                placeholderTextColor={colors.textTertiary}
                returnKeyType="done"
              />
              {quickAddBreakText.trim().length > 0 && (
                <TouchableOpacity onPress={() => { if (quickAddBreakText.trim()) { addHabit({ name: quickAddBreakText.trim(), type: 'bad' }); setQuickAddBreakText(''); } }} style={{ backgroundColor: colors.danger, borderRadius: 6, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}>
                  <Text style={{ color: '#FFF', fontSize: FontSize.xs, fontWeight: '700' }}>Add</Text>
                </TouchableOpacity>
              )}
            </View>


            {/* Summary section at bottom */}
            {prefs.showSummary && (
              <View style={{ padding: contentPadding, borderTopWidth: habits.length > 0 ? 1 : 0, borderTopColor: colors.border }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
                  <TouchableOpacity
                    style={[styles.summaryTab, summaryMode === 'week' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    onPress={() => setSummaryMode('week')}
                  >
                    <Text style={[styles.summaryTabText, summaryMode === 'week' && { color: '#FFFFFF', fontWeight: '700' }]}>Week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.summaryTab, summaryMode === 'month' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    onPress={() => setSummaryMode('month')}
                  >
                    <Text style={[styles.summaryTabText, summaryMode === 'month' && { color: '#FFFFFF', fontWeight: '700' }]}>Month</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>Completion Rate</Text>
                  <Text style={{ color: colors.accent, fontWeight: '700' }}>
                    {(summaryMode === 'week' ? weekStats : monthStats).completionRate}%
                  </Text>
                </View>
                <ProgressBar progress={(summaryMode === 'week' ? weekStats : monthStats).completionRate / 100} color={colors.success} />
                {prefs.showAnalyticsButton && (
                  <Button title="📊 Analytics" variant="ghost" size="small" onPress={() => setShowAnalytics(true)} style={{ marginTop: Spacing.md }} />
                )}
              </View>
            )}
          </ScrollView>
        </View>

        )}
        {dashboardCategory === 'progress' && (
          <View style={{ flex: 1, overflow: 'hidden' }}>

            {/* ── Compact stats row ── */}
            <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              {([
                { label: 'Today', value: `${completedGoodHabits.length}/${goodHabits.length}`, sub: `${goodHabits.length > 0 ? Math.round(completedGoodHabits.length / goodHabits.length * 100) : 0}% done`, color: colors.accent },
                { label: 'Week', value: `${weekStats.completionRate}%`, sub: 'this week', color: colors.success },
                { label: 'Avoided', value: `${avoidedBadHabitsCount}`, sub: 'bad habits', color: avoidedBadHabitsCount > 0 ? colors.success : colors.textSecondary },
                { label: 'Lvl', value: `${stats.level}`, sub: `${stats.xp} XP`, color: colors.accent },
                { label: 'Current Streak', value: `${stats.currentStreak}d`, sub: '100% days', color: colors.warning },
                { label: 'Longest Streak', value: `${longestStreak}d`, sub: 'best run', color: colors.warning },
              ] as const).map((s, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRightWidth: i < 5 ? 1 : 0, borderRightColor: colors.border }}>
                  <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginBottom: 2 }}>{s.label}</Text>
                  <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: s.color }}>{s.value}</Text>
                  <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 1 }} numberOfLines={1}>{s.sub}</Text>
                </View>
              ))}
            </View>

            {/* ── Ring + Chart side by side ── */}
            <View style={{ flex: 1, flexDirection: 'row', overflow: 'hidden' }}>

              {/* Ring pane */}
              <View style={{ width: 210, borderRightWidth: 1, borderRightColor: colors.border, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
                <DailyProgressRing completed={completedGoodHabits.length} total={goodHabits.length} size="small" />
                {bonusEarnedToday && (
                  <View style={{ marginTop: Spacing.sm, backgroundColor: colors.accentLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 }}>
                    <Text style={{ color: colors.accent, fontSize: FontSize.xs, fontWeight: '700', textAlign: 'center' }}>🏆 All done! +2 XP</Text>
                  </View>
                )}
              </View>

              {/* Chart pane */}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: contentPadding }}>
                {/* Period tabs */}
                <View style={styles.tabRow}>
                  {(['Week', 'Month', 'Year'] as const).map(tab => (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => setChartTab(tab)}
                      style={[styles.tab, { backgroundColor: chartTab === tab ? colors.accent : colors.surfaceLight }]}
                    >
                      <Text style={[styles.tabText, { color: chartTab === tab ? '#FFFFFF' : colors.textSecondary }]}>{tab}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Completion % chart */}
                <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs, marginBottom: Spacing.xs }}>Good-habit completion %</Text>
                <View style={{ marginHorizontal: -contentPadding, height: 130, marginBottom: Spacing.md }}>
                  <LineGraph data={chartData} labels={chartLabels} paddingHorizontal={contentPadding} />
                </View>

                {/* Cumulative chart */}
                <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: Spacing.sm }}>
                  <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs, marginBottom: Spacing.xs }}>📈 Cumulative habit completions</Text>
                  <View style={{ marginHorizontal: -contentPadding, height: 130 }}>
                    <LineGraph data={cumulativeChartData} labels={chartLabels} paddingHorizontal={contentPadding} />
                  </View>
                </View>
              </ScrollView>

            </View>
          </View>
        )}
        {dashboardCategory === 'journals' && (
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
              <View style={{ padding: contentPadding, paddingBottom: Spacing.lg }}>

              {/* Todo List Section */}
              <View style={{ backgroundColor: colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, padding: Spacing.md, marginBottom: Spacing.md }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: FontSize.sm, marginBottom: Spacing.md }}>📋 Quick Tasks</Text>

                {/* Add todo input */}
                <View style={{ flexDirection: 'row', marginBottom: Spacing.md }}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        flex: 1,
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                        marginRight: Spacing.sm,
                        fontSize: FontSize.sm,
                      },
                    ]}
                    placeholder="Add a quick task..."
                    placeholderTextColor={colors.textTertiary}
                    onChangeText={setQuickAddTodoText}
                    value={quickAddTodoText}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      if (quickAddTodoText?.trim?.() && addTodo) {
                        const newTodo: Todo = {
                          id: Date.now().toString(),
                          title: quickAddTodoText.trim(),
                          completed: false,
                          createdAt: new Date().toISOString(),
                          xpReward: 1,
                        };
                        addTodo(newTodo);
                        setQuickAddTodoText('');
                      }
                    }}
                    style={{ backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: Spacing.sm, justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#FFF', fontSize: FontSize.xs, fontWeight: '700' }}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Todo list */}
                {!todos || todos.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>No tasks yet</Text>
                ) : (
                  todos.map(todo => (
                    <View
                      key={todo.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: Spacing.xs,
                        paddingHorizontal: Spacing.xs,
                        backgroundColor: todo.completed ? colors.success + '15' : colors.background,
                        borderRadius: BorderRadius.sm,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => toggleTodo && toggleTodo(todo.id)}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 3,
                          borderWidth: 1.5,
                          borderColor: colors.accent,
                          backgroundColor: todo.completed ? colors.accent : 'transparent',
                          marginRight: Spacing.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {todo.completed && <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>✓</Text>}
                      </TouchableOpacity>
                      <Text
                        style={{
                          flex: 1,
                          color: todo.completed ? colors.textSecondary : colors.text,
                          fontSize: FontSize.sm,
                          textDecorationLine: todo.completed ? 'line-through' : 'none',
                        }}
                      >
                        {todo.title}
                      </Text>
                      <Text style={{ color: colors.accent, fontWeight: '700', marginRight: Spacing.sm, fontSize: FontSize.xs }}>+{todo.xpReward} XP</Text>
                      <TouchableOpacity onPress={() => deleteTodo && deleteTodo(todo.id)}>
                        <Text style={{ color: colors.danger, fontSize: FontSize.sm }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              {/* Real World Wins */}
              {prefs.showWins && (
                <View style={{ backgroundColor: colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                  <TouchableOpacity
                    onPress={() => setWinsExpanded(!winsExpanded)}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.md }}
                  >
                    <Text style={{ color: colors.success, fontWeight: '700', fontSize: FontSize.sm, flex: 1 }}>
                      🏆 Real World Wins ({realWorldWins.length})
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      {winsExpanded && (
                        <TouchableOpacity onPress={() => setShowAddWin(true)}>
                          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: FontSize.sm }}>+ Add</Text>
                        </TouchableOpacity>
                      )}
                      <Text style={{ color: colors.textSecondary }}>{winsExpanded ? '▲' : '▼'}</Text>
                    </View>
                  </TouchableOpacity>
                  {winsExpanded && (
                    <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
                      {realWorldWins.length === 0 ? (
                        <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No wins yet. Celebrate your progress!</Text>
                      ) : (
                        realWorldWins.slice(0, 3).map(win => (
                          <View key={win.id} style={[styles.winEntry, { borderLeftColor: colors.success }]}>
                            <Text style={[styles.winText, { color: colors.text }]}>{win.text}</Text>
                            <Text style={[styles.winDate, { color: colors.textSecondary }]}>{formatDisplayDate(win.date)}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Relapse Recovery */}
              {prefs.showRelapse && (
                <View style={{ backgroundColor: colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                  <TouchableOpacity
                    onPress={() => setRelapseExpanded(!relapseExpanded)}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.md }}
                  >
                    <Text style={{ color: colors.danger, fontWeight: '700', fontSize: FontSize.sm, flex: 1 }}>
                      Relapse Recovery ({relapseLog.length})
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>{relapseExpanded ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {relapseExpanded && (
                    <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
                      {relapseLog.length === 0 ? (
                        <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No relapses logged. Keep it up!</Text>
                      ) : (
                        relapseLog.slice(0, 2).map(entry => (
                          <View key={entry.id} style={[styles.recoveryEntry, { borderLeftColor: colors.danger }]}>
                            <Text style={[styles.recoveryHabit, { color: colors.danger, fontWeight: '700' }]}>{entry.habitName}</Text>
                            <Text style={[styles.recoveryTrigger, { color: colors.textSecondary }]}>Trigger: {entry.trigger}</Text>
                            {entry.lesson && <Text style={[styles.recoveryLesson, { color: colors.text }]}>Lesson: {entry.lesson}</Text>}
                            <Text style={[styles.recoveryDate, { color: colors.textSecondary, fontSize: FontSize.xs }]}>{formatDisplayDate(entry.date)}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Goals */}
              <View style={{ backgroundColor: colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                <TouchableOpacity
                  onPress={() => setGoalsExpanded(!goalsExpanded)}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.md }}
                >
                  <Text style={{ color: colors.warning, fontWeight: '700', fontSize: FontSize.sm, flex: 1 }}>
                    📍 Goals ({activeGoals.length})
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    {goalsExpanded && (
                      <TouchableOpacity onPress={() => {
                        setEditingGoalId(null);
                        setGoalTitle('');
                        setGoalDescription('');
                        setGoalTargetDate('');
                        setGoalProgress(0);
                        setGoalRelatedHabits([]);
                        setGoalNotes('');
                        setShowAddGoalModal(true);
                      }}>
                        <Text style={{ color: colors.accent, fontWeight: '700', fontSize: FontSize.md }}>+</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={{ color: colors.textSecondary }}>{goalsExpanded ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>
                {goalsExpanded && (
                  <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
                    {activeGoals.length === 0 && completedGoals.length === 0 && abandonedGoals.length === 0 ? (
                      <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No goals yet. Tap "+" to create one!</Text>
                    ) : (
                      <>
                        {activeGoals.map((goal) => (
                          <TouchableOpacity key={goal.id} onPress={() => openEditGoal(goal)} style={{ marginBottom: Spacing.md }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
                              <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.sm, flex: 1 }}>{goal.title}</Text>
                              <TouchableOpacity onPress={() => deleteGoal(goal.id)}>
                                <Text style={{ color: colors.danger, fontSize: 16 }}>✕</Text>
                              </TouchableOpacity>
                            </View>
                            <ProgressBar progress={goal.progress / 100} color={colors.warning} />
                            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: Spacing.xs }}>
                              {goal.progress}% · Target: {formatDisplayDate(goal.targetDate)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {completedGoals.length > 0 && (
                          <Text style={{ color: colors.success, fontWeight: '700', fontSize: FontSize.xs, marginTop: Spacing.sm }}>
                            ✓ {completedGoals.length} completed
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                )}
              </View>

              {/* Why Journals */}
              {prefs.showJournals && (
                <View style={{ backgroundColor: colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                  <TouchableOpacity
                    onPress={() => setJournalExpanded(!journalExpanded)}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.md }}
                  >
                    <Text style={{ color: colors.accent, fontWeight: '700', fontSize: FontSize.sm, flex: 1 }}>
                      Why Journals ({journalEntries.length})
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>{journalExpanded ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {journalExpanded && (
                    <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
                      {journalEntries.length === 0 ? (
                        <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No entries yet. Tap "Why?" after completing a habit.</Text>
                      ) : (
                        journalEntries.slice(0, 3).map(entry => (
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
                        ))
                      )}
                    </View>
                  )}
                </View>
              )}

              </View>
            </ScrollView>
          </View>
        )}

        {/* ━━ CALENDAR panel — side-by-side ━━ */}
        {dashboardCategory === 'calendar' && (
          <View style={{ flex: 1, flexDirection: 'row', overflow: 'hidden' }}>

            {/* Left pane: Calendar grid */}
            <View style={{ width: 340, borderRightWidth: 1, borderRightColor: colors.border, padding: contentPadding }}>
              {/* Month navigation */}
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

              {/* Day-of-week labels */}
              <View style={styles.calDayLabels}>
                {DAY_LABELS_SHORT.map((d, i) => (
                  <Text key={i} style={[styles.calDayLabel, { color: colors.textSecondary, fontSize: FontSize.xs }]}>{d}</Text>
                ))}
              </View>

              {/* Day cells with heatmap */}
              <View style={styles.calGrid}>
                {Array.from({ length: firstDay }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.calCell} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === today;
                  const hasEvent = eventDates.has(dateStr);
                  const isSelected = (selectedDay ?? today) === dateStr;
                  const completionLevel = getDailyCompletionLevel(dateStr, habits);
                  let heatmapColor = colors.surface;
                  if (completionLevel === 1) heatmapColor = '#66BB6A';
                  if (completionLevel === 2) heatmapColor = colors.success;
                  if (completionLevel === 3) heatmapColor = colors.accent;
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setSelectedDay(isSelected && selectedDay !== null ? null : dateStr)}
                      style={[
                        styles.calCell,
                        !isSelected && { backgroundColor: heatmapColor },
                        isToday && !isSelected && { borderWidth: 2, borderColor: colors.accent },
                        isSelected && { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text style={[styles.calDayNum, { color: isSelected ? '#FFFFFF' : completionLevel > 0 ? '#1A1A1A' : colors.text }]}>
                        {day}
                      </Text>
                      {hasEvent && (
                        <View style={[styles.eventDot, { backgroundColor: isSelected ? '#FFFFFF' : colors.accent }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Heatmap legend */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md }}>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Less</Text>
                {([colors.surface, '#66BB6A', colors.success, colors.accent] as string[]).map((c, i) => (
                  <View key={i} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c, borderWidth: c === colors.surface ? 1 : 0, borderColor: colors.border }} />
                ))}
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>More</Text>
              </View>
            </View>

            {/* Right pane: Selected day detail */}
            <View style={{ flex: 1, overflow: 'hidden' }}>
              {/* Day title bar */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: contentPadding, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
                <View>
                  <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
                    {formatDisplayDate(selectedDay ?? today)}
                  </Text>
                  {(selectedDay ?? today) === today && (
                    <Text style={{ fontSize: FontSize.xs, color: colors.accent, fontWeight: '600', marginTop: 1 }}>Today</Text>
                  )}
                </View>
                <Button title="+ Add Event" variant="ghost" size="small" onPress={() => { setNewEventDate(selectedDay ?? today); setShowAddEventModal(true); }} />
              </View>

              {/* Events + habit completions for selected day */}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: contentPadding, paddingBottom: Spacing.xl }}>
                {/* Events */}
                {(() => {
                  const viewDay = selectedDay ?? today;
                  const dayEvts = calendarEvents.filter(e => e.date === viewDay);
                  return dayEvts.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
                      <Text style={{ fontSize: 36, marginBottom: Spacing.md }}>📭</Text>
                      <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: colors.text, marginBottom: Spacing.xs }}>No events scheduled</Text>
                      <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, textAlign: 'center' }}>
                        Tap "+ Add Event" to add something to this day.
                      </Text>
                    </View>
                  ) : (
                    <View style={{ marginBottom: Spacing.lg }}>
                      <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>Events</Text>
                      {dayEvts.map(evt => (
                        <View key={evt.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                          <View style={{ width: 4, height: 44, backgroundColor: colors.accent, borderRadius: 2, marginRight: Spacing.md }} />
                          <View style={{ flex: 1 }}>
                            {evt.time && <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: colors.accent, marginBottom: 2 }}>{evt.time}</Text>}
                            <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: colors.text }}>{evt.title}</Text>
                          </View>
                          <TouchableOpacity onPress={() => removeCalendarEvent(evt.id)} style={{ padding: Spacing.sm }}>
                            <Text style={{ color: colors.danger, fontWeight: '700', fontSize: FontSize.md }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  );
                })()}

                {/* Habit completions for that day */}
                {(() => {
                  const viewDay = selectedDay ?? today;
                  const completedOnDay = habits.filter(h => h.completedDates.includes(viewDay));
                  if (completedOnDay.length === 0) return null;
                  return (
                    <View>
                      <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>Habits Completed</Text>
                      {completedOnDay.map(h => (
                        <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: h.type === 'good' ? colors.success : colors.danger }} />
                          <Text style={{ fontSize: FontSize.sm, color: colors.text, flex: 1 }}>{h.name}</Text>
                          <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{h.type === 'good' ? '✓ Done' : '✗ Avoided'}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })()}
              </ScrollView>
            </View>

          </View>
        )}

        </View>
      </View>
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
        {([
          { id: 'habits', label: 'Habits' },
          { id: 'progress', label: 'Progress' },
          { id: 'journals', label: 'Journals' },
          { id: 'calendar', label: 'Calendar' },
        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setCurrentTab(tab.id === 'habits' ? 'today' : tab.id)}
            style={{
              flex: 1,
              paddingVertical: Spacing.md,
              borderBottomWidth: activeTab === tab.id ? 2 : 0,
              borderBottomColor: colors.accent,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontSize: FontSize.xs,
                color: activeTab === tab.id ? colors.accent : colors.textSecondary,
                fontWeight: activeTab === tab.id ? '700' : '400',
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => { setLocalPrefs(prefs); setShowCustomizeModal(true); }} style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.md }}>
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.xxl, paddingHorizontal: contentPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ━━ HABITS TAB ━━ */}
        {currentTab === 'today' && (
          <>
            {/* ── Daily Motivation Quote ── */}
            {prefs.showMotivationQuote && (
              <View style={{ marginHorizontal: -contentPadding, paddingHorizontal: contentPadding, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.accentLight }}>
                <Text style={{ color: colors.accent, fontSize: FontSize.sm, fontStyle: 'italic', lineHeight: FontSize.sm * 1.5 }} numberOfLines={2}>
                  {dailyQuote}
                </Text>
              </View>
            )}

            {/* ── Streak Highlight ── */}
            {prefs.showStreakHighlight && habitWithLongestStreak && longestStreak > 0 && (
              <View style={{ marginHorizontal: -contentPadding, paddingHorizontal: contentPadding, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: colors.accent, fontSize: FontSize.sm, fontWeight: '700' }}>🔥 Best Streak: </Text>
                <Text style={{ color: colors.accent, fontSize: FontSize.sm, fontWeight: '800' }}>{longestStreak}d</Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginLeft: Spacing.xs }}>{habitWithLongestStreak.name}</Text>
              </View>
            )}

            {habits.length === 0 && (
              <View style={{ padding: contentPadding, alignItems: 'center', paddingTop: Spacing.xl }}>
                <Text style={{ fontSize: 36, marginBottom: Spacing.md }}>🌱</Text>
                <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.xs }}>No habits yet</Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' }}>Tap "Add/Edit" to create your first habit.</Text>
                <Button title="+ Add/Edit" variant="ghost" size="small" onPress={() => setShowEditHabits(true)} style={{ marginTop: Spacing.md }} />
              </View>
            )}

            {/* ── BUILD section ── */}
            {goodHabits.length > 0 && (
              <View style={{ marginHorizontal: -contentPadding, flexDirection: 'row', alignItems: 'center', paddingHorizontal: contentPadding, paddingTop: Spacing.sm, paddingBottom: Spacing.xs, backgroundColor: colors.background }}>
                <View style={{ width: 3, height: 12, backgroundColor: colors.accent, borderRadius: 2, marginRight: Spacing.xs }} />
                <Text style={{ flex: 1, fontSize: FontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' }}>Build</Text>
                <Text style={{ fontSize: FontSize.xs, color: completedGoodHabits.length === goodHabits.length && goodHabits.length > 0 ? colors.accent : colors.textSecondary, fontWeight: '600' }}>
                  {completedGoodHabits.length}/{goodHabits.length} done
                </Text>
              </View>
            )}
            {goodHabits.map(renderHabitRow)}

            {/* ── Quick-add build habit ── */}
            <View style={{ marginHorizontal: -contentPadding, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: contentPadding, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
              <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13 }}>✅</Text>
              </View>
              <TextInput
                placeholder='Quick-add a build habit…'
                value={quickAddBuildText}
                onChangeText={setQuickAddBuildText}
                onSubmitEditing={() => { if (quickAddBuildText.trim()) { const name = quickAddBuildText.trim(); addHabit({ id: Date.now().toString(), name, type: 'good', streak: 0, bestStreak: 0, completedDates: [], createdAt: new Date().toISOString() }); setQuickAddBuildText(''); } }}
                style={{ flex: 1, fontSize: FontSize.sm, color: colors.text, paddingVertical: Spacing.xs }}
                placeholderTextColor={colors.textTertiary}
                returnKeyType="done"
              />
              {quickAddBuildText.trim().length > 0 && (
                <TouchableOpacity onPress={() => { if (quickAddBuildText.trim()) { const name = quickAddBuildText.trim(); addHabit({ id: Date.now().toString(), name, type: 'good', streak: 0, bestStreak: 0, completedDates: [], createdAt: new Date().toISOString() }); setQuickAddBuildText(''); } }} style={{ backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}>
                  <Text style={{ color: '#FFF', fontSize: FontSize.xs, fontWeight: '700' }}>Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── BREAK section ── */}
            {badHabits.length > 0 && (
              <View style={{ marginHorizontal: -contentPadding, flexDirection: 'row', alignItems: 'center', paddingHorizontal: contentPadding, paddingTop: Spacing.md, paddingBottom: Spacing.xs, backgroundColor: colors.background }}>
                <View style={{ width: 3, height: 12, backgroundColor: colors.danger, borderRadius: 2, marginRight: Spacing.xs }} />
                <Text style={{ flex: 1, fontSize: FontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' }}>Break</Text>
                <Text style={{ fontSize: FontSize.xs, color: colors.success, fontWeight: '600' }}>
                  {badHabits.filter(h => !h.completedDates.includes(today)).length} avoided today
                </Text>
              </View>
            )}
            {badHabits.map(renderHabitRow)}

            {/* ── Quick-add break habit ── */}
            <View style={{ marginHorizontal: -contentPadding, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: contentPadding, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
              <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#FFE8E8', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13 }}>🚫</Text>
              </View>
              <TextInput
                placeholder='Quick-add a break habit…'
                value={quickAddBreakText}
                onChangeText={setQuickAddBreakText}
                onSubmitEditing={() => { if (quickAddBreakText.trim()) { addHabit({ name: quickAddBreakText.trim(), type: 'bad' }); setQuickAddBreakText(''); } }}
                style={{ flex: 1, fontSize: FontSize.sm, color: colors.text, paddingVertical: Spacing.xs }}
                placeholderTextColor={colors.textTertiary}
                returnKeyType="done"
              />
              {quickAddBreakText.trim().length > 0 && (
                <TouchableOpacity onPress={() => { if (quickAddBreakText.trim()) { addHabit({ name: quickAddBreakText.trim(), type: 'bad' }); setQuickAddBreakText(''); } }} style={{ backgroundColor: colors.danger, borderRadius: 6, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}>
                  <Text style={{ color: '#FFF', fontSize: FontSize.xs, fontWeight: '700' }}>Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Weekly/Monthly Summary ── */}
            {prefs.showSummary && (
              <View style={{ marginHorizontal: -contentPadding, padding: contentPadding, borderTopWidth: habits.length > 0 ? 1 : 0, borderTopColor: colors.border }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
                  <TouchableOpacity
                    style={[styles.summaryTab, summaryMode === 'week' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    onPress={() => setSummaryMode('week')}
                  >
                    <Text style={[styles.summaryTabText, summaryMode === 'week' && { color: '#FFFFFF', fontWeight: '700' }]}>Week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.summaryTab, summaryMode === 'month' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    onPress={() => setSummaryMode('month')}
                  >
                    <Text style={[styles.summaryTabText, summaryMode === 'month' && { color: '#FFFFFF', fontWeight: '700' }]}>Month</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>Completion Rate</Text>
                  <Text style={{ color: colors.accent, fontWeight: '700' }}>
                    {(summaryMode === 'week' ? weekStats : monthStats).completionRate}%
                  </Text>
                </View>
                <ProgressBar progress={(summaryMode === 'week' ? weekStats : monthStats).completionRate / 100} color={colors.success} />
                {prefs.showAnalyticsButton && (
                  <Button title="📊 Analytics" variant="ghost" size="small" onPress={() => setShowAnalytics(true)} style={{ marginTop: Spacing.md }} />
                )}
              </View>
            )}

          </>
        )}

        {/* ━━ PROGRESS TAB (MOBILE) ━━ */}
        {currentTab === 'progress' && (
          <>
            {/* Compact stats grid */}
            <View style={{ marginHorizontal: -contentPadding, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              {([
                { label: 'Today', value: `${completedGoodHabits.length}/${goodHabits.length}`, sub: `${goodHabits.length > 0 ? Math.round(completedGoodHabits.length / goodHabits.length * 100) : 0}%`, color: colors.accent },
                { label: 'Week', value: `${weekStats.completionRate}%`, sub: 'this week', color: colors.success },
                { label: 'Avoided', value: `${avoidedBadHabitsCount}`, sub: 'bad habits', color: avoidedBadHabitsCount > 0 ? colors.success : colors.textSecondary },
                { label: 'Level', value: `${stats.level}`, sub: `${stats.xp} XP`, color: colors.accent },
                { label: 'Streak', value: `${stats.currentStreak}d`, sub: 'current', color: colors.warning },
                { label: 'Best', value: `${longestStreak}d`, sub: 'longest', color: colors.warning },
              ] as const).map((s, i) => (
                <View key={i} style={{ width: '33.33%', alignItems: 'center', paddingVertical: Spacing.sm, borderRightWidth: i % 3 !== 2 ? 1 : 0, borderBottomWidth: i < 3 ? 1 : 0, borderColor: colors.border }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 2 }}>{s.label}</Text>
                  <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: s.color }}>{s.value}</Text>
                  <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 1 }} numberOfLines={1}>{s.sub}</Text>
                </View>
              ))}
            </View>

            {/* Ring */}
            <View style={{ marginHorizontal: -contentPadding, alignItems: 'center', paddingVertical: Spacing.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <DailyProgressRing completed={completedGoodHabits.length} total={goodHabits.length} size="small" />
              {bonusEarnedToday && (
                <View style={{ marginTop: Spacing.sm, backgroundColor: colors.accentLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 }}>
                  <Text style={{ color: colors.accent, fontSize: FontSize.xs, fontWeight: '700', textAlign: 'center' }}>🏆 All done! +2 XP</Text>
                </View>
              )}
            </View>

            {/* Charts */}
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
              <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs, marginBottom: Spacing.xs, paddingHorizontal: Spacing.sm }}>Good-habit completion %</Text>
              <View style={{ height: 130, marginBottom: Spacing.md }}>
                <LineGraph data={chartData} labels={chartLabels} paddingHorizontal={contentPadding} />
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: Spacing.sm }}>
                <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs, marginBottom: Spacing.xs, paddingHorizontal: Spacing.sm }}>📈 Cumulative habit completions</Text>
                <View style={{ height: 130 }}>
                  <LineGraph data={cumulativeChartData} labels={chartLabels} paddingHorizontal={contentPadding} />
                </View>
              </View>
            </Card>
          </>
        )}

        {/* ━━ CALENDAR TAB ━━ */}
        {currentTab === 'calendar' && (
          <>
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
                  const completionLevel = getDailyCompletionLevel(dateStr, habits);

                  // Color intensity based on completion level
                  let heatmapColor = colors.surface; // No activity
                  if (completionLevel === 1) heatmapColor = '#66BB6A'; // Light green
                  if (completionLevel === 2) heatmapColor = colors.success; // Bright green
                  if (completionLevel === 3) heatmapColor = colors.accent; // Gold

                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.calCell,
                        !isSelected && { backgroundColor: heatmapColor },
                        isToday && !isSelected && { borderWidth: 2, borderColor: colors.accent },
                        isSelected && { backgroundColor: colors.accent },
                      ]}
                      onPress={() => setSelectedDay(isSelected ? null : dateStr)}
                    >
                      <Text style={{ color: isSelected ? '#1A1A1A' : completionLevel > 0 ? '#1A1A1A' : colors.text, fontSize: FontSize.xs, fontWeight: isToday ? '700' : '400' }}>
                        {day}
                      </Text>
                      {hasEvent && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isSelected ? '#1A1A1A' : colors.accent, marginTop: 2 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedDay && (
                <View style={{ marginTop: Spacing.md }}>
                  <Text style={{ color: colors.accent, fontWeight: '700', marginBottom: Spacing.xs }}>{formatDisplayDate(selectedDay)}</Text>

                  {/* Habits for selected day */}
                  <View style={{ marginBottom: Spacing.md }}>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs }}>Habits</Text>
                    {habits.length === 0 ? (
                      <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No habits yet</Text>
                    ) : (
                      habits.map(habit => {
                        const isCompleted = habit.completedDates.includes(selectedDay);
                        const isGood = habit.type === 'good';
                        const habitColor = isGood ? colors.success : colors.danger;
                        return (
                          <TouchableOpacity
                            key={habit.id}
                            onPress={() => handleToggleHabit(habit.id, selectedDay)}
                            style={[
                              styles.habitRow,
                              {
                                borderBottomColor: colors.border,
                                backgroundColor: isCompleted ? habitColor + '20' : 'transparent',
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.checkbox,
                                {
                                  borderColor: habitColor,
                                  backgroundColor: isCompleted ? habitColor : 'transparent',
                                },
                              ]}
                            >
                              {isCompleted && <Text style={styles.checkmark}>{isGood ? '✓' : '✗'}</Text>}
                            </View>
                            <View style={styles.habitInfo}>
                              <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>

                  {/* Events for selected day */}
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
        {currentTab === 'journals' && (
          <>
            {/* ── Quick Tasks (Todo) ── */}
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={[styles.subsectionLabel, { color: colors.text, marginBottom: Spacing.md }]}>📋 Quick Tasks</Text>
              <View style={{ flexDirection: 'row', marginBottom: Spacing.md }}>
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.background, marginRight: Spacing.sm, fontSize: FontSize.sm }]}
                  placeholder="Add a quick task..."
                  placeholderTextColor={colors.textTertiary}
                  onChangeText={setQuickAddTodoText}
                  value={quickAddTodoText}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (quickAddTodoText?.trim?.() && addTodo) {
                      const newTodo: Todo = {
                        id: Date.now().toString(),
                        title: quickAddTodoText.trim(),
                        completed: false,
                        createdAt: new Date().toISOString(),
                        xpReward: 1,
                      };
                      addTodo(newTodo);
                      setQuickAddTodoText('');
                    }
                  }}
                  style={{ backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: Spacing.sm, justifyContent: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontSize: FontSize.xs, fontWeight: '700' }}>+</Text>
                </TouchableOpacity>
              </View>
              {!todos || todos.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>No tasks yet</Text>
              ) : (
                todos.map(todo => (
                  <View key={todo.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, backgroundColor: todo.completed ? colors.success + '15' : 'transparent', borderRadius: BorderRadius.sm, marginBottom: Spacing.xs }}>
                    <TouchableOpacity
                      onPress={() => toggleTodo && toggleTodo(todo.id)}
                      style={{ width: 18, height: 18, borderRadius: 3, borderWidth: 1.5, borderColor: colors.accent, backgroundColor: todo.completed ? colors.accent : 'transparent', marginRight: Spacing.sm, alignItems: 'center', justifyContent: 'center' }}
                    >
                      {todo.completed && <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>✓</Text>}
                    </TouchableOpacity>
                    <Text style={{ flex: 1, color: todo.completed ? colors.textSecondary : colors.text, fontSize: FontSize.sm, textDecorationLine: todo.completed ? 'line-through' : 'none' }}>{todo.title}</Text>
                    <Text style={{ color: colors.accent, fontWeight: '700', marginRight: Spacing.sm, fontSize: FontSize.xs }}>+{todo.xpReward} XP</Text>
                    <TouchableOpacity onPress={() => deleteTodo && deleteTodo(todo.id)}>
                      <Text style={{ color: colors.danger, fontSize: FontSize.sm }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </Card>

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

      {/* ── ADD/EDIT GOAL MODAL ───────────────────────────────────────────── */}
      <Modal
        visible={showAddGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowAddGoalModal(false); setEditingGoalId(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border, maxHeight: '85%' }]}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editingGoalId ? '📍 Edit Goal' : '📍 Create a Goal'}</Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>Goal Title</Text>
              <TextInput
                placeholder="e.g. Run a 5K, Read 12 books…"
                placeholderTextColor={colors.textSecondary}
                value={goalTitle}
                onChangeText={setGoalTitle}
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>Description (optional)</Text>
              <TextInput
                placeholder="What's your motivation for this goal?"
                placeholderTextColor={colors.textSecondary}
                value={goalDescription}
                onChangeText={setGoalDescription}
                multiline
                numberOfLines={2}
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, minHeight: 60, textAlignVertical: 'top' }]}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>Target Date</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                value={goalTargetDate}
                onChangeText={setGoalTargetDate}
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>Progress: {goalProgress}%</Text>
              <View style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                  {[0, 25, 50, 75, 100].map(pct => (
                    <TouchableOpacity key={pct} onPress={() => setGoalProgress(pct)} style={[styles.progressBtn, { backgroundColor: goalProgress === pct ? colors.accent : colors.surfaceLight }]}>
                      <Text style={{ color: goalProgress === pct ? '#1A1A1A' : colors.text, fontWeight: '600' }}>{pct}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Related Habits</Text>
              <View style={{ marginBottom: Spacing.md }}>
                {goodHabits.map(habit => (
                  <TouchableOpacity
                    key={habit.id}
                    onPress={() => {
                      setGoalRelatedHabits(prev =>
                        prev.includes(habit.id)
                          ? prev.filter(id => id !== habit.id)
                          : [...prev, habit.id]
                      );
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm }}
                  >
                    <View style={[{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, marginRight: Spacing.sm }, { borderColor: goalRelatedHabits.includes(habit.id) ? colors.accent : colors.border, backgroundColor: goalRelatedHabits.includes(habit.id) ? colors.accent : 'transparent' }]}>
                      {goalRelatedHabits.includes(habit.id) && <Text style={{ color: '#1A1A1A', fontWeight: '700' }}>✓</Text>}
                    </View>
                    <Text style={{ color: colors.text }}>{habit.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Notes (optional)</Text>
              <TextInput
                placeholder="Add any notes about this goal…"
                placeholderTextColor={colors.textSecondary}
                value={goalNotes}
                onChangeText={setGoalNotes}
                multiline
                numberOfLines={2}
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, minHeight: 60, textAlignVertical: 'top' }]}
              />

              <View style={[styles.formButtonRow, { marginTop: Spacing.md }]}>
                <Button
                  title={editingGoalId ? 'Update Goal' : 'Create Goal'}
                  variant="primary"
                  size="small"
                  onPress={handleAddGoal}
                  style={styles.formBtnFlex}
                />
                <Button
                  title="Cancel"
                  variant="ghost"
                  size="small"
                  onPress={() => { setShowAddGoalModal(false); setEditingGoalId(null); }}
                  style={styles.formBtnFlex}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── TEMPTATION ADVICE MODAL ───────────────────────────────────────── */}
      <Modal
        visible={showTemptationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTemptationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>💪 I Feel Tempted: {temptationHabitName}</Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>Here's a tip:</Text>
            <View style={[styles.adviceBox, { backgroundColor: colors.surfaceLight, borderLeftColor: colors.warning }]}>
              <Text style={[styles.adviceText, { color: colors.text }]}>{temptationAdvice}</Text>
            </View>

            <View style={styles.formButtonRow}>
              <Button
                title="I Resisted! 🎉"
                variant="primary"
                size="small"
                onPress={handleIResisted}
                style={styles.formBtnFlex}
              />
              <Button
                title="Log Relapse"
                variant="ghost"
                size="small"
                onPress={handleLogRelapse}
                style={styles.formBtnFlex}
              />
            </View>
            <Button
              title="Close"
              variant="ghost"
              size="small"
              onPress={() => setShowTemptationModal(false)}
              style={{ marginTop: Spacing.sm }}
            />
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
        onRequestClose={() => {
          setShowEditHabits(false);
          setEditingHabitId(null);
          setShowAddForm(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, styles.editHabitsModalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.editHabitsHeader}>
              <Text style={[styles.modalTitle, styles.editHabitsTitle, { color: colors.text }]}>
                Manage Habits
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEditHabits(false);
                  setEditingHabitId(null);
                  setShowAddForm(false);
                }}
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
              {/* ── Add Habit ── */}
              {!showAddForm ? (
                <TouchableOpacity
                  style={[styles.addHabitTrigger, { borderColor: colors.accent }]}
                  onPress={() => {
                    setShowAddForm(true);
                    setEditingHabitId(null);
                  }}
                >
                  <Text style={[styles.addHabitTriggerText, { color: colors.accent }]}>＋  New Habit</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.inlineForm, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <TextInput
                    placeholder="Habit name…"
                    placeholderTextColor={colors.textSecondary}
                    value={newHabitName}
                    onChangeText={setNewHabitName}
                    style={[styles.textInput, { color: colors.text, borderColor: colors.border, marginBottom: 0 }]}
                    autoFocus
                    accessibilityLabel="New habit name"
                  />
                  <View style={styles.typePillRow}>
                    <TouchableOpacity
                      style={[styles.typePill, { borderColor: colors.success }, newHabitType === 'good' && { backgroundColor: colors.success }]}
                      onPress={() => setNewHabitType('good')}
                    >
                      <Text style={[styles.typePillText, newHabitType === 'good' && styles.typePillTextActive]}>
                        Good
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typePill, { borderColor: colors.danger }, newHabitType === 'bad' && { backgroundColor: colors.danger }]}
                      onPress={() => setNewHabitType('bad')}
                    >
                      <Text style={[styles.typePillText, newHabitType === 'bad' && styles.typePillTextActive]}>
                        Bad
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    placeholder="Description (optional)"
                    placeholderTextColor={colors.textSecondary}
                    value={newHabitDescription}
                    onChangeText={setNewHabitDescription}
                    multiline
                    style={[styles.textInput, { color: colors.text, borderColor: colors.border, marginBottom: 0 }]}
                    accessibilityLabel="New habit description, optional"
                  />
                  <View style={styles.inlineFormActions}>
                    <TouchableOpacity
                      style={[styles.inlineActionBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        setShowAddForm(false);
                        setNewHabitName('');
                        setNewHabitType('good');
                        setNewHabitDescription('');
                      }}
                    >
                      <Text style={[styles.inlineActionBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inlineActionBtn, styles.inlineActionBtnPrimary, { backgroundColor: colors.accent }]}
                      onPress={() => {
                        handleAddHabit();
                        setShowAddForm(false);
                      }}
                    >
                      <Text style={[styles.inlineActionBtnText, { color: '#fff' }]}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ── Habit list ── */}
              {habits.length === 0 && !showAddForm && (
                <Text style={[styles.emptyNote, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.lg }]}>
                  No habits yet. Tap "＋ New Habit" to get started!
                </Text>
              )}
              {habits.length > 0 && (
                <Text style={[styles.habitListLabel, { color: colors.textSecondary }]}>
                  YOUR HABITS
                </Text>
              )}

              {habits.map(habit => (
                <View key={habit.id}>
                  {/* Row */}
                  <View style={[styles.editHabitRow, { borderBottomColor: editingHabitId === habit.id ? 'transparent' : colors.border }]}>
                    <View style={[styles.typeDot, { backgroundColor: habit.type === 'good' ? colors.success : colors.danger }]} />
                    <View style={styles.editHabitInfo}>
                      <Text style={[styles.editHabitName, { color: colors.text }]} numberOfLines={1}>
                        {habit.name}
                      </Text>
                      <Text style={[styles.editHabitStreak, { color: colors.textSecondary }]}>
                        🔥 {habit.streak}-day streak
                      </Text>
                    </View>
                    {editingHabitId !== habit.id && (
                      <View style={styles.habitRowActions}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingHabitId(habit.id);
                            setEditHabitName(habit.name);
                            setEditHabitType(habit.type);
                            setEditDateForHabit(today);
                            setShowAddForm(false);
                          }}
                          style={styles.habitActionBtn}
                          accessibilityLabel={`Edit ${habit.name}`}
                        >
                          <Text style={{ fontSize: 16 }}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeHabit(habit.id)}
                          style={styles.habitActionBtn}
                          accessibilityLabel={`Delete ${habit.name}`}
                        >
                          <Text style={{ fontSize: 16 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Inline edit form — expands right below the row */}
                  {editingHabitId === habit.id && (
                    <View style={[styles.inlineForm, { borderColor: colors.border, backgroundColor: colors.background, marginBottom: Spacing.xs }]}>
                      <TextInput
                        placeholder="Habit name…"
                        placeholderTextColor={colors.textSecondary}
                        value={editHabitName}
                        onChangeText={setEditHabitName}
                        style={[styles.textInput, { color: colors.text, borderColor: colors.border, marginBottom: 0 }]}
                        autoFocus
                      />

                      {/* Date picker for editing past habits */}
                      <View style={{ marginTop: Spacing.sm, marginBottom: Spacing.sm, paddingVertical: Spacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border }}>
                        <Text style={[styles.inlineFormLabel, { color: colors.textSecondary, fontSize: 12, marginBottom: Spacing.xs }]}>
                          Edit past habit (optional)
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                          <TouchableOpacity
                            style={{ flex: 1, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 6, backgroundColor: colors.surface }}
                            onPress={() => {
                              const [y, m, d] = editDateForHabit.split('-');
                              const currentDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                              const oneMonthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                              const prevDate = oneMonthAgo.toISOString().split('T')[0];
                              setEditDateForHabit(prevDate);
                            }}
                          >
                            <Text style={{ color: colors.accent, fontWeight: '500', fontSize: 12 }}>← Previous</Text>
                          </TouchableOpacity>
                          <Text style={{ color: colors.text, fontWeight: '600', minWidth: 90, textAlign: 'center', fontSize: 13 }}>
                            {editDateForHabit === today ? 'Today' : editDateForHabit}
                          </Text>
                          <TouchableOpacity
                            style={{ flex: 1, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 6, backgroundColor: colors.surface }}
                            onPress={() => {
                              const [y, m, d] = editDateForHabit.split('-');
                              const currentDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                              const nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
                              const formattedDate = nextDate.toISOString().split('T')[0];
                              if (formattedDate <= today) setEditDateForHabit(formattedDate);
                            }}
                          >
                            <Text style={{ color: colors.accent, fontWeight: '500', fontSize: 12 }}>Next →</Text>
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          style={{
                            marginTop: Spacing.sm,
                            paddingVertical: Spacing.sm,
                            paddingHorizontal: Spacing.sm,
                            borderRadius: 6,
                            backgroundColor: habit.completedDates.includes(editDateForHabit) ? colors.danger : colors.success,
                          }}
                          onPress={() => toggleHabitForDate(habit.id, editDateForHabit)}
                        >
                          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 12 }}>
                            {habit.completedDates.includes(editDateForHabit) ? '✓ Mark incomplete' : '○ Mark complete'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.typePillRow}>
                        <TouchableOpacity
                          style={[styles.typePill, { borderColor: colors.success }, editHabitType === 'good' && { backgroundColor: colors.success }]}
                          onPress={() => setEditHabitType('good')}
                        >
                          <Text style={[styles.typePillText, editHabitType === 'good' && styles.typePillTextActive]}>
                            Good
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.typePill, { borderColor: colors.danger }, editHabitType === 'bad' && { backgroundColor: colors.danger }]}
                          onPress={() => setEditHabitType('bad')}
                        >
                          <Text style={[styles.typePillText, editHabitType === 'bad' && styles.typePillTextActive]}>
                            Bad
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.inlineFormActions}>
                        <TouchableOpacity
                          style={[styles.inlineActionBtn, { borderColor: colors.border }]}
                          onPress={() => setEditingHabitId(null)}
                        >
                          <Text style={[styles.inlineActionBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.inlineActionBtn, styles.inlineActionBtnPrimary, { backgroundColor: colors.accent }]}
                          onPress={() => {
                            if (editHabitName.trim() && editingHabitId) {
                              updateHabit(editingHabitId, { name: editHabitName.trim(), type: editHabitType });
                              setEditingHabitId(null);
                            }
                          }}
                        >
                          <Text style={[styles.inlineActionBtnText, { color: '#fff' }]}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── ANALYTICS MODAL ────────────────────────────────────────────────────── */}
      <Modal
        visible={showAnalytics}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnalytics(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, styles.analyticsModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>📊 Analytics</Text>
              <TouchableOpacity onPress={() => setShowAnalytics(false)}>
                <Text style={{ color: colors.text, fontSize: 24 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Best Habits */}
              <View style={{ marginBottom: Spacing.lg }}>
                <Text style={[styles.subsectionLabel, { color: colors.success, marginBottom: Spacing.md }]}>Top Performing Habits</Text>
                {bestHabits.length > 0 ? (
                  <>
                    {bestHabits.map(habit => (
                      <View key={habit.id} style={[styles.habitAnalyticsRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.habitAnalyticsName}>
                          <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                        </View>
                        <Text style={[styles.habitAnalyticsRate, { color: colors.success }]}>
                          {getHabitCompletionRate(habit)}%
                        </Text>
                      </View>
                    ))}
                  </>
                ) : (
                  <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No habits yet</Text>
                )}
              </View>

              {/* Worst Habits */}
              <View style={{ marginBottom: Spacing.lg }}>
                <Text style={[styles.subsectionLabel, { color: colors.danger, marginBottom: Spacing.md }]}>Habits Needing Attention</Text>
                {worstHabits.length > 0 ? (
                  <>
                    {worstHabits.map(habit => (
                      <View key={habit.id} style={[styles.habitAnalyticsRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.habitAnalyticsName}>
                          <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                        </View>
                        <Text style={[styles.habitAnalyticsRate, { color: colors.danger }]}>
                          {getHabitCompletionRate(habit)}%
                        </Text>
                      </View>
                    ))}
                  </>
                ) : (
                  <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No habits yet</Text>
                )}
              </View>

              {/* Month Summary */}
              <View>
                <Text style={[styles.subsectionLabel, { color: colors.accent, marginBottom: Spacing.md }]}>30-Day Summary</Text>
                <View style={{ gap: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>Completion Rate</Text>
                    <Text style={{ color: colors.accent, fontWeight: '700' }}>{monthStats.completionRate}%</Text>
                  </View>
                  <ProgressBar progress={monthStats.completionRate / 100} color={colors.success} />
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: Spacing.sm }}>
                    Good habits completed: {monthStats.completedCount}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>
                    Bad habits avoided: {monthStats.avoidedBadCount}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── HABIT HISTORY MODAL ───────────────────────────────────────────────── */}
      <Modal
        visible={showHabitHistory && !!selectedHabitForHistory}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowHabitHistory(false);
          setSelectedHabitForHistory(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, styles.analyticsModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {selectedHabitForHistory && habits.find(h => h.id === selectedHabitForHistory) && (() => {
              const habit = habits.find(h => h.id === selectedHabitForHistory)!;
              const isGood = habit.type === 'good';
              const completionRate = getHabitCompletionRate(habit);
              let filteredDates = [...habit.completedDates].sort().reverse();

              if (historyDateFilter === 'week') {
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;
                filteredDates = filteredDates.filter(d => d >= weekAgoStr);
              } else if (historyDateFilter === 'month') {
                const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const monthAgoStr = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, '0')}-${String(monthAgo.getDate()).padStart(2, '0')}`;
                filteredDates = filteredDates.filter(d => d >= monthAgoStr);
              }

              return (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                    <Text style={[styles.historyModalTitle, { color: colors.text }]}>{habit.name}</Text>
                    <TouchableOpacity onPress={() => { setShowHabitHistory(false); setSelectedHabitForHistory(null); }}>
                      <Text style={{ color: colors.text, fontSize: 24 }}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Stats Summary */}
                  <View style={{ backgroundColor: colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>Current Streak</Text>
                        <Text style={{ color: isGood ? colors.success : colors.danger, fontSize: FontSize.lg, fontWeight: '700' }}>
                          {habit.streak}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>Best Streak</Text>
                        <Text style={{ color: colors.accent, fontSize: FontSize.lg, fontWeight: '700' }}>
                          {habit.bestStreak}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>Completion</Text>
                        <Text style={{ color: colors.success, fontSize: FontSize.lg, fontWeight: '700' }}>
                          {completionRate}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Date Filter */}
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
                    {(['week', 'month', 'all'] as const).map(filter => (
                      <TouchableOpacity
                        key={filter}
                        style={[styles.summaryTab, historyDateFilter === filter && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                        onPress={() => setHistoryDateFilter(filter)}
                      >
                        <Text style={[styles.summaryTabText, historyDateFilter === filter && { color: colors.text, fontWeight: '700' }]}>
                          {filter === 'week' ? 'Week' : filter === 'month' ? 'Month' : 'All'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Completion History */}
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {filteredDates.length > 0 ? (
                      filteredDates.map((date, idx) => (
                        <View key={`${date}-${idx}`} style={[styles.historyDateEntry, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.historyDateText, { color: colors.text }]}>
                            {formatDisplayDate(date)}
                          </Text>
                          <Text style={{ color: isGood ? colors.success : colors.danger, fontSize: FontSize.md }}>
                            {isGood ? '✓' : '✗'}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={[styles.emptyNote, { color: colors.textSecondary, textAlign: 'center' }]}>
                        No {historyDateFilter === 'week' ? 'this week' : historyDateFilter === 'month' ? 'this month' : ''} completions
                      </Text>
                    )}
                  </ScrollView>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ── DASHBOARD CUSTOMIZE MODAL ─────────────────────────────────────── */}
      <Modal
        visible={showCustomizeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomizeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>⚙️ Customize Dashboard</Text>
            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
              Toggle cards on or off. Save to keep your preferences.
            </Text>
            <ScrollView>
              {([
                { key: 'showMotivationQuote', label: '💬 Daily Motivation Quote' },
                { key: 'showStreakHighlight', label: '🔥 Streak Highlight' },
                { key: 'showAvoidedBadHabits', label: '✨ Avoided Bad Habits Badge' },
                { key: 'showSummary', label: '📈 Weekly/Monthly Summary' },
                { key: 'showAnalyticsButton', label: '📊 Analytics Button' },
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
            <View style={[styles.formButtonRow, { marginTop: Spacing.md }]}>
              <Button
                title="Save"
                variant="primary"
                size="small"
                onPress={savePrefs}
                style={styles.formBtnFlex}
              />
              <Button
                title="Cancel"
                variant="ghost"
                size="small"
                onPress={() => setShowCustomizeModal(false)}
                style={styles.formBtnFlex}
              />
            </View>
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
  temptedBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginLeft: Spacing.xs,
  },
  temptedBtnText: {
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
  adviceBox: {
    borderLeftWidth: 4,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  adviceText: {
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.5,
    fontWeight: '500',
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
  // ＋ New Habit trigger button
  addHabitTrigger: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addHabitTriggerText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  // Section label above habit list
  habitListLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  // Habit row
  editHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  editHabitInfo: {
    flex: 1,
  },
  editHabitName: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  editHabitStreak: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  habitRowActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  habitActionBtn: {
    padding: Spacing.xs,
  },
  // Inline form (shared by Add and Edit)
  inlineForm: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  typePillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typePill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  typePillText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#888',
  },
  typePillTextActive: {
    color: '#fff',
  },
  inlineFormActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  inlineActionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  inlineActionBtnPrimary: {
    borderWidth: 0,
  },
  inlineActionBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },

  bottomPad: {
    height: Spacing.xl,
  },

  // Analytics & Gamification Styles
  dailyQuote: {
    fontStyle: 'italic',
  },
  streakHighlightText: {
    textAlign: 'center',
  },
  streakHighlightNumber: {
    textAlign: 'center',
  },
  streakHighlightHabit: {
    textAlign: 'center',
  },
  avoidedHabitsText: {
    textAlign: 'center',
  },
  avoidedHabitsXp: {
    textAlign: 'center',
  },
  summaryTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  summaryTabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#888',
  },
  analyticsModal: {
    maxHeight: '90%',
    paddingBottom: Spacing.lg,
  },
  analyticsTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  analyticsTabText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  habitAnalyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  habitAnalyticsName: {
    flex: 1,
  },
  habitAnalyticsRate: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  historyModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  historyDateEntry: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDateText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  progressBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
});
