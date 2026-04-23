import {
  mergeArrays,
  mergeObjects,
  mergeDataWithConflictResolution,
  detectConflict,
  validateSyncData,
  calculateRetryDelay,
  syncWithRetry,
} from '../syncEngine';
import { DataType } from '../../types/app';

// ===== calculateRetryDelay Tests =====
describe('calculateRetryDelay', () => {
  it('should return exponential backoff: 1s on attempt 1', () => {
    const delay = calculateRetryDelay(1);
    expect(delay).toBeGreaterThanOrEqual(800); // 1000ms with 20% jitter
    expect(delay).toBeLessThanOrEqual(1200);
  });

  it('should return exponential backoff: 2s on attempt 2', () => {
    const delay = calculateRetryDelay(2);
    expect(delay).toBeGreaterThanOrEqual(1600); // 2000ms with 20% jitter
    expect(delay).toBeLessThanOrEqual(2400);
  });

  it('should return exponential backoff: 4s on attempt 3', () => {
    const delay = calculateRetryDelay(3);
    expect(delay).toBeGreaterThanOrEqual(3200); // 4000ms with 20% jitter
    expect(delay).toBeLessThanOrEqual(4000); // capped at 4s
  });

  it('should cap max delay at 4000ms', () => {
    const delay = calculateRetryDelay(10);
    expect(delay).toBeLessThanOrEqual(4000);
  });

  it('should handle attempt 0', () => {
    const delay = calculateRetryDelay(0);
    expect(delay).toBeGreaterThanOrEqual(0);
    expect(delay).toBeLessThanOrEqual(200);
  });

  it('should apply jitter correctly (multiple calls should vary)', () => {
    const delays = [
      calculateRetryDelay(1),
      calculateRetryDelay(1),
      calculateRetryDelay(1),
      calculateRetryDelay(1),
      calculateRetryDelay(1),
    ];
    const uniqueDelays = new Set(delays);
    // At least some variation due to jitter
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });
});

