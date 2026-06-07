/**
 * Supabase Edge Function: send-weekly-partner-updates
 *
 * Runs every Sunday at 9 AM (scheduled via pg_cron).
 * For every user who has habits with accountability partners,
 * sends a weekly progress email to each partner via Resend.
 *
 * Environment variables required:
 *   RESEND_API_KEY   — from resend.com (free tier: 3,000 emails/month)
 *   SUPABASE_URL     — auto-injected by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Habit {
  id: string;
  name: string;
  type: 'good' | 'bad';
  streak: number;
  bestStreak: number;
  completedDates: string[];
  createdAt: string;
  accountability?: {
    partner?: {
      name: string;
      email: string;
      invitedAt: string;
    };
  };
}

interface UserSettings {
  username?: string;
  realName?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get the last 7 days as YYYY-MM-DD strings */
function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

/** Calculate completion rate for a habit over the last 7 days */
function getWeeklyStats(habit: Habit): {
  completed: number;
  total: number;
  pct: number;
  streak: number;
  bestStreak: number;
} {
  const last7 = getLast7Days();
  const completed = last7.filter(d => habit.completedDates.includes(d)).length;
  return {
    completed,
    total: 7,
    pct: Math.round((completed / 7) * 100),
    streak: habit.streak,
    bestStreak: habit.bestStreak,
  };
}

/** Emoji bar to visually represent completion (e.g. "✅✅✅✅⬜⬜⬜") */
function progressBar(completed: number, total: number): string {
  const filled = '✅'.repeat(completed);
  const empty = '⬜'.repeat(total - completed);
  return filled + empty;
}

