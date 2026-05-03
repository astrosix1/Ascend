import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useScreenWidth, BREAKPOINTS } from '../utils/responsive';
import DesktopSidebar from '../components/DesktopSidebar';
import TopHeader from '../components/TopHeader';
import { OfflineIndicator } from '../components/OfflineIndicator';

import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import ClockScreen from '../screens/Clock/ClockScreen';
import LearnScreen from '../screens/Learn/LearnScreen';
import CommunityScreen from '../screens/Community/CommunityScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

const Tab = createBottomTabNavigator();

// ─── Looping sound helper ─────────────────────────────────────────────────────
function playBeepSequence() {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const playNote = (startTime: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playNote(now,        880,  0.18);
    playNote(now + 0.22, 1046, 0.18);
    playNote(now + 0.44, 1318, 0.35);
  } catch (_) {}
}

// ─── Manage browser tab title ──────────────────────────────────────────────────
function useDocumentTitle() {
  const { activeTimer, timerStartTime, timerDuration } = useApp();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // If no active timer, show default title
    if (!activeTimer || !timerStartTime || typeof timerDuration !== 'number' || timerDuration <= 0) {
      document.title = 'Ascend - Habit Tracker';
      return;
    }

    // Update title with timer progress
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;

      // Ensure secs is a valid number before converting to string
      const validSecs = typeof secs === 'number' && !isNaN(secs) ? secs : 0;
      const timeStr = `${mins}:${validSecs.toString().padStart(2, '0')}`;

      if (activeTimer === 'pomodoro') {
        document.title = `Ascend - Pomodoro ${timeStr}`;
      } else if (activeTimer === 'detox') {
        document.title = `Ascend - Detox ${timeStr}`;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, timerStartTime, timerDuration]);
}

// ─── Request browser notification permission on mount ────────────────────────
function useNotificationPermission() {
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
}

function fireSystemNotification(title: string, body: string) {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  } catch (_) {}
}

