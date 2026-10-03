/**
 * Pure date/stat calculation helpers for the Dashboard screen.
 * Extracted out of DashboardScreen.tsx (previously ~220 lines of free-standing
 * helper functions living inside a single 4,899-line screen component).
 */
import { Habit } from './types';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Motivation quotes for daily inspiration (v2.1)
export const MOTIVATION_QUOTES = [
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

export function getToday(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Get consistent daily motivation quote
export function getQuoteForDay(date: string): string {
  const seed = parseInt(date.replace(/-/g, ''));
  return MOTIVATION_QUOTES[seed % MOTIVATION_QUOTES.length];
}

// Get daily habit completion level (0-3) for calendar heatmap
// Returns: 0=no activity, 1=1-2 habits, 2=3+ habits, 3=all good habits completed
export function getDailyCompletionLevel(date: string, habits: Habit[]): number {
  const goodHabits = habits.filter(h => h.type === 'good');
  if (goodHabits.length === 0) return 0;

  const completedCount = goodHabits.filter(h => h.completedDates.includes(date)).length;

  if (completedCount === 0) return 0;
  if (completedCount === goodHabits.length) return 3; // Perfect day
  if (completedCount >= 3) return 2; // Most habits
  return 1; // Some habits
}

// Calculate completion rate for a habit
export function getHabitCompletionRate(habit: { completedDates: string[]; createdAt: string }): number {
  const daysSinceCreated = Math.max(1,
    Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / (24 * 60 * 60 * 1000))
  );
  return Math.round((habit.completedDates.length / daysSinceCreated) * 100);
}

// Calculate week statistics
export function calculateWeekStats(habits: Habit[], today: string) {
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
export function calculateMonthStats(habits: Habit[], today: string) {
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
export function buildWeeklyData(habits: Habit[]): number[] {
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

export function buildMonthlyData(habits: Habit[]): number[] {
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

export function buildYearlyData(habits: Habit[]): number[] {
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

export function buildCumulativeWeeklyData(habits: Habit[]): number[] {
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

export function buildCumulativeMonthlyData(habits: Habit[]): number[] {
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

export function buildCumulativeYearlyData(habits: Habit[]): number[] {
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
