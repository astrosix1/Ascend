/**
 * Shared environment helpers. Centralizes the "are we on a developer's
 * local machine" check so auth/subscription gates stay consistent —
 * previously this was copy-pasted independently in three different files.
 */

/**
 * Base URL of asix.live, the platform Ascend delegates auth/subscriptions/
 * checkout to. Previously hardcoded as the literal string independently in
 * ~9 places across the app (authHelpers.ts, Paywall.tsx, TopHeader.tsx,
 * SettingsScreen.tsx, AuthScreen.tsx, supabase.ts, App.tsx) — one place to
 * change it now instead of nine.
 */
export const ASIX_BASE_URL = 'https://asix.live';

/** True when running the web build on localhost/127.0.0.1 (dev mode). */
export function isLocalhostHost(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  );
}