/** Generate the email HTML for a partner */
function buildEmailHtml(
  partnerName: string,
  userName: string,
  habits: Array<{ habit: Habit; stats: ReturnType<typeof getWeeklyStats> }>
): string {
  const weekOf = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const habitRows = habits.map(({ habit, stats }) => `
    <tr>
      <td style="padding: 14px 16px; border-bottom: 1px solid #1e293b;">
        <div style="font-weight: 700; color: #f1f5f9; font-size: 15px; margin-bottom: 4px;">${habit.name}</div>
        <div style="font-family: monospace; font-size: 18px; letter-spacing: 2px; margin-bottom: 6px;">${progressBar(stats.completed, stats.total)}</div>
        <div style="color: #94a3b8; font-size: 13px;">
          ${stats.completed}/7 days &nbsp;·&nbsp;
          ${stats.pct}% this week &nbsp;·&nbsp;
          🔥 ${stats.streak}-day streak
          ${stats.streak === stats.bestStreak && stats.streak > 0 ? ' &nbsp;<span style="color: #f59e0b;">★ Personal best!</span>' : ''}
        </div>
      </td>
    </tr>
  `).join('');

  const overallCompleted = habits.reduce((sum, { stats }) => sum + stats.completed, 0);
  const overallTotal = habits.length * 7;
  const overallPct = Math.round((overallCompleted / overallTotal) * 100);

  const encouragement = overallPct >= 90
    ? "🏆 Outstanding — they're on fire this week!"
    : overallPct >= 70
    ? "💪 Solid week — keep the encouragement coming!"
    : overallPct >= 50
    ? "📈 Making progress — a kind word goes a long way."
    : "🤝 They could use your support this week.";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Progress Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 40px auto;">

    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px 16px 0 0; padding: 32px 32px 24px; text-align: center; border: 1px solid #1e293b; border-bottom: none;">
        <div style="font-size: 32px; margin-bottom: 8px;">⚡</div>
        <h1 style="color: #f1f5f9; font-size: 22px; font-weight: 800; margin: 0 0 6px;">Weekly Progress Update</h1>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Week of ${weekOf}</p>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="background: #1e293b; padding: 24px 32px 16px; border-left: 1px solid #1e293b; border-right: 1px solid #1e293b;">
        <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 8px;">Hi ${partnerName},</p>
        <p style="color: #cbd5e1; font-size: 15px; margin: 0;">
          Here's how <strong style="color: #f1f5f9;">${userName}</strong> did on their habits this week.
          As their accountability partner, your support means everything.
        </p>
      </td>
    </tr>

    <!-- Overall score -->
    <tr>
      <td style="background: #1e293b; padding: 16px 32px; border-left: 1px solid #1e293b; border-right: 1px solid #1e293b;">
        <div style="background: #0f172a; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #334155;">
          <div style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Overall This Week</div>
          <div style="color: ${overallPct >= 70 ? '#22c55e' : overallPct >= 50 ? '#f59e0b' : '#ef4444'}; font-size: 36px; font-weight: 800;">${overallPct}%</div>
          <div style="color: #64748b; font-size: 13px;">${overallCompleted} of ${overallTotal} possible check-ins</div>
          <div style="color: #94a3b8; font-size: 13px; margin-top: 8px;">${encouragement}</div>
        </div>
      </td>
    </tr>

    <!-- Habit breakdown -->
    <tr>
      <td style="background: #1e293b; padding: 8px 32px 16px; border-left: 1px solid #1e293b; border-right: 1px solid #1e293b;">
        <div style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Habit Breakdown</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #334155; border-radius: 10px; overflow: hidden;">
          ${habitRows}
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="background: #1e293b; padding: 16px 32px 24px; border-left: 1px solid #1e293b; border-right: 1px solid #1e293b;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          Reply to this email to send ${userName} a message of encouragement — they'll see it next time they open Ascend.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #0f172a; border-radius: 0 0 16px 16px; padding: 20px 32px; text-align: center; border: 1px solid #1e293b; border-top: none;">
        <p style="color: #475569; font-size: 12px; margin: 0;">
          Sent by <strong>Ascend</strong> · You're receiving this because ${userName} added you as an accountability partner.
        </p>
      </td>
    </tr>

  </table>
</body>
</html>
  `.trim();
}

/** Send one email via Resend */
async function sendEmail(to: string, toName: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Ascend <updates@asix.live>',
      to: [{ email: to, name: toName }],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    // Allow cron invocation (POST with no body) and manual GET for testing
    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all user data rows that have habits stored
    const { data: rows, error } = await sb
      .from('user_data')
      .select('user_id, habits, settings')
      .not('habits', 'is', null);

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ message: 'No users found', sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        // Parse habits JSON
        const habits: Habit[] = typeof row.habits === 'string'
          ? JSON.parse(row.habits)
          : row.habits;

        if (!Array.isArray(habits) || habits.length === 0) continue;

        // Parse settings for display name
        const settings: UserSettings = row.settings
          ? (typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings)
          : {};
        const userName = settings.realName || settings.username || 'Your friend';

        // Find all good habits that have accountability partners
        const habitsWithPartners = habits.filter(
          h => h.type === 'good' && h.accountability?.partner?.email
        );

        if (habitsWithPartners.length === 0) continue;

        // Group by partner email (one email per partner, covering all their habits)
        const partnerMap = new Map<string, { partner: NonNullable<Habit['accountability']>['partner'] & {}; habits: Habit[] }>();

        for (const habit of habitsWithPartners) {
          const partner = habit.accountability!.partner!;
          const key = partner.email.toLowerCase();
          if (!partnerMap.has(key)) {
            partnerMap.set(key, { partner, habits: [] });
          }
          partnerMap.get(key)!.habits.push(habit);
        }

        // Send one email per unique partner
        for (const [, { partner, habits: partnerHabits }] of partnerMap) {
          const statsData = partnerHabits.map(habit => ({
            habit,
            stats: getWeeklyStats(habit),
          }));

          const html = buildEmailHtml(partner.name, userName, statsData);
          const subject = `📊 ${userName}'s weekly habit update — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

          await sendEmail(partner.email, partner.name, subject, html);
          emailsSent++;

          console.log(`✅ Sent to ${partner.email} for user ${row.user_id}`);
        }
      } catch (userErr) {
        console.error(`Failed for user ${row.user_id}:`, userErr);
        errors.push(`${row.user_id}: ${userErr}`);
      }
    }

    return new Response(
      JSON.stringify({ message: 'Done', emailsSent, errors }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Fatal error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
