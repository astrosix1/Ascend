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
          throw new Error('Supabase not configured');
        }

        // First, get the ascend project ID
        const { data: ascendProject, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('slug', 'ascend')
          .single();

        if (projectError) {
          throw new Error('Failed to find ascend project');
        }

        // Check for "ascend" app subscription
        const { data: ascendSub, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('project_id', ascendProject.id)
          .maybeSingle();

        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          throw subscriptionError;
        }

        setSubscription(ascendSub);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [userId]);

  return {
    subscription,
    loading,
    error,
    hasAccess: subscription?.status === 'active' || subscription?.status === 'trialing',
  };
}
