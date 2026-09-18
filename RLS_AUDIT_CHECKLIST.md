# Ascend RLS (Row-Level Security) Audit Checklist

**Last Updated:** 2026-09-17
**Status:** ⚠️ Fix written, NOT YET APPLIED to the live database — see "Next Steps"

---

## 🔴 CRITICAL ISSUE — fix committed, not yet deployed

**`forum_posts` and `forum_comments` INSERT policies both allowed spoofed/anonymous inserts.**

The 2026-06-03 version of this checklist claimed the `forum_posts` half of this
was already fixed via a `supabase-rls-fix.sql` file — that file does not exist
anywhere in this repository, and the schema reference embedded in
`src/utils/supabase.ts` still showed the vulnerable policy
(`with check (true)`) on **both** `forum_posts` and `forum_comments` (the
`forum_comments` half was never previously flagged at all). There was no way
to verify from source control what, if anything, was actually applied in
production.

- Previous (as documented in source): `with check (true)` on both tables —
  anyone holding the public anon key (which is meant to be public — it's
  embedded in the app bundle) could insert a post or comment with **any**
  `user_id`, impersonating any user, fully unauthenticated.
- Fixed: `with check (auth.uid() = user_id)` on both tables.
- Fix file (tracked in git, idempotent):
  `supabase/migrations/20260917000000_fix_forum_insert_rls.sql`
- Status: **written but not applied** — this file must be run against the
  live Supabase project (see Next Steps). The client code already derives
  `user_id` server-side from the authenticated session
  (`createPost`/`createComment` in `src/utils/supabase.ts` call
  `sb.auth.getUser()` rather than trusting client input), so applying this
  does not change legitimate app behavior.

---

## ✅ RLS Policies That Should Be In Place

Ascend's real schema is two tables: `user_data` (one row per user, all app
data stored as JSON columns — habits, stats, settings, journal entries, goals,
etc. all live *inside* this one table, not as separate tables) and
`forum_posts` / `forum_comments` (the community forum). The previous version
of this checklist listed hypothetical `journal_entries` and `goals` tables —
those don't exist separately and have been removed below.

### `user_data` table
- [x] **SELECT**: `auth.uid() = user_id` — documented in `src/utils/supabase.ts`
- [x] **INSERT**: `auth.uid() = user_id` — documented in `src/utils/supabase.ts`
- [x] **UPDATE**: `auth.uid() = user_id` — documented in `src/utils/supabase.ts`
- [ ] **DELETE**: no policy exists (by RLS default, this means no one can
      delete via the client at all — this is safe, not a gap, unless the app
      ever needs a user-initiated "delete my data" feature, in which case add
      `auth.uid() = user_id` for DELETE too)

### `forum_posts` table
- [x] **SELECT**: `using (true)` — intentionally public (it's a public forum)
- [x] **INSERT**: `auth.uid() = user_id` — fixed by the migration above
- [x] **UPDATE**: `auth.uid() = user_id` — already correct
- [x] **DELETE**: `auth.uid() = user_id` — already correct

### `forum_comments` table
- [x] **SELECT**: `using (true)` — intentionally public
- [x] **INSERT**: `auth.uid() = user_id` — fixed by the migration above
- [x] **UPDATE**: `auth.uid() = user_id` — already correct
- [x] **DELETE**: `auth.uid() = user_id` — already correct

All of the above reflects `src/utils/supabase.ts`'s embedded schema reference
after this pass — that comment block is the single source of truth for what
*should* be live; the migration file is what actually gets it there.

---

## 🔍 How to Verify RLS Policies

### Apply the fix
In Supabase Dashboard → SQL Editor, paste and run the contents of
`supabase/migrations/20260917000000_fix_forum_insert_rls.sql`.

### Verify it took
```sql
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('forum_posts', 'forum_comments', 'user_data')
order by tablename, cmd;
```
Every `insert` row's `with_check` column should contain `auth.uid() = user_id`
— none should show `true`.

### Test enforcement
- As a signed-out (anon-key-only) client, attempt an insert into `forum_posts`
  with an arbitrary `user_id` — it should now fail with a 401/403 from
  PostgREST.
- As a signed-in user, attempt to update or delete another user's post/comment
  — should fail (already enforced pre-existing policy).

---

## 📋 Implementation Notes

- RLS is **enabled** on all three tables (`user_data`, `forum_posts`,
  `forum_comments`) — confirmed via the `alter table ... enable row level
  security` statements in both the migration and the schema reference.
- RLS policies are **additive** — one policy per operation per role; a table
  with RLS enabled and zero policies for an operation denies that operation
  entirely (this is why `user_data` has no working DELETE path today, safely).

---

## Next Steps

1. **Apply the migration**: run
   `supabase/migrations/20260917000000_fix_forum_insert_rls.sql` in the
   Supabase SQL editor for the live project — this was **not** done as part
   of this repository-level fix pass, since it requires live database access.
2. **Run the verification query above** and confirm both INSERT policies show
   `auth.uid() = user_id`.
3. **Test in the Ascend app**: try posting/commenting as a signed-in user
   (should still work normally) and try a raw unauthenticated REST insert
   (should now be rejected).
4. **Monitor logs**: watch for unexpected permission denials in Supabase logs
   for the first few days after applying.

---

**Owner:** Ascend Development
**Last Reviewed:** 2026-09-17
