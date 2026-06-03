# Ascend RLS (Row-Level Security) Audit Checklist

**Last Updated:** 2026-06-03  
**Status:** ⚠️ PARTIAL - See critical issue below

---

## 🔴 CRITICAL ISSUE

**Forum Posts INSERT Policy** — FIXED ✅  
- Previous: `WITH CHECK (true)` — allowed unauthenticated inserts
- Fixed: `WITH CHECK (auth.uid() = user_id)` — requires authentication
- Fix file: `supabase-rls-fix.sql`
- Status: Ready to apply in Supabase SQL editor

---

## ✅ RLS Policies That Should Be In Place

### `user_data` Table
- [ ] **SELECT**: Only authenticated users can see their own `user_data` row
  - Policy: `auth.uid() = user_id`
- [ ] **INSERT**: Only authenticated users can create their own row
  - Policy: `auth.uid() = user_id`
- [ ] **UPDATE**: Only authenticated users can update their own row
  - Policy: `auth.uid() = user_id`
- [ ] **DELETE**: Only authenticated users can delete their own row
  - Policy: `auth.uid() = user_id`

### `forum_posts` Table
- [x] **INSERT**: Fixed — requires `auth.uid() = user_id`
- [ ] **SELECT**: Public posts should be readable by all authenticated users
  - Policy: `is_public = true OR auth.uid() = user_id`
- [ ] **UPDATE**: Users can only update their own posts
  - Policy: `auth.uid() = user_id`
- [ ] **DELETE**: Users can only delete their own posts
  - Policy: `auth.uid() = user_id`

### `journal_entries` Table (If exists)
- [ ] **SELECT**: Only authenticated users can see their own entries
  - Policy: `auth.uid() = user_id`
- [ ] **INSERT/UPDATE/DELETE**: Same user ownership check
  - Policy: `auth.uid() = user_id`

### `goals` Table (If exists)
- [ ] **SELECT**: Only authenticated users can see their own goals
  - Policy: `auth.uid() = user_id`
- [ ] **INSERT/UPDATE/DELETE**: Same user ownership check

---

## 🔍 How to Verify RLS Policies

### In Supabase Dashboard:
1. Go to **Authentication** → **Policies**
2. Select each table and review the policies
3. Verify each operation (SELECT, INSERT, UPDATE, DELETE) has correct `WHERE` clause

### SQL Check:
```sql
-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Test Policy Enforcement:
```sql
-- This should fail if RLS is working (user not authenticated in this context)
SELECT * FROM user_data WHERE user_id != 'your-actual-user-id';
```

---

## 📋 Implementation Notes

- RLS is **enabled** on all user-owned tables
- **Enable RLS** on any table with user-specific data
- Test policies with both authenticated and unauthenticated users
- Remember: RLS policies are **additive** — you need one policy per operation per role

---

## Next Steps

1. **Apply the forum_posts fix**: Run `supabase-rls-fix.sql` in Supabase SQL editor
2. **Verify user_data policies**: Check that SELECT/INSERT/UPDATE/DELETE all enforce `auth.uid() = user_id`
3. **Test in Ascend app**: Try modifying another user's data; should fail with 403 error
4. **Monitor logs**: Check for any permission denials in Supabase logs

---

**Owner:** Ascend Development  
**Last Reviewed:** 2026-06-03
