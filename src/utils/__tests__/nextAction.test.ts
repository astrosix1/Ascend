import { pickNextHabit, getDayState } from '../nextAction';
import type { Habit } from '../types';

const T = '2026-10-03';
const h = (over: Partial<Habit>): Habit => ({
  id: 'x', name: 'x', type: 'good', streak: 0, bestStreak: 0, completedDates: [], createdAt: '2026-09-01', ...over,
} as Habit);

describe('pickNextHabit', () => {
  it('returns null with no open good habits', () => {
    expect(pickNextHabit([], T)).toBeNull();
    expect(pickNextHabit([h({ type: 'bad' })], T)).toBeNull();
    expect(pickNextHabit([h({ completedDates: [T] })], T)).toBeNull();
  });

  it('prefers the habit with the longest streak (most to lose)', () => {
    const a = h({ id: 'a', streak: 2 });
    const b = h({ id: 'b', streak: 9 });
    expect(pickNextHabit([a, b], T)?.id).toBe('b');
  });

  it('breaks ties by earliest created, and skips completed habits', () => {
    const a = h({ id: 'a', createdAt: '2026-09-05' });
    const b = h({ id: 'b', createdAt: '2026-09-01' });
    const done = h({ id: 'c', streak: 50, completedDates: [T] });
    expect(pickNextHabit([a, b, done], T)?.id).toBe('b');
  });
});

describe('getDayState', () => {
  it('reports empty, next and done', () => {
    expect(getDayState([], T).kind).toBe('empty');
    expect(getDayState([h({ type: 'bad' })], T).kind).toBe('empty');
    const s = getDayState([h({ id: 'a' }), h({ id: 'b', completedDates: [T] })], T);
    expect(s).toMatchObject({ kind: 'next', remaining: 1, total: 2 });
    expect(getDayState([h({ completedDates: [T] })], T)).toEqual({ kind: 'done', total: 1 });
  });
});
