import {
  mergeArrays,
  mergeObjects,
  mergeDataWithConflictResolution,
  detectConflict,
  validateSyncData,
  calculateRetryDelay,
  syncWithRetry,
} from '../syncEngine';
import { DataType } from '../../types/sync';

// ===== calculateRetryDelay Tests =====
// Formula: exponentialDelay = min(initialDelayMs * backoffMultiplier^(attempt-1), maxDelayMs)
// then + up to 20% jitter. Defaults: initialDelayMs=1000, maxDelayMs=10000, multiplier=2.
describe('calculateRetryDelay', () => {
  it('should return ~1s (plus up to 20% jitter) on attempt 1', () => {
    const delay = calculateRetryDelay(1);
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThanOrEqual(1200);
  });

  it('should return ~2s (plus up to 20% jitter) on attempt 2', () => {
    const delay = calculateRetryDelay(2);
    expect(delay).toBeGreaterThanOrEqual(2000);
    expect(delay).toBeLessThanOrEqual(2400);
  });

  it('should return ~4s (plus up to 20% jitter) on attempt 3', () => {
    const delay = calculateRetryDelay(3);
    expect(delay).toBeGreaterThanOrEqual(4000);
    expect(delay).toBeLessThanOrEqual(4800);
  });

  it('should cap the exponential part at maxDelayMs before adding jitter', () => {
    // attempt 10 would exponentially compute far past maxDelayMs (10000ms default)
    const delay = calculateRetryDelay(10);
    expect(delay).toBeGreaterThanOrEqual(10000);
    expect(delay).toBeLessThanOrEqual(12000); // capped delay + up to 20% jitter
  });

  it('should respect a custom config', () => {
    const delay = calculateRetryDelay(1, {
      maxAttempts: 3,
      initialDelayMs: 500,
      maxDelayMs: 5000,
      backoffMultiplier: 3,
    });
    expect(delay).toBeGreaterThanOrEqual(500);
    expect(delay).toBeLessThanOrEqual(600);
  });

  it('should apply jitter correctly (multiple calls should vary)', () => {
    const delays = Array.from({ length: 8 }, () => calculateRetryDelay(2));
    const uniqueDelays = new Set(delays);
    // At least some variation due to random jitter
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });
});

