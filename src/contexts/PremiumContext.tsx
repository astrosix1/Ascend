import React, { createContext, useContext, ReactNode } from 'react';
import { useApp } from './AppContext';
import { useSubscription } from '../hooks/useSubscription';

interface PremiumState {
  /** True only for a signed-in member with an active/trialing (or not-yet-lapsed canceled) subscription. */
  isPremium: boolean;
  /** True while the entitlement lookup is in flight. Treat as free until it resolves. */
  loading: boolean;
}

const PremiumContext = createContext<PremiumState>({ isPremium: false, loading: false });

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { currentUserId } = useApp();
  const { isPremium, loading } = useSubscription(currentUserId);
  return (
    <PremiumContext.Provider value={{ isPremium, loading }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumState {
  return useContext(PremiumContext);
}
