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

/**
 * Cookie-based storage adapter for web.
 * Mirrors asix.live's CrossDomainCookieStorage so Ascend can read the same
 * session cookies that asix.live wrote with Domain=.asix.live.
 */
const WebCookieStorage = {
  getItem(key: string): string | null {
    if (typeof document === 'undefined') return null;
    const name = key + '=';
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      c = c.trim();
      if (c.startsWith(name)) return decodeURIComponent(c.substring(name.length));
    }
    return null;
  },
  setItem(key: string, value: string): void {
    if (typeof document === 'undefined') return;
    const maxAge = 60 * 60 * 24 * 365;
    const domain = window.location.hostname.includes('localhost') ? '' : '.asix.live';
    const domainAttr = domain ? `; domain=${domain}` : '';
    document.cookie = `${key}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/${domainAttr}; samesite=Lax`;
  },
  removeItem(key: string): void {
    if (typeof document === 'undefined') return;
    const domain = window.location.hostname.includes('localhost') ? '' : '.asix.live';
    const domainAttr = domain ? `; domain=${domain}` : '';
    document.cookie = `${key}=; max-age=0; path=/${domainAttr}`;
  },
};

/** Returns (or lazily creates) the Supabase client. Returns null if not configured. */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseReady()) return null;
  if (!_supabaseClient) {
    const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

    _supabaseClient = createClient(_config.supabaseUrl, _config.supabaseAnonKey, {
      auth: {
        // On web: use cookie storage so we can read the session asix.live wrote.
        // On native: fall back to default AsyncStorage-based storage.
        storage: isWeb ? WebCookieStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _supabaseClient;
}
