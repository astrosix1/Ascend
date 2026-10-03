import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { Colors, ThemeColors } from '../utils/theme';
import { getData, setData, removeData, clearAllData, KEYS } from '../utils/storage';
import { initPushNotifications, scheduleAlarmNotifications } from '../utils/webPush';
import { Habit, UserStats, UserSettings, PomodoroSession, CalendarEvent, RealWorldWin, JournalEntry, RelapseEntry, GoalEntry, DetoxSession, ForumPost, ReflectionResponse, Alarm, Todo } from '../utils/types';
import { saveUserData, loadUserData, signOut, saveUserDataPartial } from '../utils/supabase';
import { resolveStreakOnComplete } from '../utils/streakFreeze';
import type { DataType, SyncStatus, SyncMetadata } from '../types/sync';
import { syncWithRetry, mergeDataWithConflictResolution, createSyncResult, detectConflict } from '../utils/syncEngine';
import { getSyncQueue, syncQueue as processOfflineQueue, setOfflineState, getOfflineState, addToQueue } from '../utils/offlineSync';

export interface AppState {
  // Theme
  colors: ThemeColors;
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Habits
  habits: Habit[];
  // addHabit only strictly needs name+type — it fills in id/streak/bestStreak/
  // completedDates/createdAt itself (see the implementation) — the type used
  // to claim a full Habit was required, which didn't match reality and meant
  // every quick-add-a-break-habit call site had to silently mislead the
  // type checker to compile.
  addHabit: (habit: Partial<Habit> & Pick<Habit, 'name' | 'type'>) => void;
  toggleHabit: (habitId: string, date: string) => void;
  removeHabit: (habitId: string) => void;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;

  // Stats
  stats: UserStats;
  addXP: (amount: number) => void;
  resetProgress: () => void;

  // Milestones
  totalHabitsCompleted: number;
  milestonesCrossed: number[];
  milestoneTrigger: number | null;

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

  // Goals (v2.1)
  goals: GoalEntry[];
  addGoal: (goal: GoalEntry) => void;
  updateGoal: (goalId: string, updates: Partial<GoalEntry>) => void;
  deleteGoal: (goalId: string) => void;

  // Todos
  todos: Todo[];
  addTodo: (todo: Todo) => void;
  toggleTodo: (todoId: string) => void;
  deleteTodo: (todoId: string) => void;

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
  prepareLocalDataFor: (userId: string | null) => Promise<void>;
  manualSync: (dataTypes?: DataType[]) => Promise<void>;
  signOutUser: () => Promise<void>;
  // One-shot cross-screen navigation intent: Settings sets this to jump
  // straight to a specific Discover sub-tab (e.g. the AI Generator, which
  // was moved out of Discover's primary tab bar so casual users aren't led
  // to a feature that needs their own API key). DesktopNavigator switches
  // activeScreen to 'discover' when this is set; LearnScreen reads it on
  // mount to pick the right sub-tab, then clears it.
  requestedDiscoverTab: 'discover' | 'generator' | 'eq' | null;
  requestDiscoverTab: (tab: 'discover' | 'generator' | 'eq') => void;
  clearRequestedDiscoverTab: () => void;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncStatuses: Record<DataType, SyncStatus>;

  // Loading
  isLoading: boolean;

