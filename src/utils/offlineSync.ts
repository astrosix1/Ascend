import { getData, setData } from './storage';

export interface SyncQueueItem {
  id: string;
  type: 'habit' | 'entry' | 'goal';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
  attempts: number;
}

const SYNC_QUEUE_KEY = 'ascend:sync_queue';
const OFFLINE_STATE_KEY = 'ascend:offline_state';

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const data = await getData(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (_) {
    return [];
  }
}

export async function addToQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'attempts'>): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const newItem: SyncQueueItem = {
      ...item,
      id: `${item.type}_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      attempts: 0,
    };
    queue.push(newItem);
    await setData(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to add to sync queue:', e);
  }
}

export async function removeFromQueue(itemId: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filtered = queue.filter(item => item.id !== itemId);
    await setData(SYNC_QUEUE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to remove from sync queue:', e);
  }
}

export async function incrementAttempts(itemId: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const item = queue.find(i => i.id === itemId);
    if (item) {
      item.attempts++;
      await setData(SYNC_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (e) {
    console.warn('Failed to update attempts:', e);
  }
}

export async function setOfflineState(isOffline: boolean): Promise<void> {
  try {
    await setData(OFFLINE_STATE_KEY, JSON.stringify({ isOffline, timestamp: Date.now() }));
  } catch (_) {}
}

export async function getOfflineState(): Promise<{ isOffline: boolean; timestamp: number }> {
  try {
    const data = await getData(OFFLINE_STATE_KEY);
    return data ? JSON.parse(data) : { isOffline: false, timestamp: 0 };
  } catch (_) {
    return { isOffline: false, timestamp: 0 };
  }
}

export async function syncQueue(syncFn: (item: SyncQueueItem) => Promise<boolean>): Promise<void> {
  const queue = await getSyncQueue();

  for (const item of queue) {
    if (item.attempts >= 3) {
      // Skip items that have failed 3+ times
      continue;
    }

    try {
      const success = await syncFn(item);
      if (success) {
        await removeFromQueue(item.id);
      } else {
        await incrementAttempts(item.id);
      }
    } catch (e) {
      console.warn(`Failed to sync item ${item.id}:`, e);
      await incrementAttempts(item.id);
    }
  }
}

export function getPendingCount(queue: SyncQueueItem[]): number {
  return queue.length;
}

export function getFailedCount(queue: SyncQueueItem[]): number {
  return queue.filter(item => item.attempts >= 3).length;
}
