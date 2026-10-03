/**
 * Ascend API Configuration
 *
 * Reads from Expo public env vars first (EXPO_PUBLIC_* — inlined at build
 * time by Expo/Metro, and settable per-environment in Vercel/EAS), falling
 * back to the literal defaults below so local dev and existing deployments
 * that haven't set the env vars keep working unchanged. This lets
 * dev/staging/prod use different Supabase projects instead of sharing one.
 *
 * To enable online features (or point at a different project), set:
 *
 * 1. SUPABASE  — free at https://supabase.com
 *    EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
 *    Create a project, then copy the URL and anon key from
 *    Project Settings → API.
 *
 * 2. SEATGEEK — free at https://seatgeek.com/account/develop
 *    EXPO_PUBLIC_SEATGEEK_CLIENT_ID
 *    Register and create an app to get a client_id.
 *
 * 3. EMAILJS — free at https://www.emailjs.com
 *    EXPO_PUBLIC_EMAILJS_SERVICE_ID / _TEMPLATE_ID / _PUBLIC_KEY
 *    Create a service, template, and copy the IDs below.
 *    Template variables expected: {{to_email}}, {{to_name}},
 *    {{from_name}}, {{message}}.
 */

export const CONFIG = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://kmjpucafsjxottrparyg.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_GImhVRL2C1xn3EQqejFyBA_K1TOkBTx',
  },
  meetup: {
    apiKey: process.env.EXPO_PUBLIC_SEATGEEK_CLIENT_ID || 'G3QEFVIHIG4CPUK7G7JC',
  },
  emailjs: {
    serviceId: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || 'YOUR_EMAILJS_SERVICE_ID',
    templateId: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || 'YOUR_EMAILJS_TEMPLATE_ID',
    publicKey: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || 'YOUR_EMAILJS_PUBLIC_KEY',
  },
};

export const isSupabaseConfigured =
  CONFIG.supabase.url !== 'YOUR_SUPABASE_URL' &&
  CONFIG.supabase.anonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const isMeetupConfigured =
  CONFIG.meetup.apiKey !== 'YOUR_MEETUP_API_KEY';

export const isEmailJSConfigured =
  CONFIG.emailjs.serviceId !== 'YOUR_EMAILJS_SERVICE_ID';