  // Offline Sync
  isOffline: boolean;
  pendingSyncCount: number;
  failedSyncCount: number;
  triggerSync: () => Promise<void>;
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

// Every user_data column the app syncs.
const ALL_SYNC_TYPES: DataType[] = [
  'habits', 'stats', 'settings', 'calendar_events', 'real_world_wins',
  'journal_entries', 'relapse_log', 'reflection_responses', 'forum_favorites',
  'detox_history', 'alarms', 'pomodoro_history', 'todos', 'goals',
];

interface SyncableState {
  habits: Habit[];
  stats: UserStats;
  settings: UserSettings;
  calendarEvents: CalendarEvent[];
  realWorldWins: RealWorldWin[];
  journalEntries: JournalEntry[];
  relapseLog: RelapseEntry[];
  reflectionResponses: ReflectionResponse[];
  forumFavorites: string[];
  detoxHistory: DetoxSession[];
  alarms: Alarm[];
  pomodoroHistory: PomodoroSession[];
  todos: Todo[];
  goals: GoalEntry[];
}

// State as the JSON strings the user_data columns store.
function serializeForCloud(s: SyncableState) {
  return {
    habits: JSON.stringify(s.habits),
    stats: JSON.stringify(s.stats),
    settings: JSON.stringify(s.settings),
    calendar_events: JSON.stringify(s.calendarEvents),
    real_world_wins: JSON.stringify(s.realWorldWins),
    journal_entries: JSON.stringify(s.journalEntries),
    relapse_log: JSON.stringify(s.relapseLog),
    reflection_responses: JSON.stringify(s.reflectionResponses),
    forum_favorites: JSON.stringify(s.forumFavorites),
    detox_history: JSON.stringify(s.detoxHistory),
    alarms: JSON.stringify(s.alarms),
    pomodoro_history: JSON.stringify(s.pomodoroHistory),
    todos: JSON.stringify(s.todos),
    goals: JSON.stringify(s.goals),
  };
}

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
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [detoxHistory, setDetoxHistory] = useState<DetoxSession[]>([]);
  const [forumFavorites, setForumFavorites] = useState<string[]>([]);
  const [reflectionResponses, setReflectionResponses] = useState<ReflectionResponse[]>([]);
  const [alarms, setAlarmsState] = useState<Alarm[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [requestedDiscoverTab, setRequestedDiscoverTab] = useState<'discover' | 'generator' | 'eq' | null>(null);
  const requestDiscoverTab = useCallback((tab: 'discover' | 'generator' | 'eq') => setRequestedDiscoverTab(tab), []);
  const clearRequestedDiscoverTab = useCallback(() => setRequestedDiscoverTab(null), []);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  // The user whose cloud row we have successfully reconciled with local state
  // this session. Nothing is uploaded until this matches currentUserId: if the
  // first load failed (offline, expired token) the local state may be empty or
  // stale, and uploading it would overwrite the real cloud copy.
  const [cloudReadyUserId, setCloudReadyUserId] = useState<string | null>(null);
  // Set while the initial sync for that user is failing; drives background retries.
  const [syncFailedFor, setSyncFailedFor] = useState<string | null>(null);
  // Resolves once local storage has been read into state on mount.
  const localLoadRef = useRef<Promise<void>>(Promise.resolve());

  // Offline sync
  const [isOffline, setIsOfflineState] = useState(false);
  const [syncQueue, setSyncQueueState] = useState<any[]>([]);
  const offlineCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Setup offline detection and sync
  useEffect(() => {
    const handleOnline = async () => {
      setIsOfflineState(false);
      await setOfflineState(false);
      // Trigger sync when coming back online
      const queue = await getSyncQueue();
      if (queue.length > 0) {
        setSyncQueueState(queue);
      }
    };

    const handleOffline = async () => {
      setIsOfflineState(true);
      await setOfflineState(true);
    };

    // Check initial state
    setIsOfflineState(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Milestone tracking
  const [milestonesCrossed, setMilestonesCrossed] = useState<number[]>([]);
  const [milestoneTrigger, setMilestoneTrigger] = useState<number | null>(null);

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
    todos: { dataType: 'todos', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
    goals: { dataType: 'goals', synced: false, error: null, lastSyncTime: null, pendingChanges: 0, syncing: false },
  });

  const [syncStatuses, setSyncStatuses] = useState<Record<DataType, SyncStatus>>(initializeSyncStatuses());

  // Dirty state tracking: which datatypes have changed locally since last sync
  const dirtyStateRef = useRef<Set<DataType>>(new Set());

  // Timer state (persists across tab switches)
  const [activeTimer, setActiveTimerState] = useState<'pomodoro' | 'detox' | null>(null);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState(0);
  const [pomodoroSessionType, setPomodoroSessionType] = useState<'study' | 'break' | null>(null);
  const [timerNotification, setTimerNotification] = useState<{ title: string; message: string; type?: 'pomodoro' | 'detox'; pomodoroSessionType?: 'study' | 'break' } | null>(null);

  const colors = Colors[theme];

  // Load all data on mount — split into critical (blocks render) and deferred (background)
  useEffect(() => {
    localLoadRef.current = (async () => {
      try {
        // ── Phase 1: Critical data — unblocks first render as fast as possible ──
        const [
          savedHabits,
          savedStats,
          savedSettings,
          savedGoals,
          savedTodos,
          savedMilestones,
        ] = await Promise.all([
          getData<Habit[]>(KEYS.HABITS),
          getData<UserStats>(KEYS.STATS),
          getData<UserSettings>(KEYS.SETTINGS),
          getData<GoalEntry[]>(KEYS.GOALS),
          getData<Todo[]>(KEYS.TODOS),
          getData<number[]>(KEYS.MILESTONES_CROSSED),
        ]);

        if (savedHabits) {
          // Sanitize legacy habits that may be missing required fields
          const sanitized = savedHabits.map(h => ({
            ...h,
            completedDates: h.completedDates ?? [],
            streak: h.streak ?? 0,
            bestStreak: h.bestStreak ?? 0,
            createdAt: h.createdAt || new Date().toISOString(),
          }));
          setHabits(sanitized);
        }
        if (savedStats) setStats(savedStats);
        if (savedSettings) {
          setSettings(savedSettings);
          setTheme(savedSettings.theme);
        }
        if (savedGoals) setGoals(savedGoals);
        if (savedTodos) setTodos(savedTodos);
        if (savedMilestones) setMilestonesCrossed(savedMilestones);
      } catch (err) {
        console.error('[AppContext] Critical data load error:', err);
      } finally {
        // Always unblock render — even if critical load partially fails
        setIsLoading(false);
      }

      // ── Phase 2: Deferred data — loads in background after first render ──
      // (awaited only so localLoadRef settles once everything is in state; the
      // first render was already unblocked above)
      await Promise.all([
        getData<PomodoroSession[]>(KEYS.POMODORO_HISTORY),
        getData<CalendarEvent[]>(KEYS.CALENDAR_EVENTS),
        getData<RealWorldWin[]>(KEYS.REAL_WORLD_WINS),
        getData<JournalEntry[]>(KEYS.JOURNAL_ENTRIES),
        getData<RelapseEntry[]>(KEYS.RELAPSE_LOG),
        getData<DetoxSession[]>(KEYS.DETOX_HISTORY),
        getData<string[]>(KEYS.FORUM_FAVORITES),
        getData<ReflectionResponse[]>(KEYS.REFLECTION_RESPONSES),
        getData<Alarm[]>(KEYS.ALARMS),
      ]).then(([
        savedPomodoro,
        savedCalendar,
        savedWins,
        savedJournal,
        savedRelapse,
        savedDetox,
        savedFavorites,
        savedReflections,
        savedAlarms,
      ]) => {
        if (savedPomodoro) setPomodoroHistory(savedPomodoro);
        if (savedCalendar) setCalendarEvents(savedCalendar);
        if (savedWins) setRealWorldWins(savedWins);
        if (savedJournal) setJournalEntries(savedJournal);
        if (savedRelapse) setRelapseLog(savedRelapse);
        if (savedDetox) setDetoxHistory(savedDetox);
        if (savedFavorites) setForumFavorites(savedFavorites);
        if (savedReflections) setReflectionResponses(savedReflections);
        if (savedAlarms) {
          setAlarmsState(savedAlarms);
          // Initialize push notifications with saved alarms
          initPushNotifications(savedAlarms).catch(err =>
            console.warn('[Push] Init error:', err)
          );
        }
      }).catch(err => {
        console.warn('[AppContext] Deferred data load error:', err);
      });
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

  const addHabit = useCallback((habit: Partial<Habit> & Pick<Habit, 'name' | 'type'>) => {
    // Sanitize: ensure required fields are always present
    const safe: Habit = {
      id: habit.id || Date.now().toString(),
      name: habit.name,
      type: habit.type,
      description: habit.description,
      streak: habit.streak ?? 0,
      bestStreak: habit.bestStreak ?? 0,
      completedDates: habit.completedDates ?? [],
      createdAt: habit.createdAt || new Date().toISOString(),
      category: habit.category,
      microHabit: habit.microHabit,
      trigger: habit.trigger,
      replacement: habit.replacement,
    };
    setHabits(prev => {
      const updated = [...prev, safe];
      persist(KEYS.HABITS, updated);
      dirtyStateRef.current.add('habits');
      return updated;
    });
  }, [persist]);

  // Calculate consecutive streak from completed dates (only counts consecutive days ending today)
  const calculateConsecutiveStreak = (completedDates: string[], referenceDate: string = new Date().toISOString().split('T')[0]): number => {
    if (completedDates.length === 0) return 0;

    const sortedDates = [...completedDates].sort();
    let streak = 0;
    let currentDate = new Date(referenceDate);

    // Work backwards from today to count consecutive days
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (sortedDates.includes(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Calculate total habits completed across all habits
  // Uses optional chaining to handle legacy habits that may lack completedDates
  const calculateTotalHabitsCompleted = (habitsList: Habit[]): number => {
    return habitsList.reduce((total, habit) => total + (habit.completedDates?.length || 0), 0);
  };

  // Check if milestone reached and return the new milestone, or null if none
  const checkMilestoneReached = (newTotal: number, previousTotal: number, crossedAlready: number[]): number | null => {
    const milestones = [7, 30, 50, 100, 365];
    for (const milestone of milestones) {
      if (previousTotal < milestone && newTotal >= milestone && !crossedAlready.includes(milestone)) {
        return milestone;
      }
    }
    return null;
  };

  const toggleHabit = useCallback((habitId: string, date: string) => {
    setHabits(prev => {
      const updated = prev.map(h => {
        if (h.id !== habitId) return h;
        const isCompleted = h.completedDates.includes(date);
        let newDates: string[];
        let newStreak = 0;
        let newFreezeTokens = h.freezeTokens ?? 0;
        let newFrozenDates = h.frozenDates ?? [];

        if (isCompleted) {
          // Uncompleting a habit - remove the date and recalculate streak from remaining dates
          newDates = h.completedDates.filter(d => d !== date);
          // Recalculate streak from remaining dates
          const sortedRemaining = [...newDates].sort();
          if (sortedRemaining.length > 0) {
            // Streak ends at the last completed date, not today
            const lastCompletedDate = sortedRemaining[sortedRemaining.length - 1];
            newStreak = calculateConsecutiveStreak(newDates, lastCompletedDate);
          } else {
            newStreak = 0;
          }
        } else {
          // Completing a habit - add the date. The resolver continues the streak,
          // or (good habits only) spends a freeze token to bridge a single missed day.
          newDates = [...h.completedDates, date];
          const res = resolveStreakOnComplete({
            type: h.type,
            completedDates: h.completedDates,
            frozenDates: h.frozenDates,
            streak: h.streak,
            freezeTokens: h.freezeTokens,
            date,
          });
          newStreak = res.newStreak;
          newFreezeTokens = res.freezeTokens;
          newFrozenDates = res.frozenDates;
        }

        return {
          ...h,
          completedDates: newDates,
          streak: newStreak,
          bestStreak: Math.max(h.bestStreak, newStreak),
          freezeTokens: newFreezeTokens,
          frozenDates: newFrozenDates,
        };
      });
      persist(KEYS.HABITS, updated);

      // Check for milestone completion
      const previousTotal = calculateTotalHabitsCompleted(prev);
      const newTotal = calculateTotalHabitsCompleted(updated);
      const newMilestone = checkMilestoneReached(newTotal, previousTotal, milestonesCrossed);

      if (newMilestone) {
        setMilestonesCrossed(prev => [...prev, newMilestone]);
        setMilestoneTrigger(newMilestone);
        // Auto-clear milestone trigger after 5 seconds
        setTimeout(() => setMilestoneTrigger(null), 5000);
      }

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
          dirtyStateRef.current.add('stats');
          return updatedStats;
        });
      }

      dirtyStateRef.current.add('habits');
      return updated;
    });
  }, [persist, milestonesCrossed]);

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

  // Check and reset streaks if a day was missed (for daily habits)
  const resetBrokenStreaks = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    setHabits(prev => {
      const updated = prev.map(h => {
        // If habit wasn't completed today AND wasn't completed yesterday, streak is broken
        if (!h.completedDates.includes(today) && !h.completedDates.includes(yesterdayStr) && h.streak > 0) {
          return { ...h, streak: 0 };
        }
        return h;
      });

      // Only persist if changes were made
      if (updated.some((h, i) => h.streak !== prev[i].streak)) {
        persist(KEYS.HABITS, updated);
      }
      return updated;
    });
  }, [persist]);

  // Reset all progress: streaks, XP, level, etc.
  const resetProgress = useCallback(() => {
    // Reset habits: clear all streaks and bestStreaks, clear completed dates
    setHabits(prev => {
      const updated = prev.map(h => ({
        ...h,
        streak: 0,
        bestStreak: 0,
        completedDates: [],
      }));
      persist(KEYS.HABITS, updated);
      return updated;
    });

    // Reset stats: XP to 0, level to 1, currentStreak to 0
    setStats(prev => {
      const updated = {
        ...prev,
        xp: 0,
        level: 1,
        currentStreak: 0,
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

  const addGoal = useCallback((goal: GoalEntry) => {
    setGoals(prev => {
      const updated = [goal, ...prev];
      persist(KEYS.GOALS, updated);
      return updated;
    });
  }, [persist]);

  const updateGoal = useCallback((goalId: string, updates: Partial<GoalEntry>) => {
    setGoals(prev => {
      const updated = prev.map(g => g.id === goalId ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g);
      persist(KEYS.GOALS, updated);
      return updated;
    });
  }, [persist]);

  const deleteGoal = useCallback((goalId: string) => {
    setGoals(prev => {
      const updated = prev.filter(g => g.id !== goalId);
      persist(KEYS.GOALS, updated);
      return updated;
    });
  }, [persist]);

  const addTodo = useCallback((todo: Todo) => {
    setTodos(prev => {
      const updated = [todo, ...prev];
      persist(KEYS.TODOS, updated);
      return updated;
    });
  }, [persist]);

  const toggleTodo = useCallback((todoId: string) => {
    setTodos(prev => {
      const updated = prev.map(t => {
        if (t.id !== todoId) return t;
        const isCompleting = !t.completed;
        if (isCompleting) {
          // Award XP when completing a todo — persist stats immediately so
          // XP isn't lost if the app restarts before the auto-save fires.
          setStats(s => {
            const newStats = {
              ...s,
              xp: s.xp + t.xpReward,
              level: Math.floor((s.xp + t.xpReward) / 100) + 1,
            };
            persist(KEYS.STATS, newStats);
            return newStats;
          });
        }
        return {
          ...t,
          completed: isCompleting,
          completedAt: isCompleting ? new Date().toISOString() : undefined,
        };
      });
      persist(KEYS.TODOS, updated);
      return updated;
    });
  }, [persist]);

  const deleteTodo = useCallback((todoId: string) => {
    setTodos(prev => {
      const updated = prev.filter(t => t.id !== todoId);
      persist(KEYS.TODOS, updated);
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

  // Latest state, readable from timers/async callbacks without making those
  // callbacks depend on (and be re-created by) every state change.
  const latestRef = useRef({
    habits, stats, settings, calendarEvents, realWorldWins, journalEntries,
    relapseLog, reflectionResponses, forumFavorites, detoxHistory, alarms,
    pomodoroHistory, todos, goals,
  });
  latestRef.current = {
    habits, stats, settings, calendarEvents, realWorldWins, journalEntries,
    relapseLog, reflectionResponses, forumFavorites, detoxHistory, alarms,
    pomodoroHistory, todos, goals,
  };

  // Empty every in-memory collection (used when local data is wiped).
  const resetInMemoryState = useCallback(() => {
    setHabits([]);
    setStats(defaultStats);
    // Keep the device's theme; everything else goes back to defaults.
    setSettings(s => ({ ...defaultSettings, theme: s.theme }));
    setPomodoroHistory([]);
    setCalendarEvents([]);
    setRealWorldWins([]);
    setJournalEntries([]);
    setRelapseLog([]);
    setGoals([]);
    setTodos([]);
    setDetoxHistory([]);
    setForumFavorites([]);
    setReflectionResponses([]);
    setAlarmsState([]);
    scheduleAlarmNotifications([]);
    setMilestonesCrossed([]);
    dirtyStateRef.current.clear();
    setLastSyncTime(null);
  }, []);

  // Account-switch guard: local data is tagged with the account it belongs to.
  // If a different account is signing in on this device (shared computer,
  // signed out elsewhere), drop the previous person's data rather than letting
  // it be shown to — or uploaded into — the new account. Untagged data predates
  // tagging and is adopted by whoever signs in. Pass null for a guest: data
  // tagged to an account must not be shown to a signed-out visitor either.
  // Storage-only (no network), so the app calls it before rendering anything.
  const prepareLocalDataFor = useCallback(async (userId: string | null) => {
    // Let the initial read of local storage finish so it can't race the wipe.
    await localLoadRef.current;
    const owner = await getData<string>(KEYS.DATA_OWNER);
    if (owner && owner !== userId) {
      console.warn('[Sync] Local data belongs to a different account — clearing it');
      if (!(await clearAllData())) throw new Error('Could not clear previous account data');
      await removeData(KEYS.DATA_OWNER);
      resetInMemoryState();
    }
  }, [resetInMemoryState]);

  const syncUserData = useCallback(async (userId: string) => {
    setIsSyncing(true);
    try {
      await prepareLocalDataFor(userId);

      // Throws on any failure; null strictly means "this account has no cloud
      // row yet", the only case where seeding the cloud from local is safe.
      const remote = await loadUserData(userId);

      if (remote) {
        // Remote data exists — load it into state (remote wins on fresh login)
        const safeJsonParse = (jsonStr: string): any => {
          try {
            return JSON.parse(jsonStr);
          } catch (e) {
            console.error('[Sync] JSON parse error:', e);
            return null;
          }
        };

        // A column that is missing or unparsable leaves local state untouched.
        const applyArray = async <T,>(raw: string | null | undefined, key: string, set: (v: T[]) => void) => {
          if (!raw) return;
          const d = safeJsonParse(raw);
          if (Array.isArray(d)) {
            set(d);
            await persist(key, d);
          }
        };
        const applyObject = async <T extends object>(raw: string | null | undefined, key: string, set: (v: T) => void) => {
          if (!raw) return;
          const d = safeJsonParse(raw);
          if (d && typeof d === 'object' && !Array.isArray(d)) {
            set(d);
            await persist(key, d);
          }
        };

        await applyArray<Habit>(remote.habits, KEYS.HABITS, setHabits);
        await applyObject<UserStats>(remote.stats, KEYS.STATS, setStats);
        await applyObject<UserSettings>(remote.settings, KEYS.SETTINGS, d => {
          setSettings(d);
          setTheme(d.theme || 'dark');
        });
        await applyArray<CalendarEvent>(remote.calendar_events, KEYS.CALENDAR_EVENTS, setCalendarEvents);
        await applyArray<RealWorldWin>(remote.real_world_wins, KEYS.REAL_WORLD_WINS, setRealWorldWins);
        await applyArray<JournalEntry>(remote.journal_entries, KEYS.JOURNAL_ENTRIES, setJournalEntries);
        await applyArray<RelapseEntry>(remote.relapse_log, KEYS.RELAPSE_LOG, setRelapseLog);
        await applyArray<ReflectionResponse>(remote.reflection_responses, KEYS.REFLECTION_RESPONSES, setReflectionResponses);
        await applyArray<string>(remote.forum_favorites, KEYS.FORUM_FAVORITES, setForumFavorites);
        await applyArray<DetoxSession>(remote.detox_history, KEYS.DETOX_HISTORY, setDetoxHistory);
        await applyArray<Alarm>(remote.alarms, KEYS.ALARMS, setAlarmsState);
        await applyArray<PomodoroSession>(remote.pomodoro_history, KEYS.POMODORO_HISTORY, setPomodoroHistory);
        await applyArray<Todo>(remote.todos, KEYS.TODOS, setTodos);
        await applyArray<GoalEntry>(remote.goals, KEYS.GOALS, setGoals);
      } else {
        // Confirmed new account (no cloud row) — seed the cloud from whatever
        // is stored locally. Read from storage, not state, which may be stale.
        const readLocal = async <T,>(key: string, fallback: T): Promise<T> => (await getData<T>(key)) ?? fallback;
        const [
          habits_, stats_, settings_, calendar_, wins_, journal_, relapse_, reflections_,
          favorites_, detox_, alarms_, pomodoro_, todos_, goals_,
        ] = await Promise.all([
          readLocal<Habit[]>(KEYS.HABITS, []),
          readLocal<UserStats | Record<string, never>>(KEYS.STATS, {}),
          readLocal<UserSettings | Record<string, never>>(KEYS.SETTINGS, {}),
          readLocal<CalendarEvent[]>(KEYS.CALENDAR_EVENTS, []),
          readLocal<RealWorldWin[]>(KEYS.REAL_WORLD_WINS, []),
          readLocal<JournalEntry[]>(KEYS.JOURNAL_ENTRIES, []),
          readLocal<RelapseEntry[]>(KEYS.RELAPSE_LOG, []),
          readLocal<ReflectionResponse[]>(KEYS.REFLECTION_RESPONSES, []),
          readLocal<string[]>(KEYS.FORUM_FAVORITES, []),
          readLocal<DetoxSession[]>(KEYS.DETOX_HISTORY, []),
          readLocal<Alarm[]>(KEYS.ALARMS, []),
          readLocal<PomodoroSession[]>(KEYS.POMODORO_HISTORY, []),
          readLocal<Todo[]>(KEYS.TODOS, []),
          readLocal<GoalEntry[]>(KEYS.GOALS, []),
        ]);

        await saveUserData(userId, {
          habits: JSON.stringify(habits_),
          stats: JSON.stringify(stats_),
          settings: JSON.stringify(settings_),
          calendar_events: JSON.stringify(calendar_),
          real_world_wins: JSON.stringify(wins_),
          journal_entries: JSON.stringify(journal_),
          relapse_log: JSON.stringify(relapse_),
          reflection_responses: JSON.stringify(reflections_),
          forum_favorites: JSON.stringify(favorites_),
          detox_history: JSON.stringify(detox_),
          alarms: JSON.stringify(alarms_),
          pomodoro_history: JSON.stringify(pomodoro_),
          todos: JSON.stringify(todos_),
          goals: JSON.stringify(goals_),
        });
      }

      // Reconciled: tag local data with its owner and allow uploads.
      await setData(KEYS.DATA_OWNER, userId);
      setCloudReadyUserId(userId);
      setSyncFailedFor(null);
      setSyncError(null);
      setLastSyncTime(new Date().toISOString());
    } catch (e) {
      console.error('[Sync] Sync error:', e);
      setSyncFailedFor(userId);
      setSyncError('Failed to sync cloud data. Check your connection.');
      throw e; // Re-throw so caller knows sync failed
    } finally {
      setIsSyncing(false);
    }
  }, [persist, prepareLocalDataFor]);

  // If the initial sync failed, keep retrying in the background. Uploads stay
  // blocked until it succeeds, so retrying is what gets the user back to a
  // normally-syncing state once the network/session recovers.
  useEffect(() => {
    if (!currentUserId || syncFailedFor !== currentUserId || isSyncing) return;
    const timer = setTimeout(() => {
      syncUserData(currentUserId).catch(() => { /* logged + re-scheduled via syncFailedFor */ });
    }, 15000);
    return () => clearTimeout(timer);
  }, [currentUserId, syncFailedFor, isSyncing, syncUserData]);

  const cloudReady = !!currentUserId && cloudReadyUserId === currentUserId;

  // Manual sync trigger: push specific datatypes (or all) to the cloud.
  const manualSync = useCallback(async (dataTypes?: DataType[]) => {
    if (!currentUserId) {
      console.warn('[Sync] No user ID - cannot sync');
      return;
    }

    // Until the cloud copy has been loaded once, pushing could overwrite it
    // with empty/stale local state — redo the (read-first) initial sync instead.
    if (!cloudReady) {
      await syncUserData(currentUserId).catch(() => { /* surfaced via syncError */ });
      return;
    }

    const toSync = dataTypes || ALL_SYNC_TYPES;

    try {
      setIsSyncing(true);

      const everything: Partial<Record<DataType, string>> = serializeForCloud(latestRef.current);
      const now = new Date().toISOString();
      const updates: Partial<Record<DataType, string>> = {};
      const metadata = {} as Record<DataType, SyncMetadata>;

      toSync.forEach(dataType => {
        const value = everything[dataType];
        if (value !== undefined) updates[dataType] = value;
        metadata[dataType] = {
          dataType,
          lastSyncTime: now,
          lastModifiedLocal: now,
          conflictDetected: false,
        };
      });

      await saveUserDataPartial(currentUserId, updates, metadata);
      setLastSyncTime(new Date().toISOString());
      setSyncError(null);
      dirtyStateRef.current.clear();
    } catch (error) {
      console.error('[Sync] Manual sync failed:', error);
      setSyncError('Manual sync failed. Check your connection.');
    } finally {
      setIsSyncing(false);
    }
  }, [currentUserId, cloudReady, syncUserData]);

  // Push to cloud whenever key data changes (debounced 2s). Only runs once the
  // initial sync has succeeded for this user (see cloudReadyUserId).
  useEffect(() => {
    if (!currentUserId || !cloudReady || isSyncing || isLoading) return;
    const timer = setTimeout(() => {
      saveUserData(currentUserId, serializeForCloud(latestRef.current)).then(() => {
        dirtyStateRef.current.clear();
        setSyncError(null);
        setLastSyncTime(new Date().toISOString());
      }).catch((err) => {
        console.error('[Sync] Auto-save failed:', err);
        setSyncError('Could not sync to cloud. Check your connection.');
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentUserId, cloudReady, isSyncing, isLoading, habits, stats, settings, calendarEvents, realWorldWins, journalEntries, relapseLog, reflectionResponses, forumFavorites, detoxHistory, alarms, pomodoroHistory, todos, goals]);

  const signOutUser = useCallback(async () => {
    const userId = currentUserId;

    // Local data may only be wiped once it is confirmed to be in the cloud —
    // otherwise signing out while offline would silently destroy the user's
    // latest changes. If it can't be confirmed, keep it: it stays tagged with
    // its owner, so a different account signing in later still won't see it.
    let safeToClear = !!userId;
    if (userId) {
      if (cloudReady) {
        try {
          await saveUserData(userId, serializeForCloud(latestRef.current));
        } catch (e) {
          safeToClear = false;
          console.warn('[Auth] Could not save before sign-out; keeping local data:', e);
        }
      } else {
        safeToClear = false;
      }
    }

    try {
      await signOut();
    } catch (e) {
      console.warn('[Auth] signOut failed (continuing with local sign-out):', e);
    }

    // Order matters: drop the user id first so the autosave effect can't fire
    // against the emptied state below.
    setCurrentUserId(null);
    setCurrentUserEmail('');
    setCloudReadyUserId(null);
    setSyncFailedFor(null);

    if (safeToClear) {
      await clearAllData();
      await removeData(KEYS.DATA_OWNER);
      resetInMemoryState();
    }
  }, [currentUserId, cloudReady, resetInMemoryState]);

  const setAlarms = useCallback((updated: Alarm[]) => {
    setAlarmsState(updated);
    persist(KEYS.ALARMS, updated);
    // Reschedule web push notifications whenever alarms change
    scheduleAlarmNotifications(updated);
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

    // Determine pomodoro session type
    if (type === 'pomodoro') {
      const isStudy = duration === settings.pomodoroStudyTime * 60;
      setPomodoroSessionType(isStudy ? 'study' : 'break');
    } else {
      setPomodoroSessionType(null);
    }
  }, [settings.pomodoroStudyTime, settings.pomodoroBreakTime]);

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
          const isStudyComplete = pomodoroSessionType === 'study';
          setTimerNotification({
            title: isStudyComplete ? 'Focus session complete! 🎉' : 'Break session complete! 🎉',
            message: isStudyComplete ? 'Great work — time to take a real break.' : 'Ready to focus again?',
            type: 'pomodoro',
            pomodoroSessionType,
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

  // Trigger offline sync when coming back online.
  // Actually replays the persisted offline queue instead of just clearing it:
  // each queued item is retried through manualSync (which already has its own
  // retry/error handling); items that fail keep their attempt count and stay
  // queued (capped at 3 attempts) so a later reconnect can retry them again.
  const triggerSync = useCallback(async () => {
    if (syncQueue.length === 0 || !navigator.onLine || !currentUserId) return;

    try {
      setIsSyncing(true);
      await processOfflineQueue(async () => {
        // Queued items represent local changes made while offline; the
        // simplest correct replay is to push current in-memory state for
        // everything (manualSync already diffs against remote and handles
        // its own retry/backoff-free error surfacing via setSyncError).
        await manualSync();
        return true;
      });
      const remaining = await getSyncQueue();
      setSyncQueueState(remaining);
      setIsOfflineState(false);
    } catch (e) {
      console.warn('Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [syncQueue, currentUserId, manualSync]);

  // Memoized so unrelated consumers don't re-render on every AppContext state
  // change — previously this was a fresh object literal every render, so a
  // single habit toggle or in-flight sync status update re-rendered every
  // screen that calls useApp(), not just the ones reading the field that
  // actually changed. All the action functions above are already wrapped in
  // useCallback, so only the plain state values need to be real dependencies
  // here; the callbacks are listed too for correctness even though their
  // references are already stable.
  const contextValue = useMemo<AppState>(() => ({
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
    resetProgress,
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
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
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
    prepareLocalDataFor,
    manualSync,
    signOutUser,
    requestedDiscoverTab,
    requestDiscoverTab,
    clearRequestedDiscoverTab,
    isSyncing,
    lastSyncTime,
    syncStatuses,
    isLoading,
    totalHabitsCompleted: calculateTotalHabitsCompleted(habits),
    milestonesCrossed,
    milestoneTrigger,
    isOffline,
    pendingSyncCount: syncQueue.length,
    failedSyncCount: syncQueue.filter((item: any) => item.attempts >= 3).length,
    triggerSync,
  }), [
    colors, theme, toggleTheme,
    habits, addHabit, toggleHabit, removeHabit, updateHabit,
    stats, addXP, resetProgress,
    settings, updateSettings,
    pomodoroHistory, addPomodoroSession,
    calendarEvents, addCalendarEvent, removeCalendarEvent,
    realWorldWins, addRealWorldWin,
    journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry,
    relapseLog, addRelapseEntry,
    goals, addGoal, updateGoal, deleteGoal,
    todos, addTodo, toggleTodo, deleteTodo,
    detoxHistory, addDetoxSession,
    activeTimer, timerStartTime, timerDuration, setActiveTimer,
    timerNotification, setTimerNotification,
    alarms, setAlarms,
    syncError, clearSyncError,
    forumFavorites, toggleForumFavorite,
    reflectionResponses, addReflectionResponse,
    currentUserId, currentUserEmail, setCurrentUser,
    syncUserData, prepareLocalDataFor, manualSync, signOutUser,
    requestedDiscoverTab, requestDiscoverTab, clearRequestedDiscoverTab,
    isSyncing, lastSyncTime, syncStatuses, isLoading,
    milestonesCrossed, milestoneTrigger, isOffline,
    syncQueue, triggerSync,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