// ===== mergeArrays Tests =====
// Signature: mergeArrays(local, remote, localLastSync, remoteLastSync) -> ConflictResolution<T[]>
describe('mergeArrays', () => {
  it('should return an empty merged array when both are empty', () => {
    const result = mergeArrays([], [], null, null);
    expect(result.merged).toEqual([]);
    expect(result.conflictDetected).toBe(false);
  });

  it('should return local items when remote is empty', () => {
    const local = [{ id: '1', name: 'Habit 1', updatedAt: '2025-01-01T00:00:00Z' }];
    const result = mergeArrays(local, [], null, null);
    expect(result.merged).toEqual(local);
  });

  it('should return remote items when local is empty', () => {
    const remote = [{ id: '1', name: 'Habit 1', updatedAt: '2025-01-01T00:00:00Z' }];
    const result = mergeArrays([], remote, null, null);
    expect(result.merged).toEqual(remote);
  });

  it('should deduplicate by ID and keep the item with the newer updatedAt', () => {
    const local = [{ id: '1', name: 'Updated', updatedAt: '2025-01-02T00:00:00Z' }];
    const remote = [{ id: '1', name: 'Old', updatedAt: '2025-01-01T00:00:00Z' }];
    const result = mergeArrays(local, remote, null, null);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].name).toBe('Updated');
  });

  it('should keep the remote item when it is the newer one', () => {
    const local = [{ id: '1', name: 'Old', updatedAt: '2025-01-01T00:00:00Z' }];
    const remote = [{ id: '1', name: 'Updated', updatedAt: '2025-01-02T00:00:00Z' }];
    const result = mergeArrays(local, remote, null, null);
    expect(result.merged[0].name).toBe('Updated');
  });

  it('should union items that only exist on one side', () => {
    const local = [{ id: '1', name: 'Item 1', updatedAt: '2025-01-01T00:00:00Z' }];
    const remote = [{ id: '2', name: 'Item 2', updatedAt: '2025-01-01T00:00:00Z' }];
    const result = mergeArrays(local, remote, null, null);
    expect(result.merged).toHaveLength(2);
    expect(result.merged.map(r => r.id).sort()).toEqual(['1', '2']);
  });

  it('should keep the local copy when timestamps are exactly equal (local-first tiebreak)', () => {
    const local = [{ id: '1', name: 'Local Copy', updatedAt: '2025-01-01T00:00:00Z' }];
    const remote = [{ id: '1', name: 'Remote Copy', updatedAt: '2025-01-01T00:00:00Z' }];
    const result = mergeArrays(local, remote, null, null);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].name).toBe('Local Copy');
  });

  it('should fall back to createdAt when updatedAt is missing', () => {
    type Item = { id: string; name: string; createdAt?: string; updatedAt?: string };
    const local: Item[] = [{ id: '1', name: 'No updatedAt', createdAt: '2025-01-01T00:00:00Z' }];
    const remote: Item[] = [{ id: '1', name: 'Has updatedAt', updatedAt: '2025-01-02T00:00:00Z' }];
    const result = mergeArrays(local, remote, null, null);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].name).toBe('Has updatedAt');
  });

  it('should merge three-plus items across both sides correctly', () => {
    const local = [
      { id: '1', name: 'Item 1', updatedAt: '2025-01-02T00:00:00Z' },
      { id: '3', name: 'Item 3', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const remote = [
      { id: '1', name: 'Item 1 Old', updatedAt: '2025-01-01T00:00:00Z' },
      { id: '2', name: 'Item 2', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const result = mergeArrays(local, remote, null, null);
    expect(result.merged).toHaveLength(3);
    expect(result.merged.map(r => r.id).sort()).toEqual(['1', '2', '3']);
  });

  it('should flag conflictDetected when the sync-level timestamps differ', () => {
    const result = mergeArrays([], [], '2025-01-01T00:00:00Z', '2025-01-02T00:00:00Z');
    expect(result.conflictDetected).toBe(true);
    expect(result.resolvedBy).toBe('merge');
  });

  it('should not flag a conflict when the sync-level timestamps match', () => {
    const same = '2025-01-01T00:00:00Z';
    const result = mergeArrays([], [], same, same);
    expect(result.conflictDetected).toBe(false);
    expect(result.resolvedBy).toBe('local-wins');
  });
});

// ===== mergeObjects Tests =====
// Signature: mergeObjects(local, remote, localLastSync, remoteLastSync) -> ConflictResolution<T>
// Note: mergeObjects is not null-safe by itself (Object.keys(null) throws) —
// null-handling lives one level up, in mergeDataWithConflictResolution.
describe('mergeObjects', () => {
  it('should let remote win on shared keys when there is no sync-timestamp conflict', () => {
    const local = { name: 'John', age: 30 };
    const remote = { name: 'Jane', age: 25 };
    const result = mergeObjects(local, remote, null, null);
    expect(result.merged).toEqual(remote);
    expect(result.resolvedBy).toBe('remote-wins');
  });

  it('should preserve local-only keys not present on remote', () => {
    const local: { name: string; extraField?: string } = { name: 'John', extraField: 'extra' };
    const remote: { name: string; extraField?: string } = { name: 'Jane' };
    const result = mergeObjects(local, remote, null, null);
    expect(result.merged.extraField).toBe('extra');
    expect(result.merged.name).toBe('Jane'); // shared key: remote wins
  });

  it('should merge nested objects recursively, remote winning at the leaf', () => {
    const local = { address: { city: 'NYC', zip: '10001' } };
    const remote = { address: { city: 'LA', zip: '90001' } };
    const result = mergeObjects(local, remote, null, null);
    expect(result.merged.address.city).toBe('LA');
    expect(result.merged.address.zip).toBe('90001');
  });

  it('should return the remote object as-is when sync timestamps match (no conflict, already in sync)', () => {
    const same = '2025-01-01T00:00:00Z';
    const local = { name: 'John', localOnly: 'should not survive this path' };
    const remote = { name: 'Jane' };
    const result = mergeObjects(local, remote, same, same);
    expect(result.merged).toEqual(remote);
    expect(result.resolvedBy).toBe('remote-wins');
  });

  it('should field-merge (not just take remote wholesale) when sync timestamps conflict', () => {
    const local: { name: string; localOnly?: string } = { name: 'John', localOnly: 'kept' };
    const remote: { name: string; localOnly?: string } = { name: 'Jane' };
    const result = mergeObjects(local, remote, '2025-01-01T00:00:00Z', '2025-01-02T00:00:00Z');
    expect(result.conflictDetected).toBe(true);
    expect(result.resolvedBy).toBe('merge');
    expect(result.merged.localOnly).toBe('kept');
    expect(result.merged.name).toBe('Jane');
  });
});

// ===== mergeDataWithConflictResolution Tests =====
// Signature: mergeDataWithConflictResolution(localData, remoteData, dataType, localLastSync, remoteLastSync)
describe('mergeDataWithConflictResolution', () => {
  it('should delegate array data to mergeArrays', () => {
    const local = [{ id: '1', name: 'Item 1', updatedAt: '2025-01-01T00:00:00Z' }];
    const remote = [{ id: '2', name: 'Item 2', updatedAt: '2025-01-01T00:00:00Z' }];
    const result = mergeDataWithConflictResolution(local, remote, 'habits', null, null);
    expect(result.merged).toHaveLength(2);
    expect(result.conflictDetected).toBe(false);
  });

  it('should delegate object data to mergeObjects', () => {
    const local = { totalStreak: 10 };
    const remote = { totalStreak: 5 };
    const result = mergeDataWithConflictResolution(local, remote, 'stats', null, null);
    expect(result.merged).toEqual(remote); // objects: remote wins on shared keys
  });

  it('should flag a conflict when sync-level timestamps differ', () => {
    const local = [{ id: '1', name: 'Item', updatedAt: '2025-01-02T00:00:00Z' }];
    const remote = [{ id: '1', name: 'Item', updatedAt: '2025-01-01T00:00:00Z' }];
    const result = mergeDataWithConflictResolution(
      local, remote, 'habits', '2025-01-01T00:00:00Z', '2025-01-02T00:00:00Z'
    );
    expect(result.conflictDetected).toBe(true);
  });

  it('should return remote data as-is when local is null', () => {
    const remote = [{ id: '1', name: 'Item', updatedAt: '2025-01-01T00:00:00Z' }];
    const result = mergeDataWithConflictResolution(null, remote, 'habits', null, null);
    expect(result.merged).toEqual(remote);
    expect(result.resolvedBy).toBe('remote-wins');
  });

  it('should return local data as-is when remote is null', () => {
    const local = [{ id: '1', name: 'Item', updatedAt: '2025-01-01T00:00:00Z' }];
    const result = mergeDataWithConflictResolution(local, null, 'habits', null, null);
    expect(result.merged).toEqual(local);
    expect(result.resolvedBy).toBe('local-wins');
  });

  it('should return null when both sides are null', () => {
    const result = mergeDataWithConflictResolution(null, null, 'habits', null, null);
    expect(result.merged).toBeNull();
    expect(result.conflictDetected).toBe(false);
  });
});

// ===== detectConflict Tests =====
// Signature: detectConflict(local, remote, localTimestamp, remoteTimestamp)
describe('detectConflict', () => {
  it('should return false when timestamps are identical', () => {
    const timestamp = '2025-01-01T00:00:00Z';
    const local = { data: 'test' };
    const remote = { data: 'test' };
    expect(detectConflict(local, remote, timestamp, timestamp)).toBe(false);
  });

  it('should return true when timestamps differ', () => {
    const local = { data: 'test' };
    const remote = { data: 'test' };
    expect(detectConflict(local, remote, '2025-01-02T00:00:00Z', '2025-01-01T00:00:00Z')).toBe(true);
  });

  it('should return false when either timestamp is missing, regardless of content', () => {
    const local = { data: 'test1' };
    const remote = { data: 'test2' };
    expect(detectConflict(local, remote, null, '2025-01-01T00:00:00Z')).toBe(false);
    expect(detectConflict(local, remote, '2025-01-01T00:00:00Z', null)).toBe(false);
  });

  it('should return false when both timestamps are missing', () => {
    const local = { data: 'test' };
    const remote = { data: 'test' };
    expect(detectConflict(local, remote, null, null)).toBe(false);
  });
});

// ===== validateSyncData Tests =====
// Signature: validateSyncData(data, dataType) -> { valid, error? } (never throws)
describe('validateSyncData', () => {
  it('should accept array data for an array-shaped type (habits)', () => {
    const data = [{ id: '1', name: 'Habit 1' }];
    expect(validateSyncData(data, 'habits')).toEqual({ valid: true });
  });

  it('should accept object data for an object-shaped type (stats)', () => {
    const data = { totalStreak: 10, level: 5 };
    expect(validateSyncData(data, 'stats')).toEqual({ valid: true });
  });

  it('should treat null as valid for any type (no-op sync)', () => {
    expect(validateSyncData(null, 'habits')).toEqual({ valid: true });
    expect(validateSyncData(null, 'stats')).toEqual({ valid: true });
  });

  it('should reject array data for an object-shaped type', () => {
    const result = validateSyncData([{ id: '1' }], 'settings');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/should not be an array/);
  });

  it('should reject non-array data for an array-shaped type', () => {
    const result = validateSyncData({ notAnArray: true }, 'journal_entries');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/should be an array/);
  });

  it('should treat an unrecognized data type as array-shaped by default', () => {
    const data = [{ id: '1' }];
    expect(validateSyncData(data, 'unknown' as DataType)).toEqual({ valid: true });
  });
});

