import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/runtimeConfig';
import { ASIX_PROJECT_SLUG } from '../utils/env';
import { isPremiumSubscription, SubscriptionRow } from '../utils/entitlements';

/**
 * Premium entitlement for the signed-in user. Guests are free (no lookup).
 * Fails closed: any error while looking the subscription up means FREE.
 *
 * NOTE: this is a client-side check, fine for hiding UI but bypassable. Anything
 * with real cost or value must also be verified server-side.
 */
export function useSubscription(userId: string | null | undefined) {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setSubscription(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase not configured');

        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('slug', ASIX_PROJECT_SLUG)
          .single();
        if (projectError) throw projectError;

        const { data: sub, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('project_id', project.id)
          .maybeSingle();
        if (subError && subError.code !== 'PGRST116') throw subError;

        if (!cancelled) setSubscription(sub);
      } catch (err) {
        console.error('[Subscription] Lookup failed (treating as free):', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setSubscription(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return {
    subscription,
    loading,
    error,
    isPremium: isPremiumSubscription(subscription),
  };
}
