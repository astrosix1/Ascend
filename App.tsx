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

interface AuthState {
  checked: boolean;
  userId: string | null;
  email: string | null;
}


// Ascend is free to use: no login or subscription is required. Members arrive
// signed in from asix.live and get cloud sync; everyone else uses the app as a
// guest with local data (which migrates to the cloud if they sign in later).
// When premium features ship, check the subscription (useSubscription) where
// those features are used instead of gating the whole app here.
function LoggedInApp() {
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
                // Strip the tokens from the address bar and history first, so
                // they don't linger there if setSession fails (expired token).
                window.history.replaceState(null, '', window.location.pathname);
                await sb.auth.setSession({
                  access_token: decodeURIComponent(access_token),
                  refresh_token: decodeURIComponent(refresh_token),
                });
                console.log('[Auth] Session set from URL hash');
              }
            } catch (hashErr) {
              console.warn('[Auth] Failed to parse hash tokens:', hashErr);
            }
          }

          const session = await getSession();

          // No session is fine: the app runs in guest mode.
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

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <LoggedInApp />
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
