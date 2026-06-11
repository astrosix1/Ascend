import { getRecoveryTimeline, detectOverlay } from '../recoveryMilestones';

const base = { name: 'Quit habit', category: undefined };

describe('detectOverlay', () => {
  it('matches nicotine habits by keyword', () => {
    expect(detectOverlay({ name: 'Stop smoking', category: undefined })?.key).toBe('nicotine');
    expect(detectOverlay({ name: 'No vaping', category: undefined })?.key).toBe('nicotine');
  });

  it('matches alcohol habits by keyword', () => {
    expect(detectOverlay({ name: 'No drinking', category: undefined })?.key).toBe('alcohol');
    expect(detectOverlay({ name: 'Cut out wine', category: undefined })?.key).toBe('alcohol');
  });

  it('returns null for a generic habit', () => {
    expect(detectOverlay({ name: 'Stop doomscrolling', category: 'Digital Health' })).toBeNull();
  });
});

describe('getRecoveryTimeline', () => {
  it('at 0 days, only the Day 0 milestone is reached', () => {
    const t = getRecoveryTimeline({ ...base, streak: 0 });
    expect(t.daysClean).toBe(0);
    expect(t.reachedCount).toBe(1); // Day 0 (atDays 0) is reached
    expect(t.nextMilestone?.when).toBe('Day 1');
  });

  it('clamps negative streaks to 0', () => {
    const t = getRecoveryTimeline({ ...base, streak: -5 });
    expect(t.daysClean).toBe(0);
  });

  it('marks milestones at/under the streak as reached', () => {
    const t = getRecoveryTimeline({ ...base, streak: 30 });
    const u30 = t.milestones.find(m => m.id === 'u-30');
    const u90 = t.milestones.find(m => m.id === 'u-90');
    expect(u30?.reached).toBe(true);
    expect(u90?.reached).toBe(false);
    expect(t.nextMilestone?.id).toBe('u-90');
  });

  it('merges the nicotine overlay and keeps milestones chronological', () => {
    const t = getRecoveryTimeline({ name: 'Quit smoking', category: undefined, streak: 1 });
    // overlay adds the 20-minute + 12-hour milestones, reached at day 1
    expect(t.milestones.some(m => m.id === 'n-20m' && m.reached)).toBe(true);
    const ats = t.milestones.map(m => m.atDays);
    const sorted = [...ats].sort((a, b) => a - b);
    expect(ats).toEqual(sorted);
  });

  it('reports full completion past the final milestone', () => {
    const t = getRecoveryTimeline({ ...base, streak: 9999 });
    expect(t.nextMilestone).toBeNull();
    expect(t.reachedCount).toBe(t.total);
    expect(t.progressToNext).toBe(1);
  });
});
