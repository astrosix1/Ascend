-- Fix: forum_posts and forum_comments allowed unauthenticated/spoofed inserts.
--
-- Both tables' INSERT policies were `with check (true)` — anyone holding the
-- public anon key (which is meant to be public; it's embedded in the app
-- bundle) could insert a post or comment with ANY user_id, impersonating any
-- user, with no authentication at all. RLS_AUDIT_CHECKLIST.md claimed the
-- forum_posts half of this was already patched via a `supabase-rls-fix.sql`
-- that does not exist in this repo; the live policy state was unverified.
-- This migration is the tracked, idempotent source of truth going forward.
--
-- The client already derives user_id server-side from the authenticated
-- session (see createPost/createComment in src/utils/supabase.ts, which call
-- sb.auth.getUser() rather than trusting client input), so tightening this
-- check does not change legitimate behavior — it only blocks spoofed/
-- unauthenticated inserts made directly against the REST API.

alter table forum_posts    enable row level security;
alter table forum_comments enable row level security;
alter table user_data      enable row level security;

drop policy if exists "Public insert posts" on forum_posts;
create policy "Insert own posts" on forum_posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "Public insert comments" on forum_comments;
create policy "Insert own comments" on forum_comments
  for insert with check (auth.uid() = user_id);

-- Verification query — every INSERT policy below should show auth.uid() in
-- with_check, never `true`. Run this after applying to confirm the fix took:
--
-- select schemaname, tablename, policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename in ('forum_posts', 'forum_comments', 'user_data')
-- order by tablename, cmd;
