/**
 * Recovery Milestones
 * ───────────────────
 * Research-grounded health/recovery milestones that unlock as a user's
 * clean streak (days avoided) grows. Surfaces the "what have my clean days
 * actually done for me" context that recovery users consistently ask for.
 *
 * Design:
 *  - A UNIVERSAL track applies to every bad habit (behavioral / dopamine
 *    / sleep / mood recovery that holds across habit types).
 *  - Optional OVERLAY tracks (nicotine, alcohol) are matched by keyword in
 *    the habit name/category and merged in, so a "Quit smoking" habit also
 *    shows cardiovascular milestones.
 *
 * Phrasing is deliberately hedged ("often", "for many people") — individual
 * recovery varies, and we attribute the physiological tracks to their source.
 */

import { Habit } from '../utils/types';

export type RecoverySystem =
  | 'brain'
  | 'sleep'
  | 'mood'
  | 'body'
  | 'heart'
  | 'identity';

export interface RecoveryMilestone {
  id: string;
  atDays: number;   // days clean at which this unlocks (fractional = hours)
  when: string;     // human label, e.g. "Day 3", "20 minutes", "1 year"
  title: string;    // short headline
  body: string;     // 1–2 sentence explanation
  system: RecoverySystem;
  icon: string;
}

export interface RecoveryTrack {
  key: string;
  label: string;
  source: string;
  milestones: RecoveryMilestone[];
}

export const SYSTEM_META: Record<RecoverySystem, { label: string; icon: string }> = {
  brain: { label: 'Brain & reward', icon: '🧠' },
  sleep: { label: 'Sleep', icon: '😴' },
  mood: { label: 'Mood', icon: '🌤️' },
  body: { label: 'Body', icon: '💪' },
  heart: { label: 'Heart', icon: '❤️' },
  identity: { label: 'Identity', icon: '✨' },
};

// ── Universal track — applies to any habit you're breaking ──────────────────
const UNIVERSAL: RecoveryTrack = {
  key: 'universal',
  label: 'General recovery',
  source: 'Behavioral-change & neuroscience research (general consensus)',
  milestones: [
    {
      id: 'u-start',
      atDays: 0,
      when: 'Day 0',
      title: 'You made the decision',
      body: 'The hardest rep is the first one. Your streak starts now — every clean day from here compounds.',
      system: 'identity',
      icon: '🚀',
    },
    {
      id: 'u-1',
      atDays: 1,
      when: 'Day 1',
      title: 'Withdrawal peaks',
      body: 'Cravings and irritability are often strongest in the first 24–72 hours as your reward system notices the change. This is the dip, not the destination.',
      system: 'brain',
      icon: '🌊',
    },
    {
      id: 'u-3',
      atDays: 3,
      when: 'Day 3',
      title: 'Through the worst of it',
      body: 'For many people the sharpest cravings begin easing after ~72 hours. Sleep may still be rough, but the acute phase is passing.',
      system: 'mood',
      icon: '🌥️',
    },
    {
      id: 'u-7',
      atDays: 7,
      when: '1 week',
      title: 'Sleep starts to settle',
      body: 'A full week clean. Sleep and energy commonly begin to improve, and cravings arrive less often and pass more quickly.',
      system: 'sleep',
      icon: '😴',
    },
    {
      id: 'u-14',
      atDays: 14,
      when: '2 weeks',
      title: 'Dopamine rebalancing',
      body: 'Your reward system is recalibrating to everyday pleasures. Things that felt flat can start to feel good again.',
      system: 'brain',
      icon: '🧠',
    },
    {
      id: 'u-30',
      atDays: 30,
      when: '30 days',
      title: 'The loop weakens',
      body: 'One month in. The automatic habit loop is losing strength as new neural pathways take over the old cue→routine→reward wiring.',
      system: 'brain',
      icon: '🔗',
    },
    {
      id: 'u-90',
      atDays: 90,
      when: '90 days',
      title: 'The reset',
      body: 'Ninety days is a milestone widely used in recovery for a reason — prefrontal (self-control) circuitry strengthens and the new behavior feels far more natural.',
      system: 'brain',
      icon: '🧭',
    },
    {
      id: 'u-180',
      atDays: 180,
      when: '6 months',
      title: 'The new normal',
      body: 'Half a year. Staying clean is increasingly part of who you are rather than a daily battle you have to win.',
      system: 'identity',
      icon: '🌱',
    },
    {
      id: 'u-365',
      atDays: 365,
      when: '1 year',
      title: 'One full year',
      body: 'A year of clean days. The change is durable — you have proof, across every season, that you can do this.',
      system: 'identity',
      icon: '🏆',
    },
  ],
};

