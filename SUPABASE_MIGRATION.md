# Supabase Schema Migration: Cloud Data Synchronization

## Overview

This migration extends the `user_data` table to support:
1. **4 missing data types**: forum_favorites, detox_history, alarms, pomodoro_history
2. **Sync metadata**: Per-datatype last-sync timestamps for incremental sync
3. **Conflict tracking**: Conflict markers for smart merge strategy

## Migration Instructions

### Step 1: Back Up Existing Data

Before running migrations, back up your user_data:

```sql
-- Optional: Create backup table
CREATE TABLE user_data_backup_YYYY_MM_DD AS SELECT * FROM user_data;
```

### Step 2: Add Missing Data Type Columns

Run this SQL in your Supabase project (SQL Editor → New Query):

```sql
-- Add 4 missing data type columns to user_data
ALTER TABLE user_data 
ADD COLUMN IF NOT EXISTS forum_favorites text DEFAULT '[]',
ADD COLUMN IF NOT EXISTS detox_history text DEFAULT '[]',
ADD COLUMN IF NOT EXISTS alarms text DEFAULT '[]',
ADD COLUMN IF NOT EXISTS pomodoro_history text DEFAULT '[]';
```

### Step 3: Add Sync Metadata Columns

```sql
-- Add per-datatype last-sync timestamp columns
ALTER TABLE user_data 
ADD COLUMN IF NOT EXISTS last_sync_time timestamptz,
ADD COLUMN IF NOT EXISTS last_habit_sync timestamptz,
ADD COLUMN IF NOT EXISTS last_stats_sync timestamptz,
ADD COLUMN IF NOT EXISTS last_settings_sync timestamptz,
ADD COLUMN IF NOT EXISTS last_calendar_events_sync timestamptz,
ADD COLUMN IF NOT EXISTS last_real_world_wins_sync timestamptz,
ADD COLUMN IF NOT EXISTS last_journal_entries_sync timestamptz,
ADD COLUMN IF NOT EXISTS last_relapse_log_sync timestamptz,
ADD COLUMN IF NOT EXISTS last_reflection_responses_sync timestamptz,
ADD COLUMN IF NOT EXISTS last_forum_favorites_sync timestamptz,
ADD COLUMN IF NOT EXISTS last_pomodoro_history_sync timestamptz,
ADD COLUMN IF NOT EXISTS last_detox_history_sync timestamptz,
ADD COLUMN IF NOT EXISTS last_alarms_sync timestamptz;
```

### Step 4: Add Conflict Tracking Column

```sql
-- Add conflict markers column for merge conflict tracking
ALTER TABLE user_data 
ADD COLUMN IF NOT EXISTS conflict_markers text DEFAULT '{}';
```

### Step 5: Verify Migration

Run this to verify all columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_data' 
ORDER BY ordinal_position;
```

Expected columns should include:
- user_id (uuid)
- habits, stats, settings, calendar_events, real_world_wins, journal_entries, relapse_log, reflection_responses (text)
- **NEW**: forum_favorites, detox_history, alarms, pomodoro_history (text)
- **NEW**: last_sync_time, last_habit_sync, last_stats_sync, ... (timestamptz)
- **NEW**: conflict_markers (text)
- updated_at (timestamptz)

### Step 6: Update RLS Policies (If Needed)

The existing RLS policies should continue to work:

```sql
-- These policies remain unchanged and should still apply:
-- - "Own data only select" on user_data for select using (auth.uid() = user_id);
-- - "Own data only upsert" on user_data for insert with check (auth.uid() = user_id);
-- - "Own data only update" on user_data for update using (auth.uid() = user_id);

-- Verify policies exist:
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_data';
```

## Rollback Plan

If you need to rollback, run:

```sql
-- Drop new columns (keep them for now, but you can remove if needed)
ALTER TABLE user_data 
DROP COLUMN IF EXISTS forum_favorites,
DROP COLUMN IF EXISTS detox_history,
DROP COLUMN IF EXISTS alarms,
DROP COLUMN IF EXISTS pomodoro_history,
DROP COLUMN IF EXISTS last_sync_time,
DROP COLUMN IF EXISTS last_habit_sync,
DROP COLUMN IF EXISTS last_stats_sync,
DROP COLUMN IF EXISTS last_settings_sync,
DROP COLUMN IF EXISTS last_calendar_events_sync,
DROP COLUMN IF EXISTS last_real_world_wins_sync,
DROP COLUMN IF EXISTS last_journal_entries_sync,
DROP COLUMN IF EXISTS last_relapse_log_sync,
DROP COLUMN IF EXISTS last_reflection_responses_sync,
DROP COLUMN IF EXISTS last_forum_favorites_sync,
DROP COLUMN IF EXISTS last_pomodoro_history_sync,
DROP COLUMN IF EXISTS last_detox_history_sync,
DROP COLUMN IF EXISTS last_alarms_sync,
DROP COLUMN IF EXISTS conflict_markers;
```

## Testing After Migration

After migration, verify the app can:

1. ✓ Sync existing 8 data types (habits, stats, settings, calendar_events, real_world_wins, journal_entries, relapse_log, reflection_responses)
2. ✓ Save new data types (forum_favorites, detox_history, alarms, pomodoro_history)
3. ✓ Track sync timestamps per-datatype
4. ✓ Detect and resolve conflicts during sync

## Performance Notes

- All new columns have default values (no data migration needed)
- Indexes on `user_id` already exist (foreign key)
- Consider adding index on `last_sync_time` if querying by sync freshness: 
  ```sql
  CREATE INDEX IF NOT EXISTS idx_user_data_last_sync ON user_data(last_sync_time);
  ```

## Timeline

- Run migrations during low-traffic period (they're non-blocking)
- All changes are backward compatible
- No data loss risk (adding columns only, not removing)
- RLS policies automatically apply to new columns

## References

- Sync metadata enables: per-datatype incremental sync, offline queue, automatic retries
- Conflict markers enable: smart merge strategy (preserve both local and remote changes by timestamp)
- Large dataset columns (pomodoro_history, detox_history) enable: pagination and efficient sync

---

**Next Steps**: After migration completes, proceed to Phase 2 to refactor AppContext with sync orchestration.
