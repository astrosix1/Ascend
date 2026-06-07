# Deploy: Weekly Partner Update Emails

## Step 1 — Get a Resend API Key (free)

1. Go to https://resend.com and create a free account
2. Go to API Keys → Create API Key
3. Copy the key (starts with `re_`)
4. Add your sending domain: `asix.live` (verify DNS records they show you)

## Step 2 — Deploy the Edge Function

Run these commands from the `ascend` project folder:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login
supabase login

# Link to your project (get project ref from Supabase dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy send-weekly-partner-updates --no-verify-jwt

# Set your Resend API key as a secret
supabase secrets set RESEND_API_KEY=re_YOUR_KEY_HERE
```

## Step 3 — Schedule with pg_cron

In Supabase Dashboard → SQL Editor, run:

```sql
-- Enable pg_cron extension (if not already enabled)
create extension if not exists pg_cron;

-- Schedule: every Sunday at 9:00 AM UTC
select cron.schedule(
  'weekly-partner-emails',
  '0 9 * * 0',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-weekly-partner-updates',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project ref.

## Step 4 — Test manually

Trigger the function manually to verify it works before waiting for Sunday:

```bash
supabase functions invoke send-weekly-partner-updates --no-verify-jwt
```

Or visit in browser:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-weekly-partner-updates
```

## What the email looks like

- **From:** updates@asix.live
- **Subject:** "📊 Nick's weekly habit update — Jun 8"
- **Content:**
  - Overall completion % with color (green/amber/red)
  - Per-habit breakdown with emoji progress bar (✅✅✅⬜⬜⬜⬜)
  - Streak info + personal best flag
  - Encouragement message based on overall %

## Cron schedule reference

| Schedule | Meaning |
|----------|---------|
| `0 9 * * 0` | Every Sunday at 9 AM UTC |
| `0 9 * * 1` | Every Monday at 9 AM UTC |
| `0 17 * * 5` | Every Friday at 5 PM UTC |

## View scheduled jobs

```sql
select * from cron.job;
```

## Remove the schedule

```sql
select cron.unschedule('weekly-partner-emails');
```
