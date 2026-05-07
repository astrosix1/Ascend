import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/runtimeConfig';

interface Subscription {
  id: string;
  user_id: string;
  project_id: string;
  plan: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  stripe_subscription_id: string | null;
}

export function useSubscription(userId: string | null | undefined) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = getSupabaseClient();
        if (!supabase) {
          console.warn('[Subscription] Supabase not configured');
          throw new Error('Supabase not configured');
        }

        console.log('[Subscription] Fetching ascend project...');

        // First, get the ascend project ID
        const { data: ascendProject, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('slug', 'ascend')
          .single();

        if (projectError) {
          console.error('[Subscription] Failed to find ascend project:', projectError);
          throw new Error('Failed to find ascend project');
        }

        console.log('[Subscription] Found ascend project, checking user subscription...');

        // Check for "ascend" app subscription
        const { data: ascendSub, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('project_id', ascendProject.id)
          .maybeSingle();

        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          console.error('[Subscription] Error fetching subscription:', subscriptionError);
          throw subscriptionError;
        }

        console.log('[Subscription] Subscription check complete:', ascendSub ? 'Found' : 'Not found');
        setSubscription(ascendSub);
      } catch (err) {
        console.error('[Subscription] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSubscription(null);
      } finally {
        console.log('[Subscription] Loading complete');
        setLoading(false);
      }
    };

    console.log('[Subscription] Starting subscription check for user:', userId);
    fetchSubscription();
  }, [userId]);

  return {
    subscription,
    loading,
    error,
    hasAccess: subscription?.status === 'active' || subscription?.status === 'trialing',
  };
}
