/**
 * Ascend API Configuration
 *
 * To enable online features, fill in the keys below:
 *
 * 1. SUPABASE  — free at https://supabase.com
 *    Create a project, then copy the URL and anon key from
 *    Project Settings → API.
 *
 * 2. SEATGEEK — free at https://seatgeek.com/account/develop
 *    Register and create an app to get a client_id.
 *    Set it as SEATGEEK_CLIENT_ID in eventsApi.ts.
 *
 * 3. EMAILJS — free at https://www.emailjs.com
 *    Create a service, template, and copy the IDs below.
 *    Template variables expected: {{to_email}}, {{to_name}},
 *    {{from_name}}, {{message}}.
 */

export const CONFIG = {
  supabase: {
    url: 'https://kmjpucafsjxottrparyg.supabase.co',
    anonKey: 'sb_publishable_GImhVRL2C1xn3EQqejFyBA_K1TOkBTx',
  },
  meetup: {
    apiKey: 'G3QEFVIHIG4CPUK7G7JC',
  },
  emailjs: {
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
  },
};

export const isSupabaseConfigured =
  CONFIG.supabase.url !== 'YOUR_SUPABASE_URL' &&
  CONFIG.supabase.anonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const isMeetupConfigured =
  CONFIG.meetup.apiKey !== 'YOUR_MEETUP_API_KEY';

export const isEmailJSConfigured =
  CONFIG.emailjs.serviceId !== 'YOUR_EMAILJS_SERVICE_ID';
