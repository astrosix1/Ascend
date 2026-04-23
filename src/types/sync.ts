/**
 * Cloud Data Synchronization Types
 * Defines all types and interfaces for cross-device data sync
 */

/**
 * All data types that can be synchronized to cloud
 * 12 total types across 3 categories
 */
export type DataType =
  | 'habits'
  | 'stats'
  | 'settings'
  | 'calendar_events'
  | 'real_world_wins'
  | 'alarms'
  | 'journal_entries'
  | 'relapse_log'
  | 'reflection_responses'
  | 'forum_favorites'
  | 'pomodoro_history'
  | 'detox_history';

/**
 * Categorization of data types by sync behavior
 */
export const DATA_TYPE_CATEGORIES = {
  SMALL_FREQUENT: ['habits', 'stats', 'settings', 'calendar_events', 'real_world_wins', 'alarms'] as DataType[],
  MEDIUM_APPEND_ONLY: ['journal_entries', 'relapse_log', 'reflection_responses', 'forum_favorites'] as DataType[],
  LARGE_PAGINATED: ['pomodoro_history', 'detox_history'] as DataType[],
};

/**
 * Sync status for a single data type
 */
export interface SyncStatus {
  dataType: DataType;
  synced: boolean;
  error: string | null;
  lastSyncTime: string | null; // ISO timestamp
  pendingChanges: number;
  syncing: boolean;
}

/**
 * Metadata about last sync for a data type
 */
export interface SyncMetadata {
  dataType: DataType;
  lastSyncTime: string | null; // ISO timestamp of when this type was last synced
  lastModifiedLocal: string | null; // ISO timestamp of last local change
  conflictDetected: boolean;
  conflictMarker?: string; // Device ID or hash for conflict detection
}

/**
 * Conflict resolution result
 */
export interface ConflictResolution<T> {
  merged: T;
  conflictDetected: boolean;
  resolvedBy: 'local-wins' | 'remote-wins' | 'merge';
  timestamp: string; // ISO timestamp of resolution
}

/**
 * Retry configuration for sync operations
 */
export interface RetryConfig {
  maxAttempts: number; // default 3
  initialDelayMs: number; // default 1000
  maxDelayMs: number; // default 10000
  backoffMultiplier: number; // default 2
}

/**
 * Pending sync item in offline queue
 */
export interface PendingSyncItem {
  dataType: DataType;
  attemptCount: number;
  lastAttemptTime: string; // ISO timestamp
  nextRetryTime: string; // ISO timestamp
  error?: string;
}

/**
 * Migration progress tracking
 */
export interface MigrationProgress {
  inProgress: boolean;
  currentPhase: 'backup' | 'merge' | 'upload' | 'complete' | 'error';
  totalItems: number;
  processedItems: number;
  errorMessage?: string;
}

/**
 * User data structure as stored in Supabase
 * Contains all 12 synced data types as JSON strings
 */
export interface DBUserData {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  habits: string; // JSON array
  stats: string; // JSON object
  settings: string; // JSON object
  calendar_events: string; // JSON array
  real_world_wins: string; // JSON array
  journal_entries: string; // JSON array
  relapse_log: string; // JSON array
  reflection_responses: string; // JSON array
  forum_favorites: string; // JSON array
  detox_history: string; // JSON array
  alarms: string; // JSON array
  pomodoro_history: string; // JSON array
  last_sync_time: string | null; // ISO timestamp of overall last sync
  last_habit_sync: string | null;
  last_stats_sync: string | null;
  last_settings_sync: string | null;
  last_calendar_events_sync: string | null;
  last_real_world_wins_sync: string | null;
  last_journal_entries_sync: string | null;
  last_relapse_log_sync: string | null;
  last_reflection_responses_sync: string | null;
  last_forum_favorites_sync: string | null;
  last_pomodoro_history_sync: string | null;
  last_detox_history_sync: string | null;
  last_alarms_sync: string | null;
  conflict_markers: string; // JSON object with per-datatype conflict info
}

/**
 * Pagination options for large datasets
 */
export interface PaginationOptions {
  limit: number; // default 500
  offset: number; // default 0
}

/**
 * Response from paginated history load
 */
export interface HistoryPage<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

/**
 * Sync operation result
 */
export interface SyncResult {
  success: boolean;
  dataType: DataType;
  itemsSynced: number;
  error?: string;
  timestamp: string; // ISO timestamp
}
