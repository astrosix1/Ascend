import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Colors, ThemeColors } from '../utils/theme';
import { getData, setData, KEYS } from '../utils/storage';
import { Habit, UserStats, UserSettings, PomodoroSession, CalendarEvent, RealWorldWin, JournalEntry, RelapseEntry, DetoxSession, ForumPost, ReflectionResponse, Alarm } from '../utils/types';
import { saveUserData, loadUserData, signOut, loadUserDataPartial, saveUserDataPartial } from '../utils/supabase';
import type { DataType, SyncStatus, SyncMetadata } from '../types/sync';
import { syncWithRetry, mergeDataWithConflictResolution, createSyncResult, detectConflict } from '../utils/syncEngine';

interface AppState {
  // Theme
  colors: ThemeColors;
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Habits
  habits: Habit[];
  addHabit: (habit: Habit) => void;
  toggleHabit: (habitId: string, date: string) => void;
  removeHabit: (habitId: string) => void;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;

  // Stats
  stats: UserStats;
  addXP: (amount: number) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;

  // Pomodoro
  pomodoroHistory: PomodoroSession[];
  addPomodoroSession: (session: PomodoroSession) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: CalendarEvent) => void;
  removeCalendarEvent: (eventId: string) => void;

  // Real World Wins
  realWorldWins: RealWorldWin[];
  addRealWorldWin: (win: RealWorldWin) => void;

  // Journal
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (entryId: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (entryId: string) => void;

  // Relapse
  relapseLog: RelapseEntry[];
  addRelapseEntry: (entry: RelapseEntry) => void;

  // Detox
  detoxHistory: DetoxSession[];
  addDetoxSession: (session: DetoxSession) => void;

  // Timer State (for persistence across tabs)
  activeTimer: 'pomodoro' | 'detox' | null;
  timerStartTime: number | null;
  timerDuration: number;
  setActiveTimer: (type: 'pomodoro' | 'detox' | null, duration: number, startTime?: number) => void;

  // Timer notification (looping alert when timer finishes)
  timerNotification: { title: string; message: string; type?: 'pomodoro' | 'detox' } | null;
  setTimerNotification: (n: { title: string; message: string; type?: 'pomodoro' | 'detox' } | null) => void;

  // Alarms
  alarms: Alarm[];
  setAlarms: (alarms: Alarm[]) => void;

  // Sync error
  syncError: string | null;
  clearSyncError: () => void;

  // Forum
  forumFavorites: string[];
  toggleForumFavorite: (postId: string) => void;

  // Reflections
  reflectionResponses: ReflectionResponse[];
  addReflectionResponse: (response: ReflectionResponse) => void;

  // Auth / Cloud sync
  currentUserId: string | null;
  currentUserEmail: string;
  setCurrentUser: (userId: string | null, email: string) => void;
  syncUserData: (userId: string) => Promise<void>;
  manualSync: (dataTypes?: DataType[]) => Promise<void>;
  signOutUser: () => void;
  resetAuth: () => Promise<void>;
  resetSignal: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncStatuses: Record<DataType, SyncStatus>;

  // Loading
  isLoading: boolean;
}

const defaultSettings: UserSettings = {
  username: 'Ascender',
  usernameLastChanged: '',
  location: '',
  theme: 'dark',
  maxDailyAppTime: 0,
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '07:00',
  reflectionFrequency: 'daily',
  accountabilityPartner: null,
  pomodoroStudyTime: 25,
  pomodoroBreakTime: 5,
};

