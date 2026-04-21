import { getSupabaseClient, isSupabaseReady } from './runtimeConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DBForumPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  comment_count?: number;
}

export interface DBForumComment {
  id: string;
  post_id: string;
  content: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
}

export interface DBUserData {
  user_id: string;
  habits: string;       // JSON
  stats: string;        // JSON
  settings: string;     // JSON
  calendar_events: string;
  real_world_wins: string;
  journal_entries: string;
  relapse_log: string;
  reflection_responses: string;
  updated_at: string;
}

// ─── Forum Posts ──────────────────────────────────────────────────────────────

export async function fetchPosts(category?: string): Promise<DBForumPost[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  let query = sb
    .from('forum_posts')
    .select('*, forum_comments(count)')
    .order('created_at', { ascending: false });
  if (category && category !== 'All') query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((p: any) => ({
    ...p,
    comment_count: p.forum_comments?.[0]?.count ?? 0,
  }));
}

export async function fetchFeaturedPost(): Promise<DBForumPost | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('forum_posts')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) {
      console.warn('Featured post fetch error:', error);
      return null;
    }
    return (data && data.length > 0) ? data[0] : null;
  } catch (err: any) {
    console.warn('Featured post fetch exception:', err);
    return null;
  }
}

export async function createPost(post: {
  title: string; body: string; author_name: string; category: string; tags: string[];
}): Promise<DBForumPost> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Supabase not configured');

  // Get current user ID
  const { data: { user }, error: authError } = await sb.auth.getUser();
  if (authError || !user) throw new Error('You must be signed in to post');

  try {
    // Map body to content (database column name)
    const { data, error } = await sb
      .from('forum_posts')
      .insert({
        title: post.title,
        content: post.body, // Note: database uses "content", not "body"
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message || 'Failed to create post');
    }

    if (!data) throw new Error('Post created but no data returned');
    return data;
  } catch (err: any) {
    console.error('Post creation error:', err);
    throw err;
  }
}

export async function fetchComments(postId: string): Promise<DBForumComment[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from('forum_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createComment(comment: {
  post_id: string; body: string; author_name: string;
}): Promise<DBForumComment> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Supabase not configured');

  // Get current user ID
  const { data: { user }, error: authError } = await sb.auth.getUser();
  if (authError || !user) throw new Error('You must be signed in to comment');

  try {
    const { data, error } = await sb
      .from('forum_comments')
      .insert({
        post_id: comment.post_id,
        content: comment.body, // Map body to content
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Comment insert error:', error);
      throw new Error(error.message || 'Failed to create comment');
    }

    return data;
  } catch (err: any) {
    console.error('Comment creation error:', err);
    throw err;
  }
}

export async function updateComment(commentId: string, content: string): Promise<DBForumComment> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Supabase not configured');

  // Get current user ID
  const { data: { user }, error: authError } = await sb.auth.getUser();
  if (authError || !user) throw new Error('You must be signed in to edit');

  try {
    const { data, error } = await sb
      .from('forum_comments')
      .update({ content })
      .eq('id', commentId)
      .eq('user_id', user.id) // Only update if user owns the comment
      .select()
      .single();

    if (error) {
      console.error('Comment update error:', error);
      throw new Error(error.message || 'Failed to update comment');
    }

    return data;
  } catch (err: any) {
    console.error('Update comment error:', err);
    throw err;
  }
}

export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, error: 'Supabase not configured' };

  console.log('Attempting to delete comment:', commentId);

  try {
    // First, fetch the comment to verify ownership
    const { data: comment, error: fetchError } = await sb
      .from('forum_comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      console.error('Could not fetch comment:', fetchError);
      return { success: false, error: 'Comment not found' };
    }

    // Get current user
    const { data: { user }, error: authError } = await sb.auth.getUser();
    if (authError || !user) {
      console.error('Not authenticated:', authError);
      return { success: false, error: 'You must be signed in to delete' };
    }

    console.log('Comment user_id:', comment.user_id, 'Current user:', user.id);

    // Check ownership
    if (comment.user_id !== user.id) {
      console.warn('User does not own this comment');
      return { success: false, error: 'You can only delete your own comments' };
    }

    // Delete the comment
    const { error: deleteError } = await sb
      .from('forum_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Comment deletion error:', deleteError);
      return { success: false, error: deleteError.message || 'Failed to delete comment' };
    }

    console.log('Comment deleted successfully');
    return { success: true };
  } catch (err: any) {
    console.error('Delete comment error:', err);
    return { success: false, error: err.message || 'Failed to delete comment' };
  }
}

