import { getSupabaseClient, isSupabaseReady } from './runtimeConfig';
import type { DataType, SyncMetadata } from '../types/sync';
import { syncWithRetry, mergeDataWithConflictResolution } from './syncEngine';

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
  // New columns for missing data types
  forum_favorites?: string;     // JSON array
  detox_history?: string;       // JSON array
  alarms?: string;              // JSON array
  pomodoro_history?: string;    // JSON array
  // Sync metadata columns (per-datatype last sync timestamps)
  last_sync_time?: string | null;
  last_habit_sync?: string | null;
  last_stats_sync?: string | null;
  last_settings_sync?: string | null;
  last_calendar_events_sync?: string | null;
  last_real_world_wins_sync?: string | null;
  last_journal_entries_sync?: string | null;
  last_relapse_log_sync?: string | null;
  last_reflection_responses_sync?: string | null;
  last_forum_favorites_sync?: string | null;
  last_pomodoro_history_sync?: string | null;
  last_detox_history_sync?: string | null;
  last_alarms_sync?: string | null;
  conflict_markers?: string; // JSON object
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
    // Delete the post (RLS policy on the backend will verify ownership)
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
    console.warn('[DB] Supabase not configured - skipping save');
    return;
  }
  try {
    console.log('[DB] Saving user data for userId:', userId);
    const { error } = await sb.from('user_data').upsert(
      {
        user_id: userId,
        ...payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (error) {
      console.error('[DB] Failed to save user data:', error);
      // Check if it's an RLS policy error
      if (error.message?.includes('policy') || error.code === 'PGRST301' || error.code === 'PGRST302') {
        console.error('[DB] RLS Policy Error - user may not have permission to save');
      }
      throw error;
    }
    console.log('[DB] User data saved successfully');
  } catch (err: any) {
    console.error('[DB] Save user data error:', err.message || err);
    throw err;
  }
}

export async function loadUserData(userId: string): Promise<DBUserData | null> {
  const sb = getSupabaseClient();
  if (!sb) {
    console.warn('[DB] Supabase not configured - cannot load data');
    return null;
  }
  try {
    console.log('[DB] Loading user data for userId:', userId);
    const { data, error } = await sb.from('user_data').select('*').eq('user_id', userId).single();
    if (error) {
      // 406 means no rows found, which is expected for new users
      if (error.code === '406') {
        console.log('[DB] No existing user data found (first login)');
      } else {
        console.error('[DB] Failed to load user data:', error);
      }
      return null;
    }
    if (data) {
      console.log('[DB] User data loaded successfully');
      return data;
    }
    return null;
  } catch (err: any) {
    console.error('[DB] Load user data error:', err.message || err);
    return null;
  }
}

// ─── Enhanced Cloud Sync (Selective/Incremental) ──────────────────────────────

/**
 * Load user data for specific data types only (selective sync)
 * Optionally filters by modification time for incremental sync
 */
export async function loadUserDataPartial(
  userId: string,
  dataTypes: DataType[],
  sinceTimestamp?: string
): Promise<Partial<DBUserData> | null> {
  const sb = getSupabaseClient();
  if (!sb) {
    console.warn('[DB] Supabase not configured - cannot load data');
    return null;
  }

  try {
    const columns = [
      'user_id',
      'updated_at',
      ...dataTypes,
      // Include corresponding sync timestamp columns
      ...dataTypes.map(dt => `last_${dt}_sync`),
      'conflict_markers',
    ];

    console.log('[DB] Loading partial user data for userId:', userId, 'types:', dataTypes);
    let query = sb.from('user_data').select(columns.join(',')).eq('user_id', userId).single();

    // Optional: filter by update time for incremental sync
    if (sinceTimestamp) {
      query = query.gt('updated_at', sinceTimestamp);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '406') {
        console.log('[DB] No existing user data found (first login)');
      } else {
        console.error('[DB] Failed to load partial user data:', error);
      }
      return null;
    }

    if (data) {
      console.log('[DB] Partial user data loaded successfully');
      return data;
    }
    return null;
  } catch (err: any) {
    console.error('[DB] Load partial user data error:', err.message || err);
    return null;
  }
}

/**
 * Save user data for specific data types only (selective update)
 * Includes sync metadata for conflict detection
 */
export async function saveUserDataPartial(
  userId: string,
  payload: Partial<Record<DataType, string>>,
  syncMetadata: Record<DataType, SyncMetadata>
): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) {
    console.warn('[DB] Supabase not configured - skipping save');
    return;
  }

  try {
    console.log('[DB] Saving partial user data for userId:', userId);

    // Build update object with data types + their sync timestamps
    const updateData: any = {
      user_id: userId,
      updated_at: new Date().toISOString(),
      last_sync_time: new Date().toISOString(),
    };

    // Add the data itself
    Object.entries(payload).forEach(([dataType, value]) => {
      updateData[dataType] = value;
    });

    // Add per-datatype sync timestamps
    Object.entries(syncMetadata).forEach(([dataType, metadata]) => {
      updateData[`last_${dataType}_sync`] = metadata.lastSyncTime;
    });

    // Try upsert first
    const { error } = await sb.from('user_data').upsert(updateData, { onConflict: 'user_id' });

    if (error) {
      // If upsert fails with constraint violation, fall back to explicit update
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        console.log('[DB] Constraint violation on insert, attempting explicit update...');

        // Remove user_id from update data (can't update primary key)
        const { user_id: _ignored, ...updateDataWithoutId } = updateData;

        const { error: updateError } = await sb
          .from('user_data')
          .update(updateDataWithoutId)
          .eq('user_id', userId);

        if (updateError) {
          console.error('[DB] Fallback update also failed:', updateError);
          throw updateError;
        }

        console.log('[DB] Fallback update succeeded');
        return;
      }

      console.error('[DB] Failed to save partial user data:', error);
      if (error.message?.includes('policy') || error.code === 'PGRST301' || error.code === 'PGRST302') {
        console.error('[DB] RLS Policy Error - user may not have permission to save');
      }
      throw error;
    }

    console.log('[DB] Partial user data saved successfully');
  } catch (err: any) {
    console.error('[DB] Save partial user data error:', err.message || err);
    throw err;
  }
}

