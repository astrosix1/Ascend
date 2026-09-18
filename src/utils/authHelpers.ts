/**
 * Authentication helper utilities for Ascend
 * Handles redirects to asix.live for centralized auth and subscriptions
 */

import { getSupabaseClient } from './runtimeConfig';
import { ASIX_BASE_URL } from './env';

const REDIRECT_FLAG = 'ascend_redirecting_to_auth';
const REDIRECT_TIMEOUT = 5000; // 5 seconds

/**
 * Check if user has a valid Supabase session
 */
export async function isUserAuthenticated(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { data } = await supabase.auth.getSession();
    return !!data?.session;
  } catch (error) {
    console.error('Error checking auth session:', error);
    return false;
  }
}

/**
 * Get the current user session
 */
export async function getUserSession() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data } = await supabase.auth.getSession();
    return data?.session;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

/**
 * Build redirect URL to asix.live login page
 * @param returnTo - URL to redirect back to after login (default: ascend.asix.live)
 */
export function buildLoginRedirectUrl(returnTo?: string): string {
  const params = new URLSearchParams();
  params.set('redirect', returnTo || `${ASIX_BASE_URL}/projects/ascend`);
  return `${ASIX_BASE_URL}/login?${params.toString()}`;
}

/**
 * Build redirect URL to asix.live checkout page
 * @param returnTo - URL to redirect back to after checkout (default: ascend.asix.live)
 */
export function buildCheckoutRedirectUrl(returnTo?: string): string {
  const params = new URLSearchParams();
  params.set('app', 'ascend');
  params.set('redirect', returnTo || 'https://ascend.asix.live');
  return `${ASIX_BASE_URL}/checkout?${params.toString()}`;
}

/**
 * Check if currently redirecting to prevent infinite loops
 */
export function isRedirecting(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REDIRECT_FLAG) === 'true';
}

/**
 * Set the redirect flag to prevent infinite loops
 */
export function setRedirecting(value: boolean): void {
  if (typeof window === 'undefined') return;

  if (value) {
    localStorage.setItem(REDIRECT_FLAG, 'true');
    // Auto-clear the flag after timeout to prevent stuck redirects
    setTimeout(() => {
      localStorage.removeItem(REDIRECT_FLAG);
    }, REDIRECT_TIMEOUT);
  } else {
    localStorage.removeItem(REDIRECT_FLAG);
  }
}

// Known-safe Supabase Auth error messages to surface as-is — everything else
// (network errors, DB errors, unexpected internals) is mapped to a generic
// message instead. Login previously showed err.message directly, which for
// unrecognized failures could leak backend detail; "Invalid login
// credentials" itself is already Supabase's own account-enumeration-safe
// wording (it doesn't distinguish "wrong password" from "no such user").
const SAFE_AUTH_ERROR_MESSAGES = [
  'Invalid login credentials',
  'Email not confirmed',
  'User already registered',
  'Password should be at least',
  'Signup requires a valid password',
  'rate limit',
];

/**
 * Map a raw auth error to user-facing text — known Supabase messages pass
 * through, anything else (which could contain internal detail) becomes a
 * generic message instead of being shown verbatim.
 */
export function getAuthErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const isKnownSafe = SAFE_AUTH_ERROR_MESSAGES.some(known =>
    message.toLowerCase().includes(known.toLowerCase())
  );
  return isKnownSafe ? message : fallback;
}

/**
 * Basic client-side password strength gate. Supabase Auth enforces its own
 * server-side policy regardless — this just avoids letting an obviously weak
 * password (e.g. "123456") get as far as a network round-trip.
 */
export function getPasswordStrengthError(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return null;
}

/**
 * Perform redirect to the given URL.
 * Clears any stuck redirect flags before navigating.
 */
export function performRedirect(url: string): void {
  const isWeb = typeof window !== 'undefined';

  if (!isWeb) {
    console.warn('Cannot redirect on non-web platform');
    return;
  }

  // Always clear the flag so it never gets stuck
  localStorage.removeItem(REDIRECT_FLAG);

  try {
    window.location.replace(url);
  } catch (error) {
    console.error('[Redirect] Navigation failed:', error);
    window.location.href = url;
  }
}
