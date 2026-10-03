import type { Habit } from './types';

/**
 * The single habit to suggest next: the not-yet-done good habit with the
 * longest running streak (it has the most to lose), then the one added
 * earliest. Returns null when every good habit is done (or there are none).
 */
export function pickNextHabit(habits: Habit[], today: string): Habit | null {
  const open = habits.filter(h => h.type === 'good' && !h.completedDates.includes(today));
  if (open.length === 0) return null;
  return [...open].sort((a, b) => {
    if (b.streak !== a.streak) return b.streak - a.streak;
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  })[0];
}

export type DayState =
  | { kind: 'empty' }
  | { kind: 'next'; habit: Habit; remaining: number; total: number }
  | { kind: 'done'; total: number };

export function getDayState(habits: Habit[], today: string): DayState {
  const good = habits.filter(h => h.type === 'good');
  if (good.length === 0) return { kind: 'empty' };
  const next = pickNextHabit(habits, today);
  if (!next) return { kind: 'done', total: good.length };
  const remaining = good.filter(h => !h.completedDates.includes(today)).length;
  return { kind: 'next', habit: next, remaining, total: good.length };
}