export async function updatePost(postId: string, updates: { title?: string; content?: string }): Promise<DBForumPost | null> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Supabase not configured');

  // Get current user ID
  const { data: { user }, error: authError } = await sb.auth.getUser();
  if (authError || !user) throw new Error('You must be signed in to edit');

  try {
    const { data, error } = await sb
      .from('forum_posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .eq('user_id', user.id) // Only update if user owns the post
      .select()
      .single();

    if (error) {
      console.error('Post update error:', error);
      throw new Error(error.message || 'Failed to update post');
    }

    return data;
  } catch (err: any) {
    console.error('Update post error:', err);
    throw err;
  }
}

export async function deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, error: 'Supabase not configured' };

  console.log('Attempting to delete post:', postId);

  try {
    // First, fetch the post to verify ownership
    const { data: post, error: fetchError } = await sb
      .from('forum_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      console.error('Could not fetch post:', fetchError);
      return { success: false, error: 'Post not found' };
    }

    // Get current user
    const { data: { user }, error: authError } = await sb.auth.getUser();
    if (authError || !user) {
      console.error('Not authenticated:', authError);
      return { success: false, error: 'You must be signed in to delete' };
    }

    console.log('Post user_id:', post.user_id, 'Current user:', user.id);

    // Check ownership
    if (post.user_id !== user.id) {
      console.warn('User does not own this post');
      return { success: false, error: 'You can only delete your own posts' };
    }

    // Delete the post
    const { error: deleteError } = await sb
      .from('forum_posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      console.error('Post deletion error:', deleteError);
      return { success: false, error: deleteError.message || 'Failed to delete post' };
    }

    console.log('Post deleted successfully');
    return { success: true };
  } catch (err: any) {
    console.error('Delete post error:', err);
    return { success: false, error: err.message || 'Failed to delete post' };
  }
}

// ─── User Cloud Sync ──────────────────────────────────────────────────────────

export async function saveUserData(userId: string, payload: Omit<DBUserData, 'user_id' | 'updated_at'>): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) {
    console.warn('Supabase not configured - skipping save');
    return;
  }
  try {
    const { error } = await sb.from('user_data').upsert({
      user_id: userId,
      ...payload,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error('Failed to save user data:', error);
    }
  } catch (err: any) {
    console.error('Save user data error:', err.message);
  }
}

export async function loadUserData(userId: string): Promise<DBUserData | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('user_data').select('*').eq('user_id', userId).single();
    if (error) {
      // 406 means no rows found, which is expected for new users
      if (error.code !== '406') {
        console.error('Failed to load user data:', error);
      }
      return null;
    }
    return data || null;
  } catch (err: any) {
    console.error('Load user data error:', err.message);
    return null;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Supabase not configured');
  return sb.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Supabase not configured');
  return sb.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function getSession() {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const sb = getSupabaseClient();
  if (!sb) return { data: { subscription: { unsubscribe: () => {} } } };
  return sb.auth.onAuthStateChange(callback);
}

export { isSupabaseReady };

/*
──────────────────────────────────────────────────────────────────────────────
  SUPABASE SQL SETUP  (run once in SQL Editor at supabase.com → your project)
──────────────────────────────────────────────────────────────────────────────

-- Forum posts (community, public)
create table if not exists forum_posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  user_id     uuid references auth.users(id),
  category    text default 'General',
  tags        text[] default '{}',
  is_featured boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists forum_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references forum_posts(id) on delete cascade,
  content     text not null,
  user_id     uuid references auth.users(id),
  is_helpful  boolean default false,
  created_at  timestamptz default now()
);

-- Per-user cloud data
create table if not exists user_data (
  user_id           uuid references auth.users primary key,
  habits            text default '[]',
  stats             text default '{}',
  settings          text default '{}',
  calendar_events   text default '[]',
  real_world_wins   text default '[]',
  journal_entries   text default '[]',
  relapse_log       text default '[]',
  reflection_responses text default '[]',
  updated_at        timestamptz default now()
);

-- RLS policies
alter table forum_posts    enable row level security;
alter table forum_comments enable row level security;
alter table user_data      enable row level security;

create policy "Public read posts"    on forum_posts    for select using (true);
create policy "Public insert posts"  on forum_posts    for insert with check (true);
create policy "Update own posts"     on forum_posts    for update using (auth.uid() = user_id);
create policy "Delete own posts"     on forum_posts    for delete using (auth.uid() = user_id);
create policy "Public read comments" on forum_comments for select using (true);
create policy "Public insert comments" on forum_comments for insert with check (true);
create policy "Update own comments"  on forum_comments for update using (auth.uid() = user_id);
create policy "Delete own comments"  on forum_comments for delete using (auth.uid() = user_id);
create policy "Own data only select" on user_data for select using (auth.uid() = user_id);
create policy "Own data only upsert" on user_data for insert with check (auth.uid() = user_id);
create policy "Own data only update" on user_data for update using (auth.uid() = user_id);

──────────────────────────────────────────────────────────────────────────────
*/