// ─── Notification overlay ─────────────────────────────────────────────────────
function TimerNotificationOverlay() {
  const { colors, timerNotification, setTimerNotification, setActiveTimer, settings } = useApp();
  const screenWidth = useScreenWidth();
  const soundInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideAnim = useRef(new Animated.Value(120)).current;

  useEffect(() => {
    if (timerNotification) {
      // Fire system notification (works even if tab is backgrounded)
      fireSystemNotification(timerNotification.title, timerNotification.message);
      // Play immediately then every 2.5 s until dismissed
      playBeepSequence();
      soundInterval.current = setInterval(playBeepSequence, 2500);
      // Slide in
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    } else {
      if (soundInterval.current) {
        clearInterval(soundInterval.current);
        soundInterval.current = null;
      }
      // Slide out
      Animated.timing(slideAnim, { toValue: 120, duration: 250, useNativeDriver: true }).start();
    }
    return () => {
      if (soundInterval.current) clearInterval(soundInterval.current);
    };
  }, [timerNotification]);

  if (!timerNotification) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 24,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY: slideAnim }],
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.accent,
        padding: 16,
        width: Math.min(300, screenWidth - 32),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 12,
      }}
    >
      {/* Pulsing accent bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Timer Complete
        </Text>
      </View>

      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>
        {timerNotification.title}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 14, lineHeight: 18 }}>
        {timerNotification.message}
      </Text>

      <TouchableOpacity
        onPress={() => setTimerNotification(null)}
        style={{
          backgroundColor: colors.accent,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Stop & Dismiss</Text>
      </TouchableOpacity>

      {timerNotification?.type === 'pomodoro' && (
        <TouchableOpacity
          onPress={() => {
            setTimerNotification(null);
            const isStudyComplete = timerNotification?.pomodoroSessionType === 'study';
            const nextDuration = isStudyComplete
              ? settings.pomodoroBreakTime * 60
              : settings.pomodoroStudyTime * 60;
            setActiveTimer('pomodoro', nextDuration);
          }}
          style={{
            marginTop: 8,
            borderRadius: 10,
            paddingVertical: 10,
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: colors.accent,
          }}
        >
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>
            {timerNotification?.pomodoroSessionType === 'study' ? 'Start Break' : 'Start Study Timer'}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ─── Guest nudge banner ───────────────────────────────────────────────────────
function GuestBanner() {
  const { colors, currentUserId } = useApp();
  const [dismissed, setDismissed] = useState(false);
  if (currentUserId || dismissed) return null;
  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 8888,
      backgroundColor: colors.accent, flexDirection: 'row',
      alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10,
    }}>
      <Text style={{ color: '#fff', fontSize: 14 }}>☁️</Text>
      <Text style={{ color: '#fff', fontSize: 13, flex: 1, fontWeight: '500' }}>
        You're in guest mode — your data won't be saved if you clear the browser.
      </Text>
      <TouchableOpacity onPress={() => setDismissed(true)}>
        <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Sync error toast ─────────────────────────────────────────────────────────
function SyncErrorToast() {
  const { colors, syncError, clearSyncError } = useApp();
  const slideAnim = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    if (syncError) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
      const t = setTimeout(clearSyncError, 6000);
      return () => clearTimeout(t);
    } else {
      Animated.timing(slideAnim, { toValue: -80, duration: 200, useNativeDriver: true }).start();
    }
  }, [syncError]);

  if (!syncError) return null;
  return (
    <Animated.View style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9000,
      transform: [{ translateY: slideAnim }],
      backgroundColor: '#c0392b', flexDirection: 'row',
      alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    }}>
      <Text style={{ color: '#fff', fontSize: 14 }}>⚠️</Text>
      <Text style={{ color: '#fff', fontSize: 13, flex: 1 }}>{syncError}</Text>
      <TouchableOpacity onPress={clearSyncError}>
        <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Screen map for desktop navigation
const screenMap: Record<string, React.ComponentType<any>> = {
  dashboard: DashboardScreen,
  clock: ClockScreen,
  discover: LearnScreen,
  community: CommunityScreen,
  settings: SettingsScreen,
};

function MobileNavigator() {
  const { colors, theme } = useApp();
  useDocumentTitle();
  useNotificationPermission();

  return (
    <View style={{ flex: 1 }}>
    <OfflineIndicator theme={theme} />
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Clock" component={ClockScreen} />
      <Tab.Screen name="Discover" component={LearnScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
    <GuestBanner />
    <SyncErrorToast />
    <TimerNotificationOverlay />
    </View>
  );
}

function DesktopNavigator() {
  const { colors, toggleTheme, theme } = useApp();
  const [activeScreen, setActiveScreen] = useState('dashboard');
  useDocumentTitle();
  useNotificationPermission();

  // ── Global keyboard shortcuts: Cmd/Ctrl + 1-5 for screen navigation ──────────
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleKey = (e: KeyboardEvent) => {
      // Only handle Cmd/Ctrl key combinations
      if (!(e.ctrlKey || e.metaKey)) return;

      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;

      const screenMap: Record<string, string> = {
        '1': 'dashboard',
        '2': 'clock',
        '3': 'discover',
        '4': 'community',
        '5': 'settings',
      };

      if (e.key in screenMap) {
        e.preventDefault();
        setActiveScreen(screenMap[e.key]);
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const ScreenComponent = screenMap[activeScreen] || DashboardScreen;

  return (
    <View style={{ flex: 1, flexDirection: 'column', backgroundColor: colors.background }}>
      {/* Offline Indicator */}
      <OfflineIndicator theme={theme} />

      {/* Top Header spanning full width */}
      <TopHeader onToggleTheme={toggleTheme} />

      {/* Main content area: Sidebar + Screen */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <DesktopSidebar
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
        />
        <View style={{ flex: 1 }}>
          <ScreenComponent />
        </View>
      </View>

      <GuestBanner />
      <SyncErrorToast />
      <TimerNotificationOverlay />
    </View>
  );
}

export default function AppNavigator() {
  const screenWidth = useScreenWidth();
  const desktop = screenWidth > BREAKPOINTS.tablet;

  return (
    <NavigationContainer>
      {desktop ? <DesktopNavigator /> : <MobileNavigator />}
    </NavigationContainer>
  );
}
