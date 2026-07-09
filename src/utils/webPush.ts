/**
 * Web Push Notification Utility for Ascend
 *
 * Handles browser notification permission, scheduling alarm notifications,
 * and service worker registration for background push support.
 */

import { Alarm } from './types';

// Store active timeout IDs so we can cancel/reschedule
const scheduledTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

// ─── Permission ──────────────────────────────────────────────────────────────

export type NotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result as NotificationPermission;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermission;
}

// ─── Service Worker Registration ─────────────────────────────────────────────

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.warn('[Push] Service worker registration failed:', err);
    return null;
  }
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

/**
 * Get milliseconds until the next occurrence of an alarm
 */
function msUntilNextAlarm(alarm: Alarm): number {
  const now = new Date();
  const [hours, minutes] = alarm.time.split(':').map(Number);
  const today = now.getDay(); // 0-6

  // Find the next day this alarm fires
  for (let offset = 0; offset <= 7; offset++) {
    const candidateDay = (today + offset) % 7;
    if (!alarm.days.includes(candidateDay)) continue;

    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);

    // If it's today but the time has already passed, skip to next occurrence
    if (offset === 0 && candidate.getTime() <= now.getTime()) continue;

    return candidate.getTime() - now.getTime();
  }

  // Fallback: 24 hours (shouldn't happen)
  return 24 * 60 * 60 * 1000;
}

/**
 * Show a browser notification for an alarm
 */
function showAlarmNotification(alarm: Alarm): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const VOICE_DESCRIPTIONS: Record<Alarm['voiceOption'], string> = {
    news: '📰 Check today\'s news briefing',
    weather: '🌤️ View today\'s weather forecast',
    briefing: '📊 Review yesterday\'s progress',
    motivational: '⚡ Open Ascend for your daily motivation',
    silent: 'Open Ascend',
  };

  const body = VOICE_DESCRIPTIONS[alarm.voiceOption] || 'Open Ascend to stay on track';

  const notification = new Notification(`⏰ ${alarm.label || 'Ascend Reminder'}`, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `ascend-alarm-${alarm.id}`,
    renotify: true,
    requireInteraction: false,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

/**
 * Schedule a single alarm — fires once then re-schedules for next occurrence
 */
function scheduleAlarm(alarm: Alarm): void {
  // Cancel any existing schedule for this alarm
  const existing = scheduledTimeouts.get(alarm.id);
  if (existing) clearTimeout(existing);

  if (!alarm.enabled || alarm.days.length === 0) return;

  const ms = msUntilNextAlarm(alarm);
  const timeout = setTimeout(() => {
    showAlarmNotification(alarm);
    // Re-schedule for next occurrence
    scheduleAlarm(alarm);
  }, ms);

  scheduledTimeouts.set(alarm.id, timeout);

}

/**
 * Schedule all enabled alarms.
 * Call this whenever alarms change.
 */
export function scheduleAlarmNotifications(alarms: Alarm[]): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  // Clear all existing
  scheduledTimeouts.forEach(t => clearTimeout(t));
  scheduledTimeouts.clear();

  // Schedule each enabled alarm
  alarms.filter(a => a.enabled && a.days.length > 0).forEach(scheduleAlarm);
}

/**
 * Clear all scheduled notifications.
 * Call on sign-out or when notifications are disabled.
 */
export function clearAllScheduledNotifications(): void {
  scheduledTimeouts.forEach(t => clearTimeout(t));
  scheduledTimeouts.clear();
}

/**
 * Initialize push notifications on app load.
 * Registers service worker, and schedules notifications if permission already granted.
 */
export async function initPushNotifications(alarms: Alarm[]): Promise<void> {
  await registerServiceWorker();
  if (getNotificationPermission() === 'granted') {
    scheduleAlarmNotifications(alarms);
  }
}
