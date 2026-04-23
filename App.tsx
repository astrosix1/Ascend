import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text } from 'react-native';
import { AppProvider, useApp } from './src/contexts/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/Auth/AuthScreen';
import { loadRuntimeConfig, isSupabaseReady } from './src/utils/runtimeConfig';
import { getSession, onAuthStateChange } from './src/utils/supabase';
import { clearAllData } from './src/utils/storage';
import { migrateGuestDataToCloud, hasGuestDataToMigrate, MigrationState } from './src/utils/migration';

interface AuthState {
  checked: boolean;
  userId: string | null;
  email: string | null;
  isGuest: boolean;
}

function Root() {
  const { isLoading, theme, syncUserData, setCurrentUser, currentUserId, currentUserEmail, resetAuth, resetSignal, ...appContext } = useApp();
  const [auth, setAuth] = useState<AuthState>({
    checked: false,
    userId: null,
    email: null,
    isGuest: false,
  });
  const [migrationState, setMigrationState] = useState<MigrationState>({
    status: 'idle',
    progress: 0,
  });
  const prevEmailRef = useRef<string>('');
  const prevUserIdRef = useRef<string | null>(null);

  // Watch for logout/reset - whenever currentUserId becomes null from a logged-in state
  useEffect(() => {
    if (!auth.checked) return;

    // Only reset if we were logged in AND currentUserId just became null
    // This prevents reset loops during initial load
    if (currentUserId === null && auth.userId !== null) {
      setAuth({ checked: true, userId: null, email: null, isGuest: false });
    }
  }, [currentUserId, auth.checked, auth.userId]);

  // Trigger guest data migration when user signs in
  useEffect(() => {
    if (!currentUserId || prevUserIdRef.current === currentUserId) {
      return; // User not logged in or already processed
    }

    prevUserIdRef.current = currentUserId;

    // Check if there's guest data to migrate
    if (hasGuestDataToMigrate(appContext as any)) {
      console.log('[Migration] Guest data detected, starting migration...');
      setMigrationState({ status: 'in_progress', progress: 0 });

      migrateGuestDataToCloud(currentUserId, appContext as any, (state) => {
        setMigrationState(state);
      }).then((result) => {
        if (result.success) {
          console.log('[Migration] Migration completed successfully');
          // Trigger full sync after migration to ensure all data is fresh
          syncUserData(currentUserId).catch((err) => {
            console.error('[Migration] Sync after migration failed:', err);
          });
        } else {
          console.error('[Migration] Migration failed:', result.error);
        }
      });
    }
  }, [currentUserId]);

  useEffect(() => {
    let subscription: any = null;

    (async () => {
      try {
        // Load API keys from storage first
        await loadRuntimeConfig();

        // Check for existing Supabase session
        if (isSupabaseReady()) {
          const session = await getSession();
          if (session?.user) {
            console.log('[Auth] Found existing session for:', session.user.email);
            setAuth({ checked: true, userId: session.user.id, email: session.user.email || null, isGuest: false });
            setCurrentUser(session.user.id, session.user.email || '');
            // Sync in background (fire and forget)
            syncUserData(session.user.id).then(() => {
              console.log('[Auth] Cloud data synced');
            }).catch(err => {
              console.error('[Auth] Sync failed for existing session:', err);
            });
            return;
          }

          // Subscribe to future auth changes
          const result = onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('[Auth] Sign in event:', session.user.email);
              setAuth({ checked: true, userId: session.user.id, email: session.user.email || null, isGuest: false });
              setCurrentUser(session.user.id, session.user.email || '');
              // Sync in background (fire and forget)
              syncUserData(session.user.id).then(() => {
                console.log('[Auth] Cloud data synced after sign in');
              }).catch(err => {
                console.error('[Auth] Sync failed after sign in:', err);
              });
            } else if (event === 'SIGNED_OUT') {
              console.log('[Auth] Sign out event');
              setAuth({ checked: true, userId: null, email: null, isGuest: false });
              setCurrentUser(null, '');
            }
          });
          subscription = result?.data?.subscription;
        }
      } catch (error) {
        console.error('Auth setup error:', error);
      } finally {
        // Always mark as checked
        setAuth(prev => ({ ...prev, checked: true }));
      }
    })();

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Show migration UI while migrating guest data
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

  // Show error if migration failed
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
            // Trigger retry
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
      <View style={{ flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  const isLoggedIn = Boolean(auth.userId) || auth.isGuest;

  if (!isLoggedIn) {
    return (
      <>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <AuthScreen
          onAuthenticated={(userId, email) => {
            console.log('[Auth] Authenticated user:', email);
            setAuth({ checked: true, userId, email, isGuest: false });
            // Set current user with timeout to prevent hanging
            // Sync happens in background but don't block login
            setCurrentUser(userId, email);
            // Sync in background (fire and forget)
            syncUserData(userId).then(() => {
              console.log('[Auth] Cloud data synced after authentication');
            }).catch(err => {
              console.error('[Auth] Sync failed after authentication:', err);
            });
          }}
          onGuest={async () => {
            // Clear all user data when entering guest mode
            await clearAllData();
            setAuth(prev => ({ ...prev, isGuest: true }));
          }}
        />
      </>
    );
  }

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
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
