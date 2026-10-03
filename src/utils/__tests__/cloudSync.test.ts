/**
 * Guards the cloud-sync safety properties:
 *  - loadUserData distinguishes "no row yet" (null) from failures (throws), so
 *    a transient error can never be mistaken for a new account and trigger an
 *    upload of empty local state over real cloud data.
 *  - saves keep working (minus todos/goals) if the DB migration isn't applied yet.
 *  - clearAllData wipes every per-user key, including goals and todos.
 */

const mockGetClient = jest.fn();
jest.mock('../runtimeConfig', () => ({
  getSupabaseClient: () => mockGetClient(),
  isSupabaseReady: () => true,
}));

const mockStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => (k in mockStore ? mockStore[k] : null)),
    setItem: jest.fn(async (k: string, v: string) => { mockStore[k] = v; }),
    removeItem: jest.fn(async (k: string) => { delete mockStore[k]; }),
  },
}));

import { loadUserData, saveUserData, syncColumnFor } from '../supabase';
import { clearAllData, KEYS, USER_DATA_KEYS } from '../storage';

function clientWithSelect(result: { data: unknown; error: unknown }) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  mockGetClient.mockReturnValue({ from: jest.fn(() => ({ select })) });
}

describe('loadUserData', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('returns null only when the request succeeded and there is no row', async () => {
    clientWithSelect({ data: null, error: null });
    await expect(loadUserData('u1')).resolves.toBeNull();
  });

  it('returns the row when it exists', async () => {
    clientWithSelect({ data: { user_id: 'u1', habits: '[]' }, error: null });
    await expect(loadUserData('u1')).resolves.toMatchObject({ user_id: 'u1' });
  });

  it('throws on a request error instead of reporting "no row"', async () => {
    clientWithSelect({ data: null, error: { code: 'PGRST301', message: 'JWT expired' } });
    await expect(loadUserData('u1')).rejects.toMatchObject({ code: 'PGRST301' });
  });

  it('throws when Supabase is not configured', async () => {
    mockGetClient.mockReturnValue(null);
    await expect(loadUserData('u1')).rejects.toThrow(/not configured/i);
  });
});

describe('saveUserData migration fallback', () => {
  const payload = {
    habits: '[]', stats: '{}', settings: '{}', calendar_events: '[]',
    real_world_wins: '[]', journal_entries: '[]', relapse_log: '[]',
    reflection_responses: '[]', todos: '[1]', goals: '[2]',
  };

  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('retries without todos/goals when those columns do not exist yet', async () => {
    const upsert = jest.fn()
      .mockResolvedValueOnce({ error: { code: 'PGRST204', message: "Could not find the 'todos' column of 'user_data' in the schema cache" } })
      .mockResolvedValueOnce({ error: null });
    mockGetClient.mockReturnValue({ from: jest.fn(() => ({ upsert })) });

    await expect(saveUserData('u1', payload)).resolves.toBeUndefined();

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert.mock.calls[0][0]).toHaveProperty('todos');
    expect(upsert.mock.calls[1][0]).not.toHaveProperty('todos');
    expect(upsert.mock.calls[1][0]).not.toHaveProperty('goals');
    expect(upsert.mock.calls[1][0]).toHaveProperty('habits');
  });

  it('does not retry (and still throws) for unrelated errors', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const upsert = jest.fn().mockResolvedValue({ error: { code: '42501', message: 'permission denied' } });
    mockGetClient.mockReturnValue({ from: jest.fn(() => ({ upsert })) });

    await expect(saveUserData('u1', payload)).rejects.toMatchObject({ code: '42501' });
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});

describe('syncColumnFor', () => {
  it('maps habits to its legacy column name and others to last_<type>_sync', () => {
    expect(syncColumnFor('habits')).toBe('last_habit_sync');
    expect(syncColumnFor('todos')).toBe('last_todos_sync');
    expect(syncColumnFor('goals')).toBe('last_goals_sync');
    expect(syncColumnFor('journal_entries')).toBe('last_journal_entries_sync');
  });
});

describe('clearAllData', () => {
  it('removes every per-user key including goals and todos, but not runtime config', async () => {
    Object.values(KEYS).forEach(k => { mockStore[k] = '"x"'; });

    await expect(clearAllData()).resolves.toBe(true);

    USER_DATA_KEYS.forEach(k => expect(mockStore[k]).toBeUndefined());
    expect(USER_DATA_KEYS).toEqual(expect.arrayContaining([KEYS.GOALS, KEYS.TODOS, KEYS.MILESTONES_CROSSED]));
    // config + auth session + owner tag are intentionally left alone
    expect(mockStore[KEYS.SUPABASE_URL]).toBeDefined();
    expect(mockStore[KEYS.AUTH_SESSION]).toBeDefined();
    expect(mockStore[KEYS.DATA_OWNER]).toBeDefined();
  });
});
