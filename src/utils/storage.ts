import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HABITS: 'ascend_habits',
  SETTINGS: 'ascend_settings',
  STATS: 'ascend_stats',
  POMODORO_HISTORY: 'ascend_pomodoro_history',
  ALARMS: 'ascend_alarms',
  EVENTS: 'ascend_events',
  FORUM_POSTS: 'ascend_forum_posts',
  FORUM_FAVORITES: 'ascend_forum_favorites',
  REAL_WORLD_WINS: 'ascend_real_world_wins',
  JOURNAL_ENTRIES: 'ascend_journal_entries',
  CALENDAR_EVENTS: 'ascend_calendar_events',
  DETOX_HISTORY: 'ascend_detox_history',
  RELAPSE_LOG: 'ascend_relapse_log',
  GOALS: 'ascend_goals',
  REFLECTION_RESPONSES: 'ascend_reflection_responses',
  WEEKLY_COMPLETION: 'ascend_weekly_completion',
  USERNAME_LAST_CHANGED: 'ascend_username_last_changed',
  ACCOUNTABILITY_PARTNER: 'ascend_accountability_partner',
  // Runtime API config (stored so users set once, not per build)
  SUPABASE_URL: 'ascend_supabase_url',
  SUPABASE_ANON_KEY: 'ascend_supabase_anon_key',
  MEETUP_KEY: 'ascend_meetup_key',
  ANTHROPIC_KEY: 'ascend_anthropic_key',
  // Auth session cache
  AUTH_SESSION: 'ascend_auth_session',
};

export async function getData<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (err: any) {
    console.error(`[Storage] Failed to read ${key}:`, err.message || err);
    return null;
  }
}

export async function setData<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err: any) {
    console.error(`[Storage] Failed to write ${key}:`, err.message || err);
    // Still fail silently for offline resilience, but log it for debugging
  }
}

export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err: any) {
    console.error(`[Storage] Failed to remove ${key}:`, err.message || err);
    // Silently fail to maintain resilience
  }
}

export async function clearAllData(): Promise<void> {
  try {
    // Clear all user data keys (keep API config and auth session for now)
    const userDataKeys = [
      KEYS.HABITS,
      KEYS.SETTINGS,
      KEYS.STATS,
      KEYS.POMODORO_HISTORY,
      KEYS.ALARMS,
      KEYS.EVENTS,
      KEYS.FORUM_POSTS,
      KEYS.FORUM_FAVORITES,
      KEYS.REAL_WORLD_WINS,
      KEYS.JOURNAL_ENTRIES,
      KEYS.CALENDAR_EVENTS,
      KEYS.DETOX_HISTORY,
      KEYS.RELAPSE_LOG,
      KEYS.REFLECTION_RESPONSES,
      KEYS.WEEKLY_COMPLETION,
      KEYS.USERNAME_LAST_CHANGED,
      KEYS.ACCOUNTABILITY_PARTNER,
    ];

    await Promise.all(userDataKeys.map(key => AsyncStorage.removeItem(key)));
    console.log('[Storage] All user data cleared');
  } catch (err: any) {
    console.error('[Storage] Failed to clear all data:', err.message || err);
    // Still fail silently for offline resilience
  }
}

export { KEYS };
