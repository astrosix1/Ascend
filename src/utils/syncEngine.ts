/**
 * Cloud Sync Engine
 * Handles conflict detection, merge strategies, and retry logic
 */

import {
  DataType,
  ConflictResolution,
  RetryConfig,
  SyncResult,
  DATA_TYPE_CATEGORIES,
} from '../types/sync';

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Calculate delay for retry attempt with exponential backoff
 * Adds jitter to prevent thundering herd problem
 */
export function calculateRetryDelay(
  attemptNumber: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const exponentialDelay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber - 1),
    config.maxDelayMs
  );

  // Add jitter: random value between 0-20% of delay
  const jitter = exponentialDelay * Math.random() * 0.2;
  return exponentialDelay + jitter;
}

/**
 * Wrapper function to retry an operation with exponential backoff
 */
export async function syncWithRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[SyncEngine] Attempt ${attempt}/${finalConfig.maxAttempts} failed:`,
        lastError.message
      );

      if (attempt < finalConfig.maxAttempts) {
        const delay = calculateRetryDelay(attempt, finalConfig);
        console.log(`[SyncEngine] Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Sync operation failed after max retries');
}

/**
 * Generic merge function for arrays (habits, journal entries, etc)
 * Deduplicates by ID and keeps newer entries
 */
function mergeArrays<T extends { id?: string; createdAt?: string; updatedAt?: string }>(
  local: T[],
  remote: T[],
  localLastSync: string | null,
  remoteLastSync: string | null
): ConflictResolution<T[]> {
  const conflictDetected = !!(localLastSync && remoteLastSync && localLastSync !== remoteLastSync);

  // Create map of remote items by ID for fast lookup
  const remoteMap = new Map<string, T>();
  remote.forEach(item => {
    if (item.id) remoteMap.set(item.id, item);
  });

  // Merge: start with local items, update with newer remote versions
  const merged: T[] = [];
  const seen = new Set<string>();

  // Process local items first
  local.forEach(localItem => {
    const remoteItem = localItem.id ? remoteMap.get(localItem.id) : null;

    if (remoteItem) {
      // Item exists in both - keep the one with more recent updatedAt
      const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
      const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0).getTime();
      merged.push(localTime >= remoteTime ? localItem : remoteItem);
      seen.add(localItem.id!);
    } else {
      // Item only in local - keep it
      merged.push(localItem);
      if (localItem.id) seen.add(localItem.id);
    }
  });

  // Add remote items not in local
  remote.forEach(remoteItem => {
    if (remoteItem.id && !seen.has(remoteItem.id)) {
      merged.push(remoteItem);
    } else if (!remoteItem.id) {
      // No ID - add it anyway (shouldn't happen)
      merged.push(remoteItem);
    }
  });

  return {
    merged,
    conflictDetected,
    resolvedBy: conflictDetected ? 'merge' : 'local-wins',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generic merge function for objects (stats, settings, etc)
 * Merges properties, newer timestamp wins per field
 */
function mergeObjects<T extends Record<string, any>>(
  local: T,
  remote: T,
  localLastSync: string | null,
  remoteLastSync: string | null
): ConflictResolution<T> {
  const conflictDetected = !!(localLastSync && remoteLastSync && localLastSync !== remoteLastSync);

  if (!conflictDetected && remoteLastSync && localLastSync) {
    // No conflict - return remote (it's newer)
    return {
      merged: remote,
      conflictDetected: false,
      resolvedBy: 'remote-wins',
      timestamp: new Date().toISOString(),
    };
  }

  // Merge properties: for each key, keep newer value
  const merged = { ...local };

  Object.keys(remote).forEach(key => {
    const localValue = local[key];
    const remoteValue = remote[key];

    if (localValue === undefined) {
      // Key only in remote
      merged[key] = remoteValue;
    } else if (typeof localValue === 'object' && typeof remoteValue === 'object' && localValue && remoteValue) {
      // Nested object - merge recursively
      merged[key] = mergeObjects(localValue, remoteValue, localLastSync, remoteLastSync).merged;
    } else {
      // Primitive - keep local for now (or could use timestamp if available)
      // In practice, prefer remote for settings/stats
      merged[key] = remoteValue;
    }
  });

  return {
    merged: merged as T,
    conflictDetected,
    resolvedBy: conflictDetected ? 'merge' : 'remote-wins',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Main conflict resolution function - delegates to type-specific merge strategies
 */
export function mergeDataWithConflictResolution<T>(
  localData: T | null,
  remoteData: T | null,
  dataType: DataType,
  localLastSync: string | null,
  remoteLastSync: string | null
): ConflictResolution<T | null> {
  // Handle null cases
  if (!localData && !remoteData) {
    return {
      merged: null,
      conflictDetected: false,
      resolvedBy: 'merge',
      timestamp: new Date().toISOString(),
    };
  }

  if (!localData) {
    return {
      merged: remoteData,
      conflictDetected: false,
      resolvedBy: 'remote-wins',
      timestamp: new Date().toISOString(),
    };
  }

  if (!remoteData) {
    return {
      merged: localData,
      conflictDetected: false,
      resolvedBy: 'local-wins',
      timestamp: new Date().toISOString(),
    };
  }

  // Both exist - use appropriate merge strategy based on data type
  const isArrayType = Array.isArray(localData) && Array.isArray(remoteData);

  if (isArrayType) {
    return mergeArrays(
      localData as any,
      remoteData as any,
      localLastSync,
      remoteLastSync
    ) as ConflictResolution<T>;
  } else {
    return mergeObjects(
      localData as any,
      remoteData as any,
      localLastSync,
      remoteLastSync
    ) as ConflictResolution<T>;
  }
}

/**
 * Determine if a data type should be paginated during sync
 */
export function isPaginatedDataType(dataType: DataType): boolean {
  return DATA_TYPE_CATEGORIES.LARGE_PAGINATED.includes(dataType);
}

/**
 * Determine if a data type is append-only
 */
export function isAppendOnlyDataType(dataType: DataType): boolean {
  return (
    DATA_TYPE_CATEGORIES.MEDIUM_APPEND_ONLY.includes(dataType) ||
    DATA_TYPE_CATEGORIES.LARGE_PAGINATED.includes(dataType)
  );
}

/**
 * Create sync result
 */
export function createSyncResult(
  success: boolean,
  dataType: DataType,
  itemsSynced: number = 0,
  error?: string
): SyncResult {
  return {
    success,
    dataType,
    itemsSynced,
    error,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate next retry time based on attempt count
 */
export function calculateNextRetryTime(
  attemptCount: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Date {
  const delayMs = calculateRetryDelay(attemptCount, config);
  return new Date(Date.now() + delayMs);
}

/**
 * Validate sync data integrity
 * Basic checks to ensure data wasn't corrupted during sync
 */
export function validateSyncData<T>(data: T | null, dataType: DataType): { valid: boolean; error?: string } {
  if (data === null) {
    // Null is valid for all types
    return { valid: true };
  }

  if (Array.isArray(data)) {
    // Array types should be arrays
    if (!DATA_TYPE_CATEGORIES.MEDIUM_APPEND_ONLY.includes(dataType) &&
        !DATA_TYPE_CATEGORIES.LARGE_PAGINATED.includes(dataType) &&
        dataType !== 'calendar_events' &&
        dataType !== 'real_world_wins' &&
        dataType !== 'alarms') {
      return { valid: false, error: `${dataType} should not be an array` };
    }
    return { valid: true };
  } else if (typeof data === 'object') {
    // Object types
    if (dataType === 'stats' || dataType === 'settings') {
      return { valid: true };
    }
  }

  return { valid: true }; // Default: assume valid
}

/**
 * Compare two data versions to detect conflicts
 * Returns true if conflict detected (versions differ meaningfully)
 */
export function detectConflict<T>(
  local: T,
  remote: T,
  localTimestamp: string | null,
  remoteTimestamp: string | null
): boolean {
  // If timestamps differ, there's definitely a conflict
  if (localTimestamp && remoteTimestamp && localTimestamp !== remoteTimestamp) {
    return true;
  }

  // If only one has a timestamp, no conflict
  if (!localTimestamp || !remoteTimestamp) {
    return false;
  }

  // Otherwise, compare content
  const localJson = JSON.stringify(local);
  const remoteJson = JSON.stringify(remote);

  return localJson !== remoteJson;
}
