import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { AppProvider, useApp } from './src/contexts/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/Auth/AuthScreen';
import { loadRuntimeConfig, isSupabaseReady } from './src/utils/runtimeConfig';
import { getSession, onAuthStateChange } from './src/utils/supabase';
import { clearAllData } from './src/utils/storage';

interface AuthState {
  checked: boolean;
  userId: string | null;
  email: string | null;
  isGuest: boolean;
}

function Root() {
  const { isLoading, theme, syncUserData, setCurrentUser, currentUserId, currentUserEmail, resetAuth, resetSignal } = useApp();
  const [auth, setAuth] = useState<AuthState>({
    checked: false,
    userId: null,
    email: null,
    isGuest: false,
  });
  const prevEmailRef = useRef<string>('');

  // Watch for logout/reset - whenever currentUserId becomes null from a logged-in state
  useEffect(() => {
    if (!auth.checked) return;

    // Only reset if we were logged in AND currentUserId just became null
    // This prevents reset loops during initial load
    if (currentUserId === null && auth.userId !== null) {
      setAuth({ checked: true, userId: null, email: null, isGuest: false });
    }
  }, [currentUserId, auth.checked, auth.userId]);

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
            setAuth({ checked: true, userId: session.user.id, email: session.user.email || null, isGuest: false });
            setCurrentUser(session.user.id, session.user.email || '');
            syncUserData(session.user.id);
            return;
          }

          // Subscribe to future auth changes
          const result = onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              setAuth({ checked: true, userId: session.user.id, email: session.user.email || null, isGuest: false });
              setCurrentUser(session.user.id, session.user.email || '');
              syncUserData(session.user.id);
            } else if (event === 'SIGNED_OUT') {
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
            setAuth({ checked: true, userId, email, isGuest: false });
            setCurrentUser(userId, email);
            syncUserData(userId);
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
