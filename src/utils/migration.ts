import { AppContextType } from '../types/app';
import { loadUserDataPartial, saveUserDataPartial } from './supabase';

export interface MigrationState {
  status: 'idle' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
}

export interface GuestDataBackup {
  timestamp: number;
  data: Partial<AppContextType>;
}

/**
 * Backup local guest data before migration (in case rollback needed)
 */
export function backupGuestData(context: AppContextType): GuestDataBackup {
  return {
    timestamp: Date.now(),
    data: {
      habits: context.habits,
      stats: context.stats,
      settings: context.settings,
      calendarEvents: context.calendarEvents,
      realWorldWins: context.realWorldWins,
      journalEntries: context.journalEntries,
      relapseLog: context.relapseLog,
      reflectionResponses: context.reflectionResponses,
      forumFavorites: context.forumFavorites,
      detoxHistory: context.detoxHistory,
      alarms: context.alarms,
      pomodoroHistory: context.pomodoroHistory,
    },
  };
}

/**
 * Main migration function: merge guest data with remote and save to cloud
 */
export async function migrateGuestDataToCloud(
  userId: string,
  localContext: AppContextType,
  onProgress?: (state: MigrationState) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Backup local data (in case rollback needed)
    onProgress?.({ status: 'in_progress', progress: 10 });
    const backup = backupGuestData(localContext);
    localStorage.setItem(`guest_data_backup_${userId}`, JSON.stringify(backup));

    // Step 2: Load existing remote data (if user signed in before)
    onProgress?.({ status: 'in_progress', progress: 30 });
    let remoteData: Partial<AppContextType> = {};
    try {
      const response = await loadUserDataPartial(userId, [
        'habits',
        'stats',
        'settings',
        'calendar_events',
        'real_world_wins',
        'journal_entries',
        'relapse_log',
        'reflection_responses',
        'forum_favorites',
        'detox_history',
        'alarms',
        'pomodoro_history',
      ]);
      if (response) {
        // Parse JSON strings from Supabase into actual objects
        remoteData = {
          habits: response.habits ? (typeof response.habits === 'string' ? JSON.parse(response.habits) : response.habits) : undefined,
          stats: response.stats ? (typeof response.stats === 'string' ? JSON.parse(response.stats) : response.stats) : undefined,
          settings: response.settings ? (typeof response.settings === 'string' ? JSON.parse(response.settings) : response.settings) : undefined,
          calendarEvents: response.calendar_events ? (typeof response.calendar_events === 'string' ? JSON.parse(response.calendar_events) : response.calendar_events) : undefined,
          realWorldWins: response.real_world_wins ? (typeof response.real_world_wins === 'string' ? JSON.parse(response.real_world_wins) : response.real_world_wins) : undefined,
          journalEntries: response.journal_entries ? (typeof response.journal_entries === 'string' ? JSON.parse(response.journal_entries) : response.journal_entries) : undefined,
          relapseLog: response.relapse_log ? (typeof response.relapse_log === 'string' ? JSON.parse(response.relapse_log) : response.relapse_log) : undefined,
          reflectionResponses: response.reflection_responses ? (typeof response.reflection_responses === 'string' ? JSON.parse(response.reflection_responses) : response.reflection_responses) : undefined,
          forumFavorites: response.forum_favorites ? (typeof response.forum_favorites === 'string' ? JSON.parse(response.forum_favorites) : response.forum_favorites) : undefined,
          detoxHistory: response.detox_history ? (typeof response.detox_history === 'string' ? JSON.parse(response.detox_history) : response.detox_history) : undefined,
          alarms: response.alarms ? (typeof response.alarms === 'string' ? JSON.parse(response.alarms) : response.alarms) : undefined,
          pomodoroHistory: response.pomodoro_history ? (typeof response.pomodoro_history === 'string' ? JSON.parse(response.pomodoro_history) : response.pomodoro_history) : undefined,
        };
      }
    } catch (e) {
      // No remote data exists yet (first sign-in) - that's fine
      console.log('[Migration] No existing remote data, using local as source');
    }

    // Step 3: Merge local (guest) data with remote (local-wins strategy for guest data)
    onProgress?.({ status: 'in_progress', progress: 60 });
    const mergedData = mergeGuestDataWithExisting(localContext, remoteData);

    // Step 4: Save merged data to cloud
    onProgress?.({ status: 'in_progress', progress: 80 });
    // Stringify merged data for Supabase storage
    const stringifiedData: Partial<Record<string, string>> = {};
    Object.entries(mergedData).forEach(([key, value]) => {
      stringifiedData[key] = JSON.stringify(value);
    });

    // Create proper sync metadata for each datatype
    const metadata: Record<string, any> = {};
    Object.keys(mergedData).forEach((dataType) => {
      metadata[dataType] = {
        dataType,
        lastSyncTime: new Date().toISOString(),
        lastModifiedLocal: new Date().toISOString(),
        conflictDetected: false,
      };
    });

    try {
      await saveUserDataPartial(userId, stringifiedData as Partial<Record<string, string>>, metadata);
    } catch (e: any) {
      // If save fails, wait a moment and retry (in case of transient issues)
      console.log('[Migration] First save attempt failed, retrying in 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await saveUserDataPartial(userId, stringifiedData as Partial<Record<string, string>>, metadata);
    }

    // Step 5: Success - data is now in cloud
    onProgress?.({ status: 'completed', progress: 100 });
    console.log('[Migration] Guest data successfully migrated to cloud');

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    onProgress?.({ status: 'failed', progress: 0, error: errorMsg });
    console.error('[Migration] Failed to migrate guest data:', error);

    return { success: false, error: errorMsg };
  }
}

