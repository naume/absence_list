# Fix: Row-Level Security Policy Error

## The Error

```
Database error: new row violates row-level security policy for table "attendance"
```

This happens because Supabase enables Row-Level Security (RLS) by default, but you haven't created a policy that allows inserts.

## Quick Fix: Create an Insert Policy

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **"Table Editor"** (left sidebar)
4. Click on the `attendance` table
5. Click on the **"Policies"** tab at the top
6. Click **"New Policy"**
7. Choose **"Create a policy from scratch"**
8. Fill in:
   - **Policy name**: `Allow public inserts`
   - **Allowed operation**: Select `INSERT`
   - **Target roles**: Type `anon` and press Enter
   - **USING expression**: Leave empty (or type `true`)
   - **WITH CHECK expression**: Leave empty (or type `true`)
9. Click **"Review"** then **"Save policy"**

### Option 2: Using SQL Editor (Advanced)

1. Go to **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Paste this SQL:

```sql
-- Allow anonymous users to insert attendance records
CREATE POLICY "Allow public inserts" ON attendance
FOR INSERT
TO anon
WITH CHECK (true);
```

4. Click **"Run"** (or press Cmd/Ctrl + Enter)

### Option 3: Disable RLS (Not Recommended)

⚠️ **Only use this for testing!** This removes all security.

1. Go to **"Table Editor"** → `attendance` table
2. Click the **"..."** menu (three dots) in the top right
3. Click **"Disable RLS"**
4. Confirm

## Verify It Works

After creating the policy, try saving attendance again. The error should be gone!

## Additional Policies (Optional)

If you want to also allow reading the data (for viewing past attendance):

```sql
-- Allow anonymous users to read attendance records
CREATE POLICY "Allow public reads" ON attendance
FOR SELECT
TO anon
USING (true);
```

Or create it in the dashboard:

- **Policy name**: `Allow public reads`
- **Allowed operation**: `SELECT`
- **Target roles**: `anon`
- **USING expression**: `true`

## Alternative Solution: Use Service Role Key (Bypasses RLS)

If you're still having issues with RLS policies, you can use the `service_role` key instead. This key bypasses RLS entirely, so it's more powerful but should be kept secret.

⚠️ **Important:** The `service_role` key should NEVER be exposed in client-side code. Only use it in server-side functions (like Netlify Functions).

### Steps:

1. Go to **"Settings"** → **"API"** in Supabase dashboard
2. Copy the **`service_role` key** (NOT the `anon` key)
3. Update your `.env` file or Netlify environment variables:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
4. The function will automatically use `SUPABASE_SERVICE_ROLE_KEY` if available, otherwise it falls back to `SUPABASE_KEY`

**Note:** The function code has been updated to support both keys. If `SUPABASE_SERVICE_ROLE_KEY` is set, it will use that (bypasses RLS). Otherwise, it uses `SUPABASE_KEY` (requires RLS policies).

## Security Note

- The `anon` key is safe to use in client-side code because RLS policies control what operations are allowed.
- The `service_role` key bypasses all RLS policies and should ONLY be used in server-side code (like Netlify Functions). Never expose it in client-side JavaScript.
