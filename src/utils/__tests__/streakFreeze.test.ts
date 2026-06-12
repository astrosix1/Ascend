import {
  resolveStreakOnComplete,
  wouldUseFreeze,
  shiftDate,
  MAX_FREEZE_TOKENS,
} from '../streakFreeze';

const DATE = '2026-06-12';
const YDAY = '2026-06-11';
const DBEFORE = '2026-06-10';

describe('shiftDate', () => {
  it('shifts within a month', () => {
    expect(shiftDate('2026-06-12', -1)).toBe('2026-06-11');
    expect(shiftDate('2026-06-12', -2)).toBe('2026-06-10');
  });
  it('handles month boundaries', () => {
    expect(shiftDate('2026-06-01', -1)).toBe('2026-05-31');
  });
});

describe('resolveStreakOnComplete — continuity (no freeze needed)', () => {
  it('continues a good-habit streak when yesterday was completed', () => {
    const r = resolveStreakOnComplete({
      type: 'good', completedDates: [YDAY], streak: 5, freezeTokens: 1, date: DATE,
    });
    expect(r.newStreak).toBe(6);
    expect(r.didFreeze).toBe(false);
    expect(r.freezeTokens).toBe(1); // untouched
  });

  it('continues a bad-habit streak identically (no freeze ever)', () => {
    const r = resolveStreakOnComplete({
      type: 'bad', completedDates: [YDAY], streak: 9, date: DATE,
    });
    expect(r.newStreak).toBe(10);
    expect(r.didFreeze).toBe(false);
    expect(r.earnedFreeze).toBe(false);
  });
});

describe('resolveStreakOnComplete — freeze bridging (good habits only)', () => {
  it('spends a token to bridge an exactly-one-day gap', () => {
    const r = resolveStreakOnComplete({
      type: 'good', completedDates: [DBEFORE], streak: 5, freezeTokens: 1, date: DATE,
    });
    expect(r.newStreak).toBe(6);
    expect(r.didFreeze).toBe(true);
    expect(r.freezeTokens).toBe(0);
    expect(r.frozenDates).toContain(YDAY);
  });

  it('resets to 1 on a one-day gap when no token is available', () => {
    const r = resolveStreakOnComplete({
      type: 'good', completedDates: [DBEFORE], streak: 5, freezeTokens: 0, date: DATE,
    });
    expect(r.newStreak).toBe(1);
    expect(r.didFreeze).toBe(false);
  });

  it('does NOT bridge a multi-day gap even with a token', () => {
    const r = resolveStreakOnComplete({
      type: 'good', completedDates: ['2026-06-09'], streak: 5, freezeTokens: 2, date: DATE,
    });
    expect(r.newStreak).toBe(1);
    expect(r.didFreeze).toBe(false);
    expect(r.freezeTokens).toBe(2); // not spent
  });

  it('never bridges a bad-habit gap, even if tokens are present', () => {
    const r = resolveStreakOnComplete({
      type: 'bad', completedDates: [DBEFORE], streak: 30, freezeTokens: 2, date: DATE,
    });
    expect(r.newStreak).toBe(1); // honest reset — sobriety integrity
    expect(r.didFreeze).toBe(false);
  });

  it('does not bridge from a zero streak', () => {
    const r = resolveStreakOnComplete({
      type: 'good', completedDates: [DBEFORE], streak: 0, freezeTokens: 2, date: DATE,
    });
    expect(r.newStreak).toBe(1);
    expect(r.didFreeze).toBe(false);
  });
});

describe('resolveStreakOnComplete — earning tokens', () => {
  it('earns a token when a good-habit streak crosses a multiple of 7', () => {
    const r = resolveStreakOnComplete({
      type: 'good', completedDates: [YDAY], streak: 6, freezeTokens: 0, date: DATE,
    });
    expect(r.newStreak).toBe(7);
    expect(r.earnedFreeze).toBe(true);
    expect(r.freezeTokens).toBe(1);
  });

  it('does not earn on non-milestone days', () => {
    const r = resolveStreakOnComplete({
      type: 'good', completedDates: [YDAY], streak: 7, freezeTokens: 0, date: DATE,
    });
    expect(r.newStreak).toBe(8);
    expect(r.earnedFreeze).toBe(false);
  });

  it('caps tokens at MAX_FREEZE_TOKENS', () => {
    const r = resolveStreakOnComplete({
      type: 'good', completedDates: [YDAY], streak: 6, freezeTokens: MAX_FREEZE_TOKENS, date: DATE,
    });
    expect(r.earnedFreeze).toBe(false);
    expect(r.freezeTokens).toBe(MAX_FREEZE_TOKENS);
  });

  it('bad habits never earn at a milestone', () => {
    const r = resolveStreakOnComplete({
      type: 'bad', completedDates: [YDAY], streak: 6, date: DATE,
    });
    expect(r.newStreak).toBe(7);
    expect(r.earnedFreeze).toBe(false);
  });
});

describe('wouldUseFreeze', () => {
  it('predicts a bridge without mutating', () => {
    expect(wouldUseFreeze({
      type: 'good', completedDates: [DBEFORE], streak: 5, freezeTokens: 1, date: DATE,
    })).toBe(true);
    expect(wouldUseFreeze({
      type: 'good', completedDates: [YDAY], streak: 5, freezeTokens: 1, date: DATE,
    })).toBe(false);
  });
});
