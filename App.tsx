import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text } from 'react-native';
import { AppProvider, useApp, AppState } from './src/contexts/AppContext';
import { PremiumProvider } from './src/contexts/PremiumContext';
import LoadingSkeleton, { HabitRowSkeleton } from './src/components/LoadingSkeleton';
import AppNavigator from './src/navigation/AppNavigator';
import { loadRuntimeConfig, isSupabaseReady, getSupabaseClient } from './src/utils/runtimeConfig';
import { getSession, onAuthStateChange } from './src/utils/supabase';
import { getData, KEYS } from './src/utils/storage';
import { migrateGuestDataToCloud, hasGuestDataToMigrate, MigrationState } from './src/utils/migration';

interface AuthState {
  checked: boolean;
}

type SignedInUser = { id: string; email?: string | null };

function Root() {
  const appContext = useApp();
  const { isLoading, theme, syncUserData, prepareLocalDataFor, setCurrentUser } = appContext;
  const [auth, setAuth] = useState<AuthState>({ checked: false });
  const [migrationState, setMigrationState] = useState<MigrationState>({
    status: 'idle',
    progress: 0,
  });

  // Latest context for use inside the long-lived auth effect below.
  const appRef = useRef(appContext);
  appRef.current = appContext;

  // The user we have already handled sign-in for. supabase-js can emit
  // SIGNED_IN again (e.g. on tab refocus); re-running the sync then would
  // replace unsaved local edits with the cloud copy.
  const activeUserRef = useRef<string | null>(null);
  const signInRef = useRef<(user: SignedInUser) => Promise<void>>(async () => {});
  const failedUserRef = useRef<SignedInUser | null>(null);

  useEffect(() => {
    let subscription: any = null;
    let cancelled = false;
    const isWeb = typeof window !== 'undefined';

    // Signed-out visitors are guests: everything works, data stays on this
    // device. Local data tagged to an account is not theirs, so drop it.
    const continueAsGuest = async () => {
      activeUserRef.current = null;
      try {
        await prepareLocalDataFor(null);
      } catch (err) {
        console.error('[Auth] Could not clear previous account data:', err);
      }
      setCurrentUser(null, '');
    };

    const handleSignedIn = async (user: SignedInUser) => {
      if (activeUserRef.current === user.id) return;
      activeUserRef.current = user.id;
      failedUserRef.current = null;

      // Before anything is shown: if this device still holds a different
      // account's data, remove it so it's never displayed to this user.
      try {
        await prepareLocalDataFor(user.id);
      } catch (err) {
        console.error('[Auth] Could not prepare local data (sync will retry):', err);
      }

      // Guest → account: untagged local data was created before signing in
      // (and `ascend_migrated_<id>` marks accounts handled before data was
      // tagged). Merge it into the cloud BEFORE the normal sync, which would
      // otherwise let the cloud copy win and drop it.
      const migrationKey = `ascend_migrated_${user.id}`;
      const owner = await getData<string>(KEYS.DATA_OWNER);
      // Let React flush state that was set while local storage loaded.
      await new Promise(resolve => setTimeout(resolve, 0));
      const ctx = appRef.current as AppState;
      if (!owner && isWeb && !localStorage.getItem(migrationKey) && hasGuestDataToMigrate(ctx)) {
        setMigrationState({ status: 'in_progress', progress: 0 });
        const result = await migrateGuestDataToCloud(user.id, ctx, setMigrationState);
        if (!result.success) {
          // Don't sync: that would discard the guest data. The failure screen
          // offers a retry; a backup is in localStorage (guest_data_backup_<id>).
          failedUserRef.current = user;
          activeUserRef.current = null;
          setAuth({ checked: true });
          return;
        }
        localStorage.setItem(migrationKey, 'true');
        setMigrationState({ status: 'idle', progress: 0 });
      } else if (isWeb) {
        localStorage.setItem(migrationKey, 'true');
      }

      setCurrentUser(user.id, user.email || '');
      setAuth({ checked: true });
      syncUserData(user.id).catch(err => {
        console.error('[Auth] Sync failed:', err);
      });
    };
    signInRef.current = handleSignedIn;

    (async () => {
      try {
        await loadRuntimeConfig();

        if (isSupabaseReady()) {
          const sb = getSupabaseClient();

          // Subscribe before reading the session so no auth event is missed.
          const result = onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              handleSignedIn(session.user);
            } else if (event === 'SIGNED_OUT') {
              continueAsGuest();
            }
          });
          subscription = result?.data?.subscription;
          if (cancelled) subscription?.unsubscribe();

          // Members launched from asix.live arrive with their session in the URL
          // fragment: #access_token=...&refresh_token=... Read it, then strip it.
          // (asix.live's /login?return_to= flow returns only an access_token;
          // supabase-js can't build a session without a refresh_token, so that
          // case just leaves the visitor a guest.)
          if (isWeb && sb && window.location.hash) {
            try {
              const params = new URLSearchParams(window.location.hash.substring(1));
              const access_token = params.get('access_token');
              const refresh_token = params.get('refresh_token');
              if (access_token && refresh_token) {
                await sb.auth.setSession({
                  access_token: decodeURIComponent(access_token),
                  refresh_token: decodeURIComponent(refresh_token),
                });
              } else if (access_token) {
                console.warn('[Auth] Got an access token without a refresh token; continuing as guest.');
              }
              if (access_token) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
              }
            } catch (hashErr) {
              console.warn('[Auth] Failed to parse hash tokens:', hashErr);
            }
          }

          const session = await getSession();
          if (session?.user) {
            await handleSignedIn(session.user);
            return;
          }
        }
        await continueAsGuest();
      } catch (error) {
        console.error('Auth setup error:', error);
      } finally {
        setAuth({ checked: true });
      }
    })();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

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
          ⚠️ Couldn't move your data to your account
        </Text>
        <Text style={{ color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
          {migrationState.error}
        </Text>
        <Text
          style={{ color: '#F5A623', fontSize: 12, textAlign: 'center' }}
          onPress={() => {
            const user = failedUserRef.current;
            setMigrationState({ status: 'idle', progress: 0 });
            if (user) signInRef.current(user);
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

  // No login wall and no subscription wall: the whole app is open. Premium
  // features are gated individually where they are used (see usePremium).
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <PremiumProvider>
          <Root />
        </PremiumProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
