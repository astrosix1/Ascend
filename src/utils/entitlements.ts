/**
 * Premium entitlement rules. Must match GeoIntel's entitlements.py and asix.live:
 *  - premium = subscription status 'active' or 'trialing'
 *  - a 'canceled' subscription stays premium until current_period_end passes
 *  - anything else — including no row, or a lookup error — is FREE (fail closed)
 */
export interface SubscriptionRow {
  status?: string | null;
  current_period_end?: string | number | null;
}

export function isPremiumSubscription(
  sub: SubscriptionRow | null | undefined,
  now: Date = new Date()
): boolean {
  if (!sub || !sub.status) return false;
  if (sub.status === 'active' || sub.status === 'trialing') return true;
  if (sub.status === 'canceled' && sub.current_period_end != null) {
    const end = typeof sub.current_period_end === 'number'
      // Stripe-style unix seconds
      ? sub.current_period_end * 1000
      : Date.parse(sub.current_period_end);
    return Number.isFinite(end) && end > now.getTime();
  }
  return false;
}
