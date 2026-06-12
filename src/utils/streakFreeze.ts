/**
 * Streak Freeze
 * ─────────────
 * A forgiveness mechanic for GOOD habits: a single missed day can be bridged
 * by spending a "freeze" token, so one slip doesn't reset a long streak to
 * zero. Duolingo's equivalent cut churn ~21% for at-risk users by removing the
 * all-or-nothing anxiety while keeping the loss-aversion loop intact.
 *
 * IMPORTANT — good habits only. This never applies to 'bad' (sobriety) habits:
 * the integrity of "days clean" matters, and the relapse flow already handles
 * slips honestly. For bad habits this resolver reproduces the prior behavior
 * exactly (continue if yesterday done, else reset to 1).
 *
 * Tokens are earned by reaching streak milestones (every 7 days), capped low so
 * the mechanic stays a safety net rather than a way to fake consistency.
 */

export const MAX_FREEZE_TOKENS = 2;
export const FREEZE_EARN_INTERVAL = 7;

export interface StreakResolution {
  newStreak: number;
  freezeTokens: number;
  frozenDates: string[];
  didFreeze: boolean;   // a token was spent to bridge a missed day
  earnedFreeze: boolean; // a token was earned by hitting a milestone
}

/** Shift a YYYY-MM-DD date string by whole days (UTC, matching existing code). */
export function shiftDate(iso: string, deltaDays: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().split('T')[0];
}

export interface ResolveParams {
  type: 'good' | 'bad';
  completedDates: string[]; // BEFORE adding `date`
  frozenDates?: string[];
  streak: number;
  freezeTokens?: number;
  date: string; // the day being completed (YYYY-MM-DD)
}

/**
 * Resolve a habit's streak when it is completed on `date`.
 * For good habits, may spend one freeze token to bridge a single missed day.
 */
export function resolveStreakOnComplete(params: ResolveParams): StreakResolution {
  const { type, completedDates, streak, date } = params;
  const frozenDates = params.frozenDates ?? [];
  let freezeTokens = params.freezeTokens ?? 0;

  const yesterday = shiftDate(date, -1);
  const dayBefore = shiftDate(date, -2);

  const continuous = completedDates.includes(yesterday) || frozenDates.includes(yesterday);

  let newStreak: number;
  let newFrozenDates = frozenDates;
  let didFreeze = false;

  if (continuous) {
    // Yesterday was completed (or already frozen) — streak continues.
    newStreak = streak + 1;
  } else {
    // There's a gap. Only a GOOD habit with a token AND an exactly-one-day gap
    // (i.e. the day before yesterday was active) can bridge it.
    const oneDayGap = completedDates.includes(dayBefore) || frozenDates.includes(dayBefore);
    if (type === 'good' && freezeTokens > 0 && oneDayGap && streak > 0) {
      newStreak = streak + 1;
      freezeTokens -= 1;
      newFrozenDates = [...frozenDates, yesterday];
      didFreeze = true;
    } else {
      newStreak = 1; // fresh start after an unbridged gap
    }
  }

  // Earn a token on crossing a milestone (good habits only), capped.
  let earnedFreeze = false;
  if (
    type === 'good' &&
    newStreak > streak &&
    newStreak % FREEZE_EARN_INTERVAL === 0 &&
    freezeTokens < MAX_FREEZE_TOKENS
  ) {
    freezeTokens += 1;
    earnedFreeze = true;
  }

  return { newStreak, freezeTokens, frozenDates: newFrozenDates, didFreeze, earnedFreeze };
}

/**
 * Lightweight prediction for UI feedback (e.g. a "streak saved" toast) without
 * mutating state. Returns whether completing `date` would spend a freeze.
 */
export function wouldUseFreeze(params: ResolveParams): boolean {
  return resolveStreakOnComplete(params).didFreeze;
}