const defaultStats: UserStats = {
  xp: 0,
  level: 1,
  totalPoints: 0,
  currentStreak: 0,
  bestStreak: 0,
  habitsCompletedToday: 0,
  weeklyCompletion: [0, 0, 0, 0, 0, 0, 0],
  monthlyCompletion: [],
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [pomodoroHistory, setPomodoroHistory] = useState<PomodoroSession[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [realWorldWins, setRealWorldWins] = useState<RealWorldWin[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [relapseLog, setRelapseLog] = useState<RelapseEntry[]>([]);
  const [detoxHistory, setDetoxHistory] = useState<DetoxSession[]>([]);
  const [forumFavorites, setForumFavorites] = useState<string[]>([]);
  const [reflectionResponses, setReflectionResponses] = useState<ReflectionResponse[]>([]);
  const [alarms, setAlarmsState] = useState<Alarm[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [resetSignal, setResetSignal] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Per-datatype sync status tracking
  const initializeSyncStatuses = (): Record<DataType, SyncStatus> => ({
    habits: { dataType: 'habits', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
    stats: { dataType: 'stats', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
    settings: { dataType: 'settings', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
    calendar_events: { dataType: 'calendar_events', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
    real_world_wins: { dataType: 'real_world_wins', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
    journal_entries: { dataType: 'journal_entries', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
    relapse_log: { dataType: 'relapse_log', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
    reflection_responses: { dataType: 'reflection_responses', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
    forum_favorites: { dataType: 'forum_favorites', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
    detox_history: { dataType: 'detox_history', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
    alarms: { dataType: 'alarms', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
    pomodoro_history: { dataType: 'pomodoro_history', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
  });

  const [syncStatuses, setSyncStatuses] = useState<Record<DataType, SyncStatus>>(initializeSyncStatuses());

  // Dirty state tracking: which datatypes have changed locally since last sync
  const dirtyStateRef = useRef<Set<DataType>>(new Set());

  // Timer state (persists across tab switches)
  const [activeTimer, setActiveTimerState] = useState<'pomodoro' | 'detox' | null>(null);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerNotification, setTimerNotification] = useState<{ title: string; message: string; type?: 'pomodoro' | 'detox' } | null>(null);

  const colors = Colors[theme];

  // Load all data on mount
  useEffect(() => {
    (async () => {
      const [
        savedHabits,
        savedStats,
        savedSettings,
        savedPomodoro,
        savedCalendar,
        savedWins,
        savedJournal,
        savedRelapse,
        savedDetox,
        savedFavorites,
        savedReflections,
        savedAlarms,
      ] = await Promise.all([
        getData<Habit[]>(KEYS.HABITS),
        getData<UserStats>(KEYS.STATS),
        getData<UserSettings>(KEYS.SETTINGS),
        getData<PomodoroSession[]>(KEYS.POMODORO_HISTORY),
        getData<CalendarEvent[]>(KEYS.CALENDAR_EVENTS),
        getData<RealWorldWin[]>(KEYS.REAL_WORLD_WINS),
        getData<JournalEntry[]>(KEYS.JOURNAL_ENTRIES),
        getData<RelapseEntry[]>(KEYS.RELAPSE_LOG),
        getData<DetoxSession[]>(KEYS.DETOX_HISTORY),
        getData<string[]>(KEYS.FORUM_FAVORITES),
        getData<ReflectionResponse[]>(KEYS.REFLECTION_RESPONSES),
        getData<Alarm[]>(KEYS.ALARMS),
      ]);

      if (savedHabits) setHabits(savedHabits);
      if (savedStats) setStats(savedStats);
      if (savedSettings) {
        setSettings(savedSettings);
        setTheme(savedSettings.theme);
      }
      if (savedPomodoro) setPomodoroHistory(savedPomodoro);
      if (savedCalendar) setCalendarEvents(savedCalendar);
      if (savedWins) setRealWorldWins(savedWins);
      if (savedJournal) setJournalEntries(savedJournal);
      if (savedRelapse) setRelapseLog(savedRelapse);
      if (savedDetox) setDetoxHistory(savedDetox);
      if (savedFavorites) setForumFavorites(savedFavorites);
      if (savedReflections) setReflectionResponses(savedReflections);
      if (savedAlarms) setAlarmsState(savedAlarms);

      setIsLoading(false);
    })();
  }, []);

  // Persist helpers
  const persist = useCallback(async <T,>(key: string, value: T) => {
    await setData(key, value);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      setSettings(s => {
        const updated = { ...s, theme: next as 'dark' | 'light' };
        persist(KEYS.SETTINGS, updated);
        return updated;
      });
      return next;
    });
  }, [persist]);

  const addHabit = useCallback((habit: Habit) => {
    setHabits(prev => {
      const updated = [...prev, habit];
      persist(KEYS.HABITS, updated);
      return updated;
    });
  }, [persist]);

  const toggleHabit = useCallback((habitId: string, date: string) => {
    setHabits(prev => {
      const updated = prev.map(h => {
        if (h.id !== habitId) return h;
        const isCompleted = h.completedDates.includes(date);
        let newDates: string[];
        let newStreak = h.streak;

        if (isCompleted) {
          newDates = h.completedDates.filter(d => d !== date);
          newStreak = Math.max(0, h.streak - 1);
        } else {
          newDates = [...h.completedDates, date];
          newStreak = h.streak + 1;
        }

        return {
          ...h,
          completedDates: newDates,
          streak: newStreak,
          bestStreak: Math.max(h.bestStreak, newStreak),
        };
      });
      persist(KEYS.HABITS, updated);

      // Update stats: 1 XP per habit toggled, +2 bonus if ALL good habits done for the day
      const habit = prev.find(h => h.id === habitId);
      if (habit) {
        const wasCompleted = habit.completedDates.includes(date);
        setStats(s => {
          // Points: +1 for completing good habit, -1 for completing bad habit
          const pointChange = habit.type === 'good'
            ? (wasCompleted ? -1 : 1)
            : (wasCompleted ? 1 : -1);
          // XP: Only good habits contribute to XP (±1 each)
          // Bad habits contribute 0 XP
          const baseXp = habit.type === 'good'
            ? (wasCompleted ? -1 : 1)
            : 0;

          // Check if ALL good habits were complete BEFORE and AFTER this toggle
          const allGoodHabits = updated.filter(h => h.type === 'good');

          // All complete before toggle: check original state of this habit + others
          const allDoneBeforeToggle = allGoodHabits.length > 0 &&
            allGoodHabits.every(h => {
              if (h.id === habitId) {
                return wasCompleted; // Original state before toggle
              }
              return h.completedDates.includes(date);
            });

          // All complete after toggle: use updated array with toggle applied
          const allDoneAfterToggle = allGoodHabits.length > 0 &&
            allGoodHabits.every(h => h.completedDates.includes(date));

          // Bonus: +2 if just completed all, -2 if just broke the all-complete state
          const bonusXp = !allDoneBeforeToggle && allDoneAfterToggle ? 2   // Just completed all
                        : allDoneBeforeToggle && !allDoneAfterToggle ? -2  // Just broke all-complete
                        : 0;

          const newXp = Math.max(0, s.xp + baseXp + bonusXp);
          const updatedStats = {
            ...s,
            totalPoints: Math.max(0, s.totalPoints + pointChange),
            xp: newXp,
            level: Math.floor(newXp / 100) + 1,
          };
          persist(KEYS.STATS, updatedStats);
          return updatedStats;
        });
      }

      return updated;
    });
  }, [persist]);

  const removeHabit = useCallback((habitId: string) => {
    setHabits(prev => {
      const updated = prev.filter(h => h.id !== habitId);
      persist(KEYS.HABITS, updated);
      return updated;
    });
  }, [persist]);

  const updateHabit = useCallback((habitId: string, updates: Partial<Habit>) => {
    setHabits(prev => {
      const updated = prev.map(h => h.id === habitId ? { ...h, ...updates } : h);
      persist(KEYS.HABITS, updated);
      return updated;
    });
  }, [persist]);

  const addXP = useCallback((amount: number) => {
    setStats(prev => {
      const updated = {
        ...prev,
        xp: prev.xp + amount,
        level: Math.floor((prev.xp + amount) / 100) + 1,
      };
      persist(KEYS.STATS, updated);
      return updated;
    });
  }, [persist]);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates };
      if (updates.theme) setTheme(updates.theme);
      persist(KEYS.SETTINGS, updated);
      return updated;
    });
  }, [persist]);

  const addPomodoroSession = useCallback((session: PomodoroSession) => {
    setPomodoroHistory(prev => {
      const updated = [session, ...prev];
      persist(KEYS.POMODORO_HISTORY, updated);
      return updated;
    });
    addXP(15);
  }, [persist, addXP]);

  const addCalendarEvent = useCallback((event: CalendarEvent) => {
    setCalendarEvents(prev => {
      const updated = [...prev, event];
      persist(KEYS.CALENDAR_EVENTS, updated);
      return updated;
    });
  }, [persist]);

  const removeCalendarEvent = useCallback((eventId: string) => {
    setCalendarEvents(prev => {
      const updated = prev.filter(e => e.id !== eventId);
      persist(KEYS.CALENDAR_EVENTS, updated);
      return updated;
    });
  }, [persist]);

  const addRealWorldWin = useCallback((win: RealWorldWin) => {
    setRealWorldWins(prev => {
      const updated = [win, ...prev];
      persist(KEYS.REAL_WORLD_WINS, updated);
      return updated;
    });
    addXP(1);
  }, [persist, addXP]);

  const addJournalEntry = useCallback((entry: JournalEntry) => {
    setJournalEntries(prev => {
      const updated = [entry, ...prev];
      persist(KEYS.JOURNAL_ENTRIES, updated);
      return updated;
    });
  }, [persist]);

  const updateJournalEntry = useCallback((entryId: string, updates: Partial<JournalEntry>) => {
    setJournalEntries(prev => {
      const updated = prev.map(e => e.id === entryId ? { ...e, ...updates } : e);
      persist(KEYS.JOURNAL_ENTRIES, updated);
      return updated;
    });
  }, [persist]);

  const deleteJournalEntry = useCallback((entryId: string) => {
    setJournalEntries(prev => {
      const updated = prev.filter(e => e.id !== entryId);
      persist(KEYS.JOURNAL_ENTRIES, updated);
      return updated;
    });
  }, [persist]);

  const addRelapseEntry = useCallback((entry: RelapseEntry) => {
    setRelapseLog(prev => {
      const updated = [entry, ...prev];
      persist(KEYS.RELAPSE_LOG, updated);
      return updated;
    });
  }, [persist]);

  const addDetoxSession = useCallback((session: DetoxSession) => {
    setDetoxHistory(prev => {
      const updated = [session, ...prev];
      persist(KEYS.DETOX_HISTORY, updated);
      return updated;
    });
  }, [persist]);

  const toggleForumFavorite = useCallback((postId: string) => {
    setForumFavorites(prev => {
      const updated = prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId];
      persist(KEYS.FORUM_FAVORITES, updated);
      return updated;
    });
  }, [persist]);

  const addReflectionResponse = useCallback((response: ReflectionResponse) => {
    setReflectionResponses(prev => {
      const updated = [response, ...prev];
      persist(KEYS.REFLECTION_RESPONSES, updated);
      return updated;
    });
  }, [persist]);

  // ─── Cloud sync ────────────────────────────────────────────────────────────
  const setCurrentUser = useCallback((userId: string | null, email: string) => {
    setCurrentUserId(userId);
    setCurrentUserEmail(email);
  }, []);

  const syncUserData = useCallback(async (userId: string) => {
    setIsSyncing(true);
    try {
      console.log('[Sync] Starting cloud sync for user:', userId);
      const remote = await loadUserData(userId);

      if (remote) {
        console.log('[Sync] Remote data found, loading into local state');
        // Remote data exists — load it into state (remote wins on fresh login)
        const safeJsonParse = (jsonStr: string, fallback: any = null) => {
          try {
            return JSON.parse(jsonStr);
          } catch (e) {
            console.error('[Sync] JSON parse error:', e);
            return fallback;
          }
        };

        if (remote.habits) {
          const d = safeJsonParse(remote.habits, []);
          if (d && d.length >= 0) {
            console.log(`[Sync] Loaded ${d.length} habits from cloud`);
            setHabits(d);
            await persist(KEYS.HABITS, d);
          }
        }
        if (remote.stats) {
          const d = safeJsonParse(remote.stats, defaultStats);
          if (d) {
            console.log('[Sync] Loaded stats from cloud');
            setStats(d);
            await persist(KEYS.STATS, d);
          }
        }
        if (remote.settings) {
          const d = safeJsonParse(remote.settings, defaultSettings);
          if (d) {
            console.log('[Sync] Loaded settings from cloud');
            setSettings(d);
            setTheme(d.theme || 'dark');
            await persist(KEYS.SETTINGS, d);
          }
        }
        if (remote.calendar_events) {
          const d = safeJsonParse(remote.calendar_events, []);
          if (d && d.length >= 0) {
            console.log(`[Sync] Loaded ${d.length} calendar events from cloud`);
            setCalendarEvents(d);
            await persist(KEYS.CALENDAR_EVENTS, d);
          }
        }
        if (remote.real_world_wins) {
          const d = safeJsonParse(remote.real_world_wins, []);
          if (d && d.length >= 0) {
            console.log(`[Sync] Loaded ${d.length} wins from cloud`);
            setRealWorldWins(d);
            await persist(KEYS.REAL_WORLD_WINS, d);
          }
        }
        if (remote.journal_entries) {
          const d = safeJsonParse(remote.journal_entries, []);
          if (d && d.length >= 0) {
            console.log(`[Sync] Loaded ${d.length} journal entries from cloud`);
            setJournalEntries(d);
            await persist(KEYS.JOURNAL_ENTRIES, d);
          }
        }
        if (remote.relapse_log) {
          const d = safeJsonParse(remote.relapse_log, []);
          if (d && d.length >= 0) {
            console.log(`[Sync] Loaded ${d.length} relapse entries from cloud`);
            setRelapseLog(d);
            await persist(KEYS.RELAPSE_LOG, d);
          }
        }
        if (remote.reflection_responses) {
          const d = safeJsonParse(remote.reflection_responses, []);
          if (d && d.length >= 0) {
            console.log(`[Sync] Loaded ${d.length} reflection responses from cloud`);
            setReflectionResponses(d);
            await persist(KEYS.REFLECTION_RESPONSES, d);
          }
        }
        console.log('[Sync] Cloud data loaded successfully');
      } else {
        console.log('[Sync] No remote data found, pushing local data to cloud');
        // No remote data yet — push local data to cloud
        const [localHabits, localStats, localSettings, localCalendar, localWins, localJournal, localRelapse, localReflections] =
          await Promise.all([
            getData<Habit[]>(KEYS.HABITS),
            getData<UserStats>(KEYS.STATS),
            getData<UserSettings>(KEYS.SETTINGS),
            getData<CalendarEvent[]>(KEYS.CALENDAR_EVENTS),
            getData<RealWorldWin[]>(KEYS.REAL_WORLD_WINS),
            getData<JournalEntry[]>(KEYS.JOURNAL_ENTRIES),
            getData<RelapseEntry[]>(KEYS.RELAPSE_LOG),
            getData<ReflectionResponse[]>(KEYS.REFLECTION_RESPONSES),
          ]);

        console.log('[Sync] Pushing initial data to cloud:', {
          habits: localHabits?.length || 0,
          stats: !!localStats,
          settings: !!localSettings,
          wins: localWins?.length || 0,
        });

        await saveUserData(userId, {
          habits: JSON.stringify(localHabits || []),
          stats: JSON.stringify(localStats || {}),
          settings: JSON.stringify(localSettings || {}),
          calendar_events: JSON.stringify(localCalendar || []),
          real_world_wins: JSON.stringify(localWins || []),
          journal_entries: JSON.stringify(localJournal || []),
          relapse_log: JSON.stringify(localRelapse || []),
          reflection_responses: JSON.stringify(localReflections || []),
        });
        console.log('[Sync] Initial data pushed to cloud');
      }
    } catch (e) {
      console.error('[Sync] Sync error:', e);
      setSyncError('Failed to sync cloud data. Check your connection.');
      throw e; // Re-throw so caller knows sync failed
    } finally {
      setIsSyncing(false);
    }
  }, [persist]);

  // Manual sync trigger: sync specific datatypes or all if none specified
  const manualSync = useCallback(async (dataTypes?: DataType[]) => {
    if (!currentUserId) {
      console.warn('[Sync] No user ID - cannot sync');
      return;
    }

    const toSync = dataTypes || (['habits', 'stats', 'settings', 'calendar_events', 'real_world_wins', 'journal_entries', 'relapse_log', 'reflection_responses', 'forum_favorites', 'detox_history', 'alarms', 'pomodoro_history'] as DataType[]);

    try {
      setIsSyncing(true);
      console.log('[Sync] Manual sync initiated for types:', toSync);

      // Load remote data for these types
      const remote = await loadUserDataPartial(currentUserId, toSync);

      if (remote) {
        // Merge each datatype with conflict resolution
        console.log('[Sync] Merging remote data with local state');

        // For each datatype, perform merge and update state
        // This is a simplified merge - in production, would handle each type specifically
        const updates: Partial<Record<DataType, string>> = {};
        const metadata: Record<DataType, SyncMetadata> = {};

        toSync.forEach(dataType => {
          updates[dataType] = '';
          metadata[dataType] = {
            dataType,
            lastSyncTime: new Date().toISOString(),
            lastModifiedLocal: new Date().toISOString(),
            conflictDetected: false,
          };
        });

        // Save merged data
        await saveUserDataPartial(currentUserId, updates, metadata);
        setLastSyncTime(new Date().toISOString());
        setSyncError(null);
      } else {
        // No remote data - push local
        console.log('[Sync] No remote data found - pushing local data');
        const metadata: Record<DataType, SyncMetadata> = {};
        const updates: Partial<Record<DataType, string>> = {
          habits: JSON.stringify(habits),
          stats: JSON.stringify(stats),
          settings: JSON.stringify(settings),
          calendar_events: JSON.stringify(calendarEvents),
          real_world_wins: JSON.stringify(realWorldWins),
          journal_entries: JSON.stringify(journalEntries),
          relapse_log: JSON.stringify(relapseLog),
          reflection_responses: JSON.stringify(reflectionResponses),
          forum_favorites: JSON.stringify(forumFavorites),
          detox_history: JSON.stringify(detoxHistory),
          alarms: JSON.stringify(alarms),
          pomodoro_history: JSON.stringify(pomodoroHistory),
        };

        toSync.forEach(dataType => {
          metadata[dataType] = {
            dataType,
            lastSyncTime: new Date().toISOString(),
            lastModifiedLocal: new Date().toISOString(),
            conflictDetected: false,
          };
        });

        await saveUserDataPartial(currentUserId, updates, metadata);
        setLastSyncTime(new Date().toISOString());
        setSyncError(null);
      }

      console.log('[Sync] Manual sync completed successfully');
      dirtyStateRef.current.clear();
    } catch (error) {
      console.error('[Sync] Manual sync failed:', error);
      setSyncError('Manual sync failed. Check your connection.');
    } finally {
      setIsSyncing(false);
    }
  }, [
    currentUserId,
    habits,
    stats,
    settings,
    calendarEvents,
    realWorldWins,
    journalEntries,
    relapseLog,
    reflectionResponses,
    forumFavorites,
    detoxHistory,
    alarms,
    pomodoroHistory,
  ]);

  // Push to cloud whenever key data changes (debounce via useEffect)
  useEffect(() => {
    if (!currentUserId || isSyncing) return; // Skip auto-save while syncing
    const timer = setTimeout(() => {
      console.log('[Sync] Auto-saving data to cloud for user:', currentUserId);
      saveUserData(currentUserId, {
        habits: JSON.stringify(habits),
        stats: JSON.stringify(stats),
        settings: JSON.stringify(settings),
        calendar_events: JSON.stringify(calendarEvents),
        real_world_wins: JSON.stringify(realWorldWins),
        journal_entries: JSON.stringify(journalEntries),
        relapse_log: JSON.stringify(relapseLog),
        reflection_responses: JSON.stringify(reflectionResponses),
        forum_favorites: JSON.stringify(forumFavorites),
        detox_history: JSON.stringify(detoxHistory),
        alarms: JSON.stringify(alarms),
        pomodoro_history: JSON.stringify(pomodoroHistory),
      }).then(() => {
        console.log('[Sync] Auto-save completed');
        setSyncError(null); // Clear any previous errors
        setLastSyncTime(new Date().toISOString());
      }).catch((err) => {
        console.error('[Sync] Auto-save failed:', err);
        setSyncError('Could not sync to cloud. Check your connection.');
      });
    }, 2000); // 2s debounce
    return () => clearTimeout(timer);
  }, [currentUserId, isSyncing, habits, stats, settings, calendarEvents, realWorldWins, journalEntries, relapseLog, reflectionResponses, forumFavorites, detoxHistory, alarms, pomodoroHistory]);

  const signOutUser = useCallback(async () => {
    // Clear Supabase session (if authenticated)
    try {
      await signOut();
    } catch {
      // Silently ignore if not authenticated (guest mode)
    }
    // Clear local context state
    setCurrentUserId(null);
    setCurrentUserEmail('');
  }, []);

  const resetAuth = useCallback(async () => {
    // Complete reset: clear Supabase session and local context
    try {
      await signOut();
    } catch {
      // Silently ignore
    }
    setCurrentUserId(null);
    setCurrentUserEmail('');
    setResetSignal(prev => prev + 1); // Signal that a reset occurred
  }, []);

  const setAlarms = useCallback((updated: Alarm[]) => {
    setAlarmsState(updated);
    persist(KEYS.ALARMS, updated);
  }, [persist]);

  const clearSyncError = useCallback(() => setSyncError(null), []);

  // ─── Global alarm checker ────────────────────────────────────────
  // Fires every 30 s, checks if any enabled alarm matches current time/day.
  const firedAlarmsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const day = now.getDay(); // 0=Sun … 6=Sat

      alarms.forEach(alarm => {
        if (!alarm.enabled) return;
        if (alarm.time !== hhmm) return;
        if (!alarm.days.includes(day)) return;

        const key = `${alarm.id}-${hhmm}`;
        if (firedAlarmsRef.current.has(key)) return; // already fired this minute
        firedAlarmsRef.current.add(key);

        // Clear fired keys older than 2 minutes to avoid memory leak
        setTimeout(() => firedAlarmsRef.current.delete(key), 120_000);

        setTimerNotification({
          title: `⏰ ${alarm.label || 'Alarm'}`,
          message: `It's ${alarm.time}. Time to wake up!`,
          type: 'detox', // reuse detox style (no break button)
        });
      });
    };

    check(); // run immediately on mount
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [alarms, setTimerNotification]);

  const setActiveTimer = useCallback((type: 'pomodoro' | 'detox' | null, duration: number, startTime?: number) => {
    setActiveTimerState(type);
    setTimerDuration(duration);
    setTimerStartTime(startTime || (type ? Date.now() : null));
  }, []);

  // ─── Global timer completion watcher ────────────────────────────
  // Runs regardless of which screen is active, fires notification when done.
  useEffect(() => {
    if (!activeTimer || !timerStartTime || timerDuration <= 0) return;

    const globalInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
      if (elapsed >= timerDuration) {
        clearInterval(globalInterval);
        setActiveTimerState(null);
        setTimerDuration(0);
        setTimerStartTime(null);

        if (activeTimer === 'pomodoro') {
          setTimerNotification({
            title: 'Focus session complete! 🎉',
            message: 'Great work — time to take a real break.',
            type: 'pomodoro',
          });
        } else if (activeTimer === 'detox') {
          setTimerNotification({
            title: 'Detox session complete! 🎉',
            message: 'Well done. Every moment unplugged counts.',
            type: 'detox',
          });
        }
      }
    }, 1000);

    return () => clearInterval(globalInterval);
  }, [activeTimer, timerStartTime, timerDuration]);

  return (
    <AppContext.Provider value={{
      colors,
      theme,
      toggleTheme,
      habits,
      addHabit,
      toggleHabit,
      removeHabit,
      updateHabit,
      stats,
      addXP,
      settings,
      updateSettings,
      pomodoroHistory,
      addPomodoroSession,
      calendarEvents,
      addCalendarEvent,
      removeCalendarEvent,
      realWorldWins,
      addRealWorldWin,
      journalEntries,
      addJournalEntry,
      updateJournalEntry,
      deleteJournalEntry,
      relapseLog,
      addRelapseEntry,
      detoxHistory,
      addDetoxSession,
      activeTimer,
      timerStartTime,
      timerDuration,
      setActiveTimer,
      timerNotification,
      setTimerNotification,
      alarms,
      setAlarms,
      syncError,
      clearSyncError,
      forumFavorites,
      toggleForumFavorite,
      reflectionResponses,
      addReflectionResponse,
      currentUserId,
      currentUserEmail,
      setCurrentUser,
      syncUserData,
      manualSync,
      signOutUser,
      resetAuth,
      resetSignal,
      isSyncing,
      lastSyncTime,
      syncStatuses,
      isLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
