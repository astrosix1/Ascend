# Deploy: Weekly Partner Update Emails

## Step 1 — Get a Resend API Key (free)

1. Go to https://resend.com and create a free account
2. Go to API Keys → Create API Key
3. Copy the key (starts with `re_`)
4. Add your sending domain: `asix.live` (verify DNS records they show you)

## Step 2 — Generate a CRON_SECRET

This function is deployed with `--no-verify-jwt` (pg_cron's `net.http_post` doesn't
send a Supabase-signed JWT), so `CRON_SECRET` is the function's **only** access
control — every request must present it, or it's rejected before touching the
database. Generate a long random value and keep it secret (never commit it):

```bash
# macOS/Linux
openssl rand -hex 32

# or with node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3 — Deploy the Edge Function

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

# Set secrets
supabase secrets set RESEND_API_KEY=re_YOUR_KEY_HERE
supabase secrets set CRON_SECRET=the_random_value_from_step_2
```

## Step 4 — Schedule with pg_cron

In Supabase Dashboard → SQL Editor, run (this stores the secret as a database
setting so it never appears in `cron.job` logs in plaintext queries elsewhere —
adjust for your Postgres version if `alter database ... set` isn't available):

```sql
-- Enable pg_cron extension (if not already enabled)
create extension if not exists pg_cron;

-- One-time: store the secret so the cron job below can reference it
-- without hardcoding it into the scheduled SQL itself.
alter database postgres set app.cron_secret = 'the_random_value_from_step_2';

-- Schedule: every Sunday at 9:00 AM UTC
select cron.schedule(
  'weekly-partner-emails',
  '0 9 * * 0',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-weekly-partner-updates',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project ref.

## Step 5 — Test manually

Trigger the function manually to verify it works before waiting for Sunday —
this now requires the secret, so a bare browser visit will correctly get a 401:

```bash
curl -X POST \
  -H "Authorization: Bearer the_random_value_from_step_2" \
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