// ── Nicotine overlay (CDC / U.S. Surgeon General cessation timeline) ─────────
const NICOTINE: RecoveryTrack = {
  key: 'nicotine',
  label: 'Smoking / nicotine',
  source: 'CDC & U.S. Surgeon General smoking-cessation timeline',
  milestones: [
    {
      id: 'n-20m',
      atDays: 20 / 1440,
      when: '20 minutes',
      title: 'Heart rate drops',
      body: 'Within about 20 minutes of your last cigarette, heart rate and blood pressure begin to fall back toward normal.',
      system: 'heart',
      icon: '❤️',
    },
    {
      id: 'n-12h',
      atDays: 0.5,
      when: '12 hours',
      title: 'Carbon monoxide clears',
      body: 'The carbon monoxide level in your blood drops to normal, letting your blood carry oxygen more effectively.',
      system: 'heart',
      icon: '🫁',
    },
    {
      id: 'n-14',
      atDays: 14,
      when: '2 weeks–3 months',
      title: 'Circulation improves',
      body: 'Circulation and lung function start to improve, making physical activity noticeably easier.',
      system: 'body',
      icon: '🩸',
    },
    {
      id: 'n-30',
      atDays: 30,
      when: '1–9 months',
      title: 'Lungs recover',
      body: 'Coughing and shortness of breath decrease as tiny cilia regrow in the lungs and clear mucus more effectively.',
      system: 'body',
      icon: '🫁',
    },
    {
      id: 'n-365',
      atDays: 365,
      when: '1 year',
      title: 'Heart-disease risk halved',
      body: 'After one smoke-free year, your excess risk of coronary heart disease is about half that of a person who still smokes.',
      system: 'heart',
      icon: '❤️',
    },
  ],
};

// ── Alcohol overlay (general hepatology / abstinence research) ───────────────
const ALCOHOL: RecoveryTrack = {
  key: 'alcohol',
  label: 'Alcohol',
  source: 'General hepatology & alcohol-abstinence research',
  milestones: [
    {
      id: 'a-7',
      atDays: 7,
      when: '1 week',
      title: 'Deeper sleep & hydration',
      body: 'Without alcohol disrupting REM cycles, sleep quality and hydration commonly improve within the first week.',
      system: 'sleep',
      icon: '💧',
    },
    {
      id: 'a-14',
      atDays: 14,
      when: '2 weeks',
      title: 'Gut & energy settle',
      body: 'Stomach irritation and reflux often calm down, and many people report steadier daytime energy.',
      system: 'body',
      icon: '🔋',
    },
    {
      id: 'a-30',
      atDays: 30,
      when: '3–4 weeks',
      title: 'Liver fat drops',
      body: 'Around a month of abstinence, liver fat can fall substantially and blood pressure often begins to improve.',
      system: 'body',
      icon: '🫀',
    },
    {
      id: 'a-90',
      atDays: 90,
      when: '3 months',
      title: 'Liver markers improve',
      body: 'Liver-function markers improve for many people, and the liver continues to repair earlier damage.',
      system: 'body',
      icon: '🌿',
    },
  ],
};

const OVERLAYS: { track: RecoveryTrack; keywords: string[] }[] = [
  {
    track: NICOTINE,
    keywords: ['smok', 'vap', 'nicotine', 'cigarette', 'cigar', 'tobacco', 'juul'],
  },
  {
    track: ALCOHOL,
    keywords: ['alcohol', 'drink', 'booze', 'beer', 'wine', 'liquor', 'whiskey', 'vodka'],
  },
];

export interface RecoveryTimeline {
  daysClean: number;
  reachedCount: number;
  total: number;
  milestones: (RecoveryMilestone & { reached: boolean })[];
  nextMilestone: RecoveryMilestone | null;
  /** Progress (0–1) from the previous reached milestone to the next one. */
  progressToNext: number;
  sources: string[];
}

/** Detect which overlay (if any) applies to a habit by keyword. */
export function detectOverlay(habit: Pick<Habit, 'name' | 'category'>): RecoveryTrack | null {
  const haystack = `${habit.name} ${habit.category ?? ''}`.toLowerCase();
  for (const { track, keywords } of OVERLAYS) {
    if (keywords.some(k => haystack.includes(k))) return track;
  }
  return null;
}

/**
 * Build the recovery timeline for a habit given its current clean streak.
 * Merges the universal track with any matched overlay, sorted chronologically.
 */
export function getRecoveryTimeline(habit: Pick<Habit, 'name' | 'category' | 'streak'>): RecoveryTimeline {
  const daysClean = Math.max(0, habit.streak || 0);
  const overlay = detectOverlay(habit);

  const tracks = overlay ? [UNIVERSAL, overlay] : [UNIVERSAL];
  const merged = tracks
    .flatMap(t => t.milestones)
    .sort((a, b) => a.atDays - b.atDays);

  const milestones = merged.map(m => ({ ...m, reached: daysClean >= m.atDays }));
  const reachedCount = milestones.filter(m => m.reached).length;
  const nextMilestone = merged.find(m => daysClean < m.atDays) ?? null;

  // progress from the last reached milestone to the next one
  let progressToNext = 1;
  if (nextMilestone) {
    const prevAt = [...merged].reverse().find(m => daysClean >= m.atDays)?.atDays ?? 0;
    const span = nextMilestone.atDays - prevAt;
    progressToNext = span <= 0 ? 0 : Math.min(1, Math.max(0, (daysClean - prevAt) / span));
  }

  return {
    daysClean,
    reachedCount,
    total: milestones.length,
    milestones,
    nextMilestone,
    progressToNext,
    sources: tracks.map(t => t.source),
  };
}
