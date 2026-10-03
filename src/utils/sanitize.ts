import DOMPurify from 'dompurify';

/**
 * Strip HTML/scripts from user-entered text before it's stored or displayed.
 * Same DOMPurify config previously used only for habit names
 * (DashboardScreen's sanitizeHabitName) — factored out so forum posts and
 * comments get the same treatment instead of relying solely on React
 * Native's <Text> auto-escaping at render time.
 */
export function sanitizeUserText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