/**
 * Merge guest local data with existing remote data
 * Strategy: LOCAL WINS (guest changes take priority over remote)
 * This preserves all work the user did while offline
 *
 * Returns data in snake_case format for Supabase compatibility
 */
function mergeGuestDataWithExisting(
  local: AppContextType,
  remote: Partial<AppContextType>
): Record<string, any> {
  return {
    habits: mergeArraysByTimestamp(local.habits || [], remote.habits || []),
    stats: { ...remote.stats, ...local.stats }, // Local stats overwrite
    settings: { ...remote.settings, ...local.settings }, // Local settings overwrite
    calendar_events: mergeArraysByTimestamp(
      local.calendarEvents || [],
      remote.calendarEvents || []
    ),
    real_world_wins: mergeArraysByTimestamp(
      local.realWorldWins || [],
      remote.realWorldWins || []
    ),
    journal_entries: mergeArraysByTimestamp(
      local.journalEntries || [],
      remote.journalEntries || []
    ),
    relapse_log: mergeArraysByTimestamp(local.relapseLog || [], remote.relapseLog || []),
    reflection_responses: mergeArraysByTimestamp(
      local.reflectionResponses || [],
      remote.reflectionResponses || []
    ),
    forum_favorites: mergeArraysByTimestamp(
      local.forumFavorites || [],
      remote.forumFavorites || []
    ),
    detox_history: mergeArraysByTimestamp(
      local.detoxHistory || [],
      remote.detoxHistory || []
    ),
    alarms: mergeArraysByTimestamp(local.alarms || [], remote.alarms || []),
    pomodoro_history: mergeArraysByTimestamp(
      local.pomodoroHistory || [],
      remote.pomodoroHistory || []
    ),
  };
}

/**
 * Merge two arrays by deduplicating by ID and keeping newer entries
 */
function mergeArraysByTimestamp<T extends { id?: string; updatedAt?: number }>(
  local: T[] | any,
  remote: T[] | any
): T[] {
  const map = new Map<string, T>();

  // Ensure remote is an array
  const remoteArray = Array.isArray(remote) ? remote : [];
  const localArray = Array.isArray(local) ? local : [];

  // Add all remote entries
  remoteArray.forEach((item) => {
    if (item) {
      const key = item.id || JSON.stringify(item);
      map.set(key, item);
    }
  });

  // Add/overwrite with local entries (local wins)
  localArray.forEach((item) => {
    if (item) {
      const key = item.id || JSON.stringify(item);
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

/**
 * Check if user has guest data to migrate
 */
export function hasGuestDataToMigrate(context: AppContextType): boolean {
  return (
    (context.habits?.length ?? 0) > 0 ||
    (context.journalEntries?.length ?? 0) > 0 ||
    (context.alarms?.length ?? 0) > 0 ||
    (context.pomodoroHistory?.length ?? 0) > 0 ||
    (context.relapseLog?.length ?? 0) > 0 ||
    (context.realWorldWins?.length ?? 0) > 0 ||
    (context.forumFavorites?.length ?? 0) > 0 ||
    (context.detoxHistory?.length ?? 0) > 0 ||
    (context.calendarEvents?.length ?? 0) > 0 ||
    (context.reflectionResponses?.length ?? 0) > 0
  );
}
