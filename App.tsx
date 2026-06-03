import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text } from 'react-native';
import { AppProvider, useApp } from './src/contexts/AppContext';
import LoadingSkeleton, { HabitRowSkeleton } from './src/components/LoadingSkeleton';
import AppNavigator from './src/navigation/AppNavigator';
import { loadRuntimeConfig, isSupabaseReady, getSupabaseClient } from './src/utils/runtimeConfig';
import { getSession, onAuthStateChange } from './src/utils/supabase';
import { migrateGuestDataToCloud, hasGuestDataToMigrate, MigrationState } from './src/utils/migration';
import { useSubscription } from './src/hooks/useSubscription';
import {
  performRedirect,
  buildLoginRedirectUrl,
} from './src/utils/authHelpers';

interface AuthState {
  checked: boolean;
  userId: string | null;
  email: string | null;
}


// Checks subscription for logged-in users.
// Redirects to projects/ascend page if no active subscription.
function LoggedInApp({ userId }: { userId: string }) {
  const { loading, hasAccess } = useSubscription(userId);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  if (!hasAccess) {
    // On localhost skip subscription check so devs can test freely
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
    if (!isLocalhost) {
      // No active subscription — redirect to projects page where they can subscribe
      performRedirect('https://asix.live/projects/ascend');
      return (
        <View style={{ flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F5A623" />
          <Text style={{ color: '#fff', marginTop: 16 }}>Redirecting...</Text>
        </View>
      );
    }
  }

  return <AppNavigator />;
}

function Root() {
  const { isLoading, theme, syncUserData, setCurrentUser, currentUserId, ...appContext } = useApp();
  const [auth, setAuth] = useState<AuthState>({
    checked: false,
    userId: null,
    email: null,
  });
  const [migrationState, setMigrationState] = useState<MigrationState>({
    status: 'idle',
    progress: 0,
  });
  const prevUserIdRef = useRef<string | null>(null);

  // Watch for logout — whenever currentUserId becomes null from a logged-in state
  useEffect(() => {
    if (!auth.checked) return;
    if (currentUserId === null && auth.userId !== null) {
      setAuth({ checked: true, userId: null, email: null });
    }
  }, [currentUserId, auth.checked, auth.userId]);

  // Trigger guest data migration when user signs in (runs once per user, ever)
  useEffect(() => {
    if (!currentUserId || prevUserIdRef.current === currentUserId) return;
    prevUserIdRef.current = currentUserId;

    const migrationKey = `ascend_migrated_${currentUserId}`;
    if (localStorage.getItem(migrationKey)) return;

    if (hasGuestDataToMigrate(appContext as any)) {
      console.log('[Migration] Guest data detected, starting migration...');
      setMigrationState({ status: 'in_progress', progress: 0 });

      migrateGuestDataToCloud(currentUserId, appContext as any, (state) => {
        setMigrationState(state);
      }).then((result) => {
        if (result.success) {
          localStorage.setItem(migrationKey, 'true');
          console.log('[Migration] Migration completed successfully');
          syncUserData(currentUserId).catch((err) => {
            console.error('[Migration] Sync after migration failed:', err);
          });
        } else {
          console.error('[Migration] Migration failed:', result.error);
        }
      });
    } else {
      localStorage.setItem(migrationKey, 'true');
    }
  }, [currentUserId]);

  useEffect(() => {
    let subscription: any = null;
    const isWeb = typeof window !== 'undefined';

    (async () => {
      try {
        await loadRuntimeConfig();

        if (isSupabaseReady()) {
          const sb = getSupabaseClient();

          // Check if tokens were passed in the URL hash (from "Launch Ascend App" button on asix.live)
          // e.g. ascend.asix.live#access_token=...&refresh_token=...
          if (isWeb && sb && window.location.hash) {
            try {
              const hash = window.location.hash.substring(1);
              const params = new URLSearchParams(hash);
              const access_token = params.get('access_token');
              const refresh_token = params.get('refresh_token');
              if (access_token && refresh_token) {
                console.log('[Auth] Found tokens in URL hash, setting session...');
                await sb.auth.setSession({
                  access_token: decodeURIComponent(access_token),
                  refresh_token: decodeURIComponent(refresh_token),
                });
                window.history.replaceState(null, '', window.location.pathname);
                console.log('[Auth] Session set from URL hash');
              }
            } catch (hashErr) {
              console.warn('[Auth] Failed to parse hash tokens:', hashErr);
            }
          }

          const session = await getSession();

          // On localhost: skip auth redirect so developers can test without logging in
          const isLocalhost = isWeb && (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1'
          );

          // No session on web → redirect to login (which sends user to projects/ascend after login)
          if (!session?.user && isWeb && !isLocalhost) {
            console.log('[Auth] No session found, redirecting to login');
            performRedirect(buildLoginRedirectUrl());
            return;
          }

          if (session?.user) {
            console.log('[Auth] Found existing session for:', session.user.email);
            setAuth({ checked: true, userId: session.user.id, email: session.user.email || null });
            setCurrentUser(session.user.id, session.user.email || '');
            syncUserData(session.user.id).catch(err => {
              console.error('[Auth] Sync failed for existing session:', err);
            });
            return;
          }

          // Subscribe to future auth changes (e.g. token auto-refresh)
          const result = onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('[Auth] Sign in event:', session.user.email);
              setAuth({ checked: true, userId: session.user.id, email: session.user.email || null });
              setCurrentUser(session.user.id, session.user.email || '');
              syncUserData(session.user.id).catch(err => {
                console.error('[Auth] Sync failed after sign in:', err);
              });
            } else if (event === 'SIGNED_OUT') {
              console.log('[Auth] Sign out event');
              setAuth({ checked: true, userId: null, email: null });
              setCurrentUser(null, '');
              const isLocalhost = isWeb && (
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1'
              );
              if (isWeb && !isLocalhost) {
                performRedirect(buildLoginRedirectUrl());
              }
            }
          });
          subscription = result?.data?.subscription;
        }
      } catch (error) {
        console.error('Auth setup error:', error);
      } finally {
        setAuth(prev => ({ ...prev, checked: true }));
      }
    })();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Show migration UI
  if (migrationState.status === 'in_progress') {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={{ color: '#fff', fontSize: 18, marginTop: 16, marginBottom: 8 }}>
          ⚙️ Setting up cloud sync...
        </Text>
        <Text style={{ color: '#888', fontSize: 12 }}>
          {Math.round(migrationState.progress)}% complete
        </Text>
      </View>
    );
  }

  if (migrationState.status === 'failed') {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: '#e74c3c', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
          ⚠️ Migration failed
        </Text>
        <Text style={{ color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
          {migrationState.error}
        </Text>
        <Text
          style={{ color: '#F5A623', fontSize: 12, textAlign: 'center' }}
          onPress={() => {
            setMigrationState({ status: 'idle', progress: 0 });
            if (currentUserId && hasGuestDataToMigrate(appContext as any)) {
              migrateGuestDataToCloud(currentUserId, appContext as any, setMigrationState);
            }
          }}
        >
          Tap to retry
        </Text>
      </View>
    );
  }

  if (!auth.checked || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F0F', padding: 16, paddingTop: 48 }}>
        <LoadingSkeleton height={88} borderRadius={14} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {[1, 2, 3].map(i => <LoadingSkeleton key={i} height={52} borderRadius={10} style={{ flex: 1 }} />)}
        </View>
        <LoadingSkeleton height={36} borderRadius={8} style={{ marginBottom: 4 }} />
        {[1, 2, 3, 4].map(i => <HabitRowSkeleton key={i} />)}
      </View>
    );
  }

  // No userId → redirect is in flight (unless on localhost, where we allow guest mode)
  const isLocalhostEnv = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
  if (!auth.userId && !isLocalhostEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Redirecting to login...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <LoggedInApp userId={auth.userId} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