// ===== mergeArrays Tests =====
describe('mergeArrays', () => {
  it('should return empty array when both are empty', () => {
    const result = mergeArrays([], []);
    expect(result).toEqual([]);
  });

  it('should return local array when remote is empty', () => {
    const local = [
      { id: '1', name: 'Habit 1', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const result = mergeArrays(local, []);
    expect(result).toEqual(local);
  });

  it('should return remote array when local is empty', () => {
    const remote = [
      { id: '1', name: 'Habit 1', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const result = mergeArrays([], remote);
    expect(result).toEqual(remote);
  });

  it('should deduplicate by ID and keep newer version', () => {
    const local = [
      { id: '1', name: 'Updated', updatedAt: '2025-01-02T00:00:00Z' },
    ];
    const remote = [
      { id: '1', name: 'Old', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const result = mergeArrays(local, remote);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Updated');
  });

  it('should keep remote when it is newer', () => {
    const local = [
      { id: '1', name: 'Old', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const remote = [
      { id: '1', name: 'Updated', updatedAt: '2025-01-02T00:00:00Z' },
    ];
    const result = mergeArrays(local, remote);
    expect(result[0].name).toBe('Updated');
  });

  it('should merge items with different IDs', () => {
    const local = [
      { id: '1', name: 'Item 1', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const remote = [
      { id: '2', name: 'Item 2', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const result = mergeArrays(local, remote);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id).sort()).toEqual(['1', '2']);
  });

  it('should handle items without IDs (deduplicate by content)', () => {
    const local = [{ name: 'Item', updatedAt: '2025-01-01T00:00:00Z' }];
    const remote = [{ name: 'Item', updatedAt: '2025-01-01T00:00:00Z' }];
    const result = mergeArrays(local, remote);
    expect(result).toHaveLength(1);
  });

  it('should handle items with missing updatedAt', () => {
    const local = [{ id: '1', name: 'Item 1' }]; // no updatedAt
    const remote = [{ id: '1', name: 'Item 1', updatedAt: '2025-01-01T00:00:00Z' }];
    const result = mergeArrays(local, remote);
    expect(result).toHaveLength(1);
  });

  it('should keep all items when timestamps are same', () => {
    const local = [
      { id: '1', name: 'Item 1', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const remote = [
      { id: '1', name: 'Item 1 Alt', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const result = mergeArrays(local, remote);
    // Should keep local version when timestamps are equal
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Item 1');
  });

  it('should handle complex merge with multiple items', () => {
    const local = [
      { id: '1', name: 'Item 1', updatedAt: '2025-01-02T00:00:00Z' },
      { id: '3', name: 'Item 3', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const remote = [
      { id: '1', name: 'Item 1 Old', updatedAt: '2025-01-01T00:00:00Z' },
      { id: '2', name: 'Item 2', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const result = mergeArrays(local, remote);
    expect(result).toHaveLength(3);
    const ids = result.map(r => r.id).sort();
    expect(ids).toEqual(['1', '2', '3']);
  });
});

// ===== mergeObjects Tests =====
describe('mergeObjects', () => {
  it('should return null when both are null', () => {
    const result = mergeObjects(null, null);
    expect(result).toBeNull();
  });

  it('should return local when remote is null', () => {
    const local = { name: 'John', age: 30, updatedAt: '2025-01-01T00:00:00Z' };
    const result = mergeObjects(local, null);
    expect(result).toEqual(local);
  });

  it('should return remote when local is null', () => {
    const remote = { name: 'Jane', age: 25, updatedAt: '2025-01-01T00:00:00Z' };
    const result = mergeObjects(null, remote);
    expect(result).toEqual(remote);
  });

  it('should merge two objects by field-level comparison', () => {
    const local = {
      name: 'John',
      age: 30,
      updatedAt: '2025-01-02T00:00:00Z',
    };
    const remote = {
      name: 'Jane',
      age: 25,
      updatedAt: '2025-01-01T00:00:00Z',
    };
    const result = mergeObjects(local, remote);
    // Local is newer, so all fields should be from local
    expect(result).toEqual(local);
  });

  it('should keep remote when it is newer', () => {
    const local = {
      name: 'John',
      age: 30,
      updatedAt: '2025-01-01T00:00:00Z',
    };
    const remote = {
      name: 'Jane',
      age: 25,
      updatedAt: '2025-01-02T00:00:00Z',
    };
    const result = mergeObjects(local, remote);
    expect(result).toEqual(remote);
  });

  it('should handle nested objects', () => {
    const local = {
      name: 'John',
      address: { city: 'NYC', zip: '10001' },
      updatedAt: '2025-01-01T00:00:00Z',
    };
    const remote = {
      name: 'John',
      address: { city: 'LA', zip: '90001' },
      updatedAt: '2025-01-01T00:00:00Z',
    };
    const result = mergeObjects(local, remote);
    // Same timestamp, local wins
    expect(result?.address?.city).toBe('NYC');
  });

  it('should handle objects with missing updatedAt', () => {
    const local = { name: 'John', age: 30 }; // no updatedAt
    const remote = {
      name: 'Jane',
      age: 25,
      updatedAt: '2025-01-01T00:00:00Z',
    };
    const result = mergeObjects(local, remote);
    // Remote has timestamp, should treat local as older
    expect(result).toEqual(remote);
  });

  it('should preserve additional fields in merge', () => {
    const local = {
      name: 'John',
      extraField: 'extra',
      updatedAt: '2025-01-01T00:00:00Z',
    };
    const remote = {
      name: 'Jane',
      updatedAt: '2025-01-01T00:00:00Z',
    };
    const result = mergeObjects(local, remote);
    // Same timestamp, local wins
    expect(result?.extraField).toBe('extra');
  });
});

// ===== mergeDataWithConflictResolution Tests =====
describe('mergeDataWithConflictResolution', () => {
  it('should delegate array types to mergeArrays', () => {
    const local = [
      { id: '1', name: 'Item 1', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const remote = [
      { id: '2', name: 'Item 2', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const result = mergeDataWithConflictResolution('habits', local, remote);
    expect(result.merged).toHaveLength(2);
    expect(result.hasConflict).toBe(false);
  });

  it('should delegate object types to mergeObjects', () => {
    const local = { totalStreak: 10, updatedAt: '2025-01-01T00:00:00Z' };
    const remote = { totalStreak: 5, updatedAt: '2025-01-01T00:00:00Z' };
    const result = mergeDataWithConflictResolution('stats', local, remote);
    expect(result.merged).toEqual(local);
    expect(result.hasConflict).toBe(false);
  });

  it('should detect conflict in arrays with different timestamps', () => {
    const local = [
      { id: '1', name: 'Item', updatedAt: '2025-01-02T00:00:00Z' },
    ];
    const remote = [
      { id: '1', name: 'Item', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const result = mergeDataWithConflictResolution('habits', local, remote);
    expect(result.hasConflict).toBe(true);
  });

  it('should handle null local data', () => {
    const remote = [
      { id: '1', name: 'Item', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const result = mergeDataWithConflictResolution('habits', null, remote);
    expect(result.merged).toEqual(remote);
  });

  it('should handle null remote data', () => {
    const local = [
      { id: '1', name: 'Item', updatedAt: '2025-01-01T00:00:00Z' },
    ];
    const result = mergeDataWithConflictResolution('habits', local, null);
    expect(result.merged).toEqual(local);
  });

  it('should handle both null', () => {
    const result = mergeDataWithConflictResolution('habits', null, null);
    expect(result.merged).toBeNull();
  });
});

// ===== detectConflict Tests =====
describe('detectConflict', () => {
  it('should return false when timestamps are identical', () => {
    const timestamp = '2025-01-01T00:00:00Z';
    const local = { data: 'test', updatedAt: timestamp };
    const remote = { data: 'test', updatedAt: timestamp };
    const hasConflict = detectConflict(local, remote);
    expect(hasConflict).toBe(false);
  });

  it('should return true when timestamps differ', () => {
    const local = { data: 'test', updatedAt: '2025-01-02T00:00:00Z' };
    const remote = { data: 'test', updatedAt: '2025-01-01T00:00:00Z' };
    const hasConflict = detectConflict(local, remote);
    expect(hasConflict).toBe(true);
  });

  it('should return true when content differs', () => {
    const timestamp = '2025-01-01T00:00:00Z';
    const local = { data: 'test1', updatedAt: timestamp };
    const remote = { data: 'test2', updatedAt: timestamp };
    const hasConflict = detectConflict(local, remote);
    expect(hasConflict).toBe(true);
  });

  it('should return false when both have no timestamp', () => {
    const local = { data: 'test' };
    const remote = { data: 'test' };
    const hasConflict = detectConflict(local, remote);
    expect(hasConflict).toBe(false);
  });
});

// ===== validateSyncData Tests =====
describe('validateSyncData', () => {
  it('should validate array types (habits)', () => {
    const data = [{ id: '1', name: 'Habit 1' }];
    expect(() => validateSyncData('habits', data)).not.toThrow();
  });

  it('should validate object types (stats)', () => {
    const data = { totalStreak: 10, level: 5 };
    expect(() => validateSyncData('stats', data)).not.toThrow();
  });

  it('should allow null data (no-op)', () => {
    expect(() => validateSyncData('habits', null)).not.toThrow();
  });

  it('should throw for invalid array type', () => {
    const data = { invalid: 'object' }; // should be array for 'habits'
    expect(() => validateSyncData('habits', data)).toThrow();
  });

  it('should handle unknown types gracefully', () => {
    const data = [{ id: '1' }];
    expect(() => validateSyncData('unknown' as DataType, data)).not.toThrow();
  });
});

// ===== syncWithRetry Tests =====
describe('syncWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await syncWithRetry(mockFn);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValueOnce('success');

    jest.useFakeTimers();
    const promise = syncWithRetry(mockFn, { maxAttempts: 3 });

    // Fast-forward through delays
    jest.runAllTimers();
    const result = await promise;

    jest.useRealTimers();
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts exceeded', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValue(new Error('Persistent failure'));

    jest.useFakeTimers();
    const promise = syncWithRetry(mockFn, { maxAttempts: 2 });
    jest.runAllTimers();

    jest.useRealTimers();
    await expect(promise).rejects.toThrow('Persistent failure');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should respect max retries config', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValue(new Error('Failure'));

    jest.useFakeTimers();
    const promise = syncWithRetry(mockFn, { maxAttempts: 5 });
    jest.runAllTimers();

    jest.useRealTimers();
    await expect(promise).rejects.toThrow();
    expect(mockFn).toHaveBeenCalledTimes(5);
  });

  it('should apply exponential backoff between retries', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('success');

    jest.useFakeTimers();
    const promise = syncWithRetry(mockFn, { maxAttempts: 3 });

    // Check that delays are applied
    jest.advanceTimersByTime(1500); // First delay ~1s
    expect(mockFn).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(2500); // Second delay ~2s
    expect(mockFn).toHaveBeenCalledTimes(3);

    const result = await promise;
    jest.useRealTimers();

    expect(result).toBe('success');
  });
});
