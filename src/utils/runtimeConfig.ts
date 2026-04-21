/**
 * Runtime configuration — loads from static config.ts by default.
 * Can be overridden in Settings → Community Setup (stored in AsyncStorage).
 */
import { getData, setData, KEYS } from './storage';
import { CONFIG } from './config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RuntimeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  meetupKey: string;
}

let _config: RuntimeConfig = {
  supabaseUrl: CONFIG.supabase.url,
  supabaseAnonKey: CONFIG.supabase.anonKey,
  meetupKey: CONFIG.meetup?.apiKey || '',
};

let _supabaseClient: SupabaseClient | null = null;

/** Load API keys — uses static config.ts first, then checks AsyncStorage for overrides. */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const [url, anon, meetup] = await Promise.all([
    getData<string>(KEYS.SUPABASE_URL),
    getData<string>(KEYS.SUPABASE_ANON_KEY),
    getData<string>(KEYS.MEETUP_KEY),
  ]);

  // Use static config as default, but allow AsyncStorage overrides
  _config = {
    supabaseUrl: url || CONFIG.supabase.url,
    supabaseAnonKey: anon || CONFIG.supabase.anonKey,
    meetupKey: meetup || CONFIG.meetup?.apiKey || '',
  };
  _supabaseClient = null; // force re-init on next use
  return _config;
}

/** Save API keys to storage and refresh the in-memory config. */
export async function saveRuntimeConfig(partial: Partial<RuntimeConfig>): Promise<void> {
  if (partial.supabaseUrl !== undefined) await setData(KEYS.SUPABASE_URL, partial.supabaseUrl);
  if (partial.supabaseAnonKey !== undefined) await setData(KEYS.SUPABASE_ANON_KEY, partial.supabaseAnonKey);
  if (partial.meetupKey !== undefined) await setData(KEYS.MEETUP_KEY, partial.meetupKey);
  _config = { ..._config, ...partial };
  _supabaseClient = null;
}

export function getRuntimeConfig(): RuntimeConfig {
  return _config;
}

export function isSupabaseReady(): boolean {
  return Boolean(_config.supabaseUrl && _config.supabaseAnonKey);
}

export function isMeetupReady(): boolean {
  return Boolean(_config.meetupKey);
}

/** Returns (or lazily creates) the Supabase client. Returns null if not configured. */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseReady()) return null;
  if (!_supabaseClient) {
    _supabaseClient = createClient(_config.supabaseUrl, _config.supabaseAnonKey);
  }
  return _supabaseClient;
}
