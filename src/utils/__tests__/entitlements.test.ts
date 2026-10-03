import { isPremiumSubscription } from '../entitlements';

const now = new Date('2026-10-02T12:00:00Z');
const future = '2026-11-01T00:00:00Z';
const past = '2026-09-01T00:00:00Z';

describe('isPremiumSubscription', () => {
  it('is free with no subscription', () => {
    expect(isPremiumSubscription(null, now)).toBe(false);
    expect(isPremiumSubscription(undefined, now)).toBe(false);
    expect(isPremiumSubscription({}, now)).toBe(false);
  });

  it('is premium when active or trialing', () => {
    expect(isPremiumSubscription({ status: 'active' }, now)).toBe(true);
    expect(isPremiumSubscription({ status: 'trialing' }, now)).toBe(true);
  });

  it('keeps canceled premium until current_period_end passes', () => {
    expect(isPremiumSubscription({ status: 'canceled', current_period_end: future }, now)).toBe(true);
    expect(isPremiumSubscription({ status: 'canceled', current_period_end: past }, now)).toBe(false);
    expect(isPremiumSubscription({ status: 'canceled', current_period_end: Date.parse(future) / 1000 }, now)).toBe(true);
  });

  it('is free for canceled without a period end, and for past_due/unpaid', () => {
    expect(isPremiumSubscription({ status: 'canceled' }, now)).toBe(false);
    expect(isPremiumSubscription({ status: 'canceled', current_period_end: 'garbage' }, now)).toBe(false);
    expect(isPremiumSubscription({ status: 'past_due' }, now)).toBe(false);
    expect(isPremiumSubscription({ status: 'unpaid' }, now)).toBe(false);
  });
});