// ===== syncWithRetry Tests =====
describe('syncWithRetry', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should succeed on the first attempt without retrying', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await syncWithRetry(mockFn);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    jest.useFakeTimers();
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValueOnce('success');

    const promise = syncWithRetry(mockFn, { maxAttempts: 3 });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw the last error after exhausting max attempts', async () => {
    jest.useFakeTimers();
    const mockFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));

    const promise = syncWithRetry(mockFn, { maxAttempts: 2 });
    // Attach a rejection handler immediately so the eventual rejection is
    // never briefly "unhandled" while fake timers advance below.
    const expectation = expect(promise).rejects.toThrow('Persistent failure');
    await jest.runAllTimersAsync();
    await expectation;
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should respect a custom maxAttempts', async () => {
    jest.useFakeTimers();
    const mockFn = jest.fn().mockRejectedValue(new Error('Failure'));

    const promise = syncWithRetry(mockFn, { maxAttempts: 5 });
    const expectation = expect(promise).rejects.toThrow('Failure');
    await jest.runAllTimersAsync();
    await expectation;
    expect(mockFn).toHaveBeenCalledTimes(5);
  });

  it('should wait between retries rather than retrying immediately', async () => {
    jest.useFakeTimers();
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('success');

    const promise = syncWithRetry(mockFn, { maxAttempts: 3 });

    // First call happens synchronously; no retry has fired yet.
    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Advance past the first backoff delay (~1s + up to 20% jitter).
    await jest.advanceTimersByTimeAsync(1200);
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Advance past the second backoff delay (~2s + up to 20% jitter).
    await jest.advanceTimersByTimeAsync(2400);
    expect(mockFn).toHaveBeenCalledTimes(3);

    const result = await promise;
    expect(result).toBe('success');
  });
});
