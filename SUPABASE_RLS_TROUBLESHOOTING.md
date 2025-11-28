# Troubleshooting RLS Policy Issues

If you're still getting RLS errors after creating a policy, try these steps:

## Step 1: Verify the Policy Exists

1. Go to Supabase dashboard → **Table Editor** → `attendance` table
2. Click the **"Policies"** tab
3. You should see your policy listed. If not, create it again.

## Step 2: Check Policy Configuration

Make sure your policy has:

- **Operation**: `INSERT` (not SELECT, UPDATE, or DELETE)
- **Target roles**: `anon` (or `public`)
- **WITH CHECK**: `true` (or empty, which defaults to true)

## Step 3: Try Using SQL Editor

Sometimes the dashboard UI doesn't work correctly. Try using SQL:

1. Go to **SQL Editor** in Supabase
2. Run this to check existing policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'attendance';
```

3. If no policy exists, create it:

```sql
-- Drop existing policy if it exists (optional)
DROP POLICY IF EXISTS "Allow public inserts" ON attendance;

-- Create the policy
CREATE POLICY "Allow public inserts" ON attendance
FOR INSERT
TO anon
WITH CHECK (true);
```

4. Verify it was created:

```sql
SELECT * FROM pg_policies WHERE tablename = 'attendance';
```

## Step 4: Check Which Key You're Using

The key format matters:

- **Anon key**: Usually starts with `eyJ...` (it's a JWT token)
- **Service role key**: Also starts with `eyJ...` but is longer

To check which key you have:

1. Go to **Settings** → **API**
2. Look at the keys:
   - `anon` `public` key - Use this with RLS policies
   - `service_role` `secret` key - Bypasses RLS (keep secret!)

## Step 5: Use Service Role Key (Quick Fix)

If RLS is still causing issues, use the service role key:

1. Go to **Settings** → **API**
2. Copy the **`service_role`** key (the secret one)
3. Update your `.env` file:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

4. Restart `netlify dev`

The service role key bypasses RLS, so you won't need any policies.

⚠️ **Security Warning:** Never commit the service role key to git or expose it in client-side code!

## Step 6: Disable RLS (Last Resort)

If nothing else works, you can disable RLS entirely:

1. Go to **Table Editor** → `attendance` table
2. Click **"..."** menu → **"Disable RLS"**
3. Confirm

⚠️ **Warning:** This removes all security. Anyone with your anon key can insert/read/update/delete data.

## Still Not Working?

If you've tried all of the above:

1. Check the exact error message in the browser console
2. Check Netlify Function logs (if deployed) or terminal output (if using `netlify dev`)
3. Verify your Supabase project is active and not paused
4. Make sure you're using the correct project URL and key
