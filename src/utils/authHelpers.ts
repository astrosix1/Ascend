/**
 * Authentication helper utilities for Ascend
 * Handles redirects to asix.live for centralized auth and subscriptions
 */

import { getSupabaseClient } from './runtimeConfig';

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
  params.set('redirect', returnTo || 'https://asix.live/projects/ascend');
  return `https://asix.live/login?${params.toString()}`;
}

/**
 * Build redirect URL to asix.live checkout page
 * @param returnTo - URL to redirect back to after checkout (default: ascend.asix.live)
 */
export function buildCheckoutRedirectUrl(returnTo?: string): string {
  const params = new URLSearchParams();
  params.set('app', 'ascend');
  params.set('redirect', returnTo || 'https://ascend.asix.live');
  return `https://asix.live/checkout?${params.toString()}`;
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

  console.log('[Redirect] Navigating to:', url);

  try {
    window.location.replace(url);
  } catch (error) {
    console.error('[Redirect] Navigation failed:', error);
    window.location.href = url;
  }
}
