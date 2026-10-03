/**
 * Shared environment helpers. Every asix.live-specific value lives here and is
 * overridable through EXPO_PUBLIC_* env vars (inlined at build time; reference
 * them as literal `process.env.EXPO_PUBLIC_X` so Expo can substitute them).
 */

/** Base URL of asix.live: auth, subscriptions and checkout live there. */
export const ASIX_BASE_URL: string =
  process.env.EXPO_PUBLIC_ASIX_BASE_URL || 'https://asix.live';

/** This app's row in asix.live's `projects` table (`slug`). */
export const ASIX_PROJECT_SLUG: string =
  process.env.EXPO_PUBLIC_ASIX_PROJECT_SLUG || 'ascend';

/** Plan slug used by asix.live checkout (/checkout?plan=<slug>). */
export const ASIX_PLAN_SLUG: string =
  process.env.EXPO_PUBLIC_ASIX_PLAN_SLUG || 'ascend';

/** Where "Go Premium" sends people. */
export function buildPremiumCheckoutUrl(): string {
  return `${ASIX_BASE_URL}/checkout?plan=${encodeURIComponent(ASIX_PLAN_SLUG)}`;
}

/**
 * asix.live sign-in that returns to this app. `return_to` is allowlisted by
 * asix.live to https://*.asix.live.
 */
export function buildSignInUrl(returnTo?: string): string {
  const back =
    returnTo || (typeof window !== 'undefined' ? window.location.origin + '/' : '');
  return `${ASIX_BASE_URL}/login?return_to=${encodeURIComponent(back)}`;
}

/** True when running the web build on localhost/127.0.0.1 (dev mode). */
export function isLocalhostHost(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  );
}
