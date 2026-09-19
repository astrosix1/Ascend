# Ascend RLS (Row-Level Security) Audit Checklist

**Last Updated:** 2026-09-19
**Status:** ✅ Applied and verified against the live database

---

## 🔴 CRITICAL ISSUE — fixed and confirmed live

**`forum_posts` and `forum_comments` INSERT policies both allowed spoofed/anonymous inserts.**

The 2026-06-03 version of this checklist claimed the `forum_posts` half of this
was already fixed via a `supabase-rls-fix.sql` file — that file does not exist
anywhere in this repository, and the schema reference embedded in
`src/utils/supabase.ts` still showed the vulnerable policy
(`with check (true)`) on **both** `forum_posts` and `forum_comments` (the
`forum_comments` half was never previously flagged at all).

- Previous: `with check (true)` on both tables — anyone holding the public
  anon key (which is meant to be public — it's embedded in the app bundle)
  could insert a post or comment with **any** `user_id`, impersonating any
  user, fully unauthenticated.
- Fixed: `with check (auth.uid() = user_id)` on both tables.
- Fix file (tracked in git):
  `supabase/migrations/20260917000000_fix_forum_insert_rls.sql`
- **Applied to the live project on 2026-09-19 and verified** via
  `pg_policies` (see query below) — no `with_check = true` INSERT policy
  remains on either table.

### A real trap this surfaced

Verification turned up something worth recording: the live database already
had a *second*, correctly-scoped INSERT policy on each table
(`"Users can insert their own posts"` / `"...comments"`, `with check
(auth.uid() = user_id)`) sitting alongside the vulnerable `with check (true)`
one, likely from some earlier, undocumented partial fix. **That correct
policy provided zero actual protection** — Postgres combines multiple
permissive policies for the same operation with OR, so an insert succeeded
if *either* policy allowed it, and `true` always does. A stricter policy
next to a permissive one is not a fix; the permissive one wins. What
actually closed the hole was *dropping* the `true` policy, not adding a
better one beside it.

Net effect: each table now has two functionally-identical INSERT policies
(the pre-existing correct one, plus `"Insert own posts"` /
`"Insert own comments"` from this migration). Harmless — not a security
issue, just redundant — but worth cleaning up:

```sql
-- Optional cleanup: drop the duplicate, keep the pre-existing one
drop policy if exists "Insert own posts" on forum_posts;
drop policy if exists "Insert own comments" on forum_comments;
```

---

## ✅ RLS Policies That Should Be In Place

Ascend's real schema is two tables: `user_data` (one row per user, all app
data stored as JSON columns — habits, stats, settings, journal entries, goals,
etc. all live *inside* this one table, not as separate tables) and
`forum_posts` / `forum_comments` (the community forum). The previous version
of this checklist listed hypothetical `journal_entries` and `goals` tables —
those don't exist separately and have been removed below.

### `user_data` table (verified live 2026-09-19)
- [x] **SELECT**: `auth.uid() = user_id`
- [x] **INSERT**: `auth.uid() = user_id`
- [x] **UPDATE**: `auth.uid() = user_id`
- [ ] **DELETE**: no policy exists (by RLS default, this means no one can
      delete via the client at all — this is safe, not a gap, unless the app
      ever needs a user-initiated "delete my data" feature, in which case add
      `auth.uid() = user_id` for DELETE too)

### `forum_posts` table (verified live 2026-09-19)
- [x] **SELECT**: `using (true)` — intentionally public (it's a public forum)
- [x] **INSERT**: `auth.uid() = user_id` — confirmed, no more `true` policy
- [x] **UPDATE**: `auth.uid() = user_id`
- [x] **DELETE**: `auth.uid() = user_id`

### `forum_comments` table (verified live 2026-09-19)
- [x] **SELECT**: `using (true)` — intentionally public
- [x] **INSERT**: `auth.uid() = user_id` — confirmed, no more `true` policy
- [x] **UPDATE**: `auth.uid() = user_id`
- [x] **DELETE**: `auth.uid() = user_id`

All of the above reflects `src/utils/supabase.ts`'s embedded schema reference
— that comment block is the single source of truth for what *should* be
live, and as of 2026-09-19 it matches what's actually deployed.

---

## 🔍 How to Verify RLS Policies

```sql
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('forum_posts', 'forum_comments', 'user_data')
order by tablename, cmd;
```
Every `insert` row's `with_check` column should contain `auth.uid() = user_id`
— none should show `true`. Confirmed 2026-09-19.

### Test enforcement
- As a signed-out (anon-key-only) client, attempt an insert into `forum_posts`
  with an arbitrary `user_id` — should fail with a 401/403 from PostgREST.
- As a signed-in user, attempt to update or delete another user's post/comment
  — should fail (enforced by the pre-existing UPDATE/DELETE policies).

---

## 📋 Implementation Notes

- RLS is **enabled** on all three tables (`user_data`, `forum_posts`,
  `forum_comments`).
- RLS policies are **additive within a table** but **ORed together per
  operation** when more than one permissive policy covers the same command —
  see "A real trap this surfaced" above. A table with RLS enabled and zero
  policies for an operation denies that operation entirely (this is why
  `user_data` has no working DELETE path today, safely).

---

## Next Steps

1. ~~Apply the migration~~ — done, 2026-09-19.
2. ~~Verify via pg_policies~~ — done, 2026-09-19.
3. **Test in the Ascend app**: post/comment as a signed-in user (should work
   normally) and confirm a raw unauthenticated REST insert is rejected.
4. **Monitor logs**: watch for unexpected permission denials in Supabase logs
   for the first few days after applying.
5. **Optional**: run the duplicate-policy cleanup above.

---

**Owner:** Ascend Development
**Last Reviewed:** 2026-09-19