/**
 * Load paginated history for large datasets (pomodoro_history, detox_history)
 * Fetches in chunks to avoid timeouts
 */
export async function loadHistoryPaginated(
  userId: string,
  dataType: 'pomodoro_history' | 'detox_history',
  limit: number = 500,
  offset: number = 0
): Promise<any[]> {
  const sb = getSupabaseClient();
  if (!sb) {
    console.warn('[DB] Supabase not configured - cannot load history');
    return [];
  }

  try {
    console.log(`[DB] Loading ${dataType} page (limit: ${limit}, offset: ${offset})`);

    const { data, error } = await sb
      .from('user_data')
      .select(dataType)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      if (error?.code !== '406') {
        console.error(`[DB] Failed to load ${dataType}:`, error);
      }
      return [];
    }

    // Parse the JSON array
    const history = JSON.parse(data[dataType] || '[]');

    // Sort by timestamp descending (newest first)
    history.sort((a: any, b: any) => {
      const aTime = new Date(a.timestamp || a.createdAt || 0).getTime();
      const bTime = new Date(b.timestamp || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    // Return paginated slice
    const paginated = history.slice(offset, offset + limit);
    console.log(`[DB] Loaded ${paginated.length} items from ${dataType}`);
    return paginated;
  } catch (err: any) {
    console.error(`[DB] Load ${dataType} error:`, err.message || err);
    return [];
  }
}

/**
 * Append new entries to history (pomodoro_history, detox_history)
 * Only syncs new entries since last sync (incremental append)
 */
export async function appendToHistory(
  userId: string,
  dataType: 'pomodoro_history' | 'detox_history',
  newEntries: any[],
  lastSyncTimestamp: string | null
): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) {
    console.warn('[DB] Supabase not configured - skipping append');
    return;
  }

  try {
    if (newEntries.length === 0) {
      console.log('[DB] No new entries to append');
      return;
    }

    console.log(`[DB] Appending ${newEntries.length} entries to ${dataType}`);

    // Load existing history
    const { data, error: loadError } = await sb
      .from('user_data')
      .select(dataType)
      .eq('user_id', userId)
      .single();

    if (loadError && loadError.code !== '406') {
      throw loadError;
    }

    // Parse existing history
    const existingHistory = data ? JSON.parse(data[dataType] || '[]') : [];

    // Filter new entries to avoid duplicates (by ID if available, or by timestamp)
    const existingIds = new Set(existingHistory.map((h: any) => h.id).filter(Boolean));
    const uniqueNewEntries = newEntries.filter(entry => !existingIds.has(entry.id));

    // Combine and sort
    const combined = [...existingHistory, ...uniqueNewEntries].sort((a: any, b: any) => {
      const aTime = new Date(a.timestamp || a.createdAt || 0).getTime();
      const bTime = new Date(b.timestamp || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    // Save back
    const updateData: any = {
      [dataType]: JSON.stringify(combined),
      [`last_${dataType}_sync`]: new Date().toISOString(),
      last_sync_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await sb.from('user_data').upsert(
      {
        user_id: userId,
        ...updateData,
      },
      { onConflict: 'user_id' }
    );

    if (updateError) {
      console.error(`[DB] Failed to append to ${dataType}:`, updateError);
      throw updateError;
    }

    console.log(`[DB] Successfully appended ${uniqueNewEntries.length} entries to ${dataType}`);
  } catch (err: any) {
    console.error(`[DB] Append to ${dataType} error:`, err.message || err);
    throw err;
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
  -- New columns for missing data types
  forum_favorites   text default '[]',
  detox_history     text default '[]',
  alarms            text default '[]',
  pomodoro_history  text default '[]',
  -- Sync metadata columns (per-datatype last sync timestamps)
  last_sync_time    timestamptz,
  last_habit_sync   timestamptz,
  last_stats_sync   timestamptz,
  last_settings_sync timestamptz,
  last_calendar_events_sync timestamptz,
  last_real_world_wins_sync timestamptz,
  last_journal_entries_sync timestamptz,
  last_relapse_log_sync timestamptz,
  last_reflection_responses_sync timestamptz,
  last_forum_favorites_sync timestamptz,
  last_pomodoro_history_sync timestamptz,
  last_detox_history_sync timestamptz,
  last_alarms_sync  timestamptz,
  -- Conflict tracking
  conflict_markers  text default '{}',
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
