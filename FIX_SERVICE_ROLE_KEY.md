# Fix: Service Role Key Setup

## The Problem

You're still getting the RLS error because:

1. The `SUPABASE_SERVICE_ROLE_KEY` is commented out in your `.env` file
2. The commented value appears to be an anon key, not a service_role key

## How to Tell the Difference

Both keys start with `eyJ...`, but they're different:

- **Anon key**: Has `"role":"anon"` in the JWT payload
- **Service role key**: Has `"role":"service_role"` in the JWT payload (and is usually longer)

## Solution: Get the Real Service Role Key

### Step 1: Get the Service Role Key from Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find the **`service_role`** `secret` key section
5. Click the copy icon to copy the entire key
6. The key should be LONGER than the anon key

### Step 2: Update Your `.env` File

Open your `.env` file and make sure it looks like this:

```bash
SUPABASE_URL=https://bfhkzqbztkyojvbhkxzg.supabase.co

# Comment out or remove the anon key (we'll use service_role instead)
# SUPABASE_KEY=eyJ...your-anon-key...

# Uncomment and add your ACTUAL service_role key here
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-actual-service-role-key-here
```

**Important:**

- Remove the `#` at the beginning of the `SUPABASE_SERVICE_ROLE_KEY` line
- Make sure you're using the **service_role** key, not the anon key
- The service_role key should be different from the anon key

### Step 3: Restart Netlify Dev

After updating `.env`:

1. Stop the server (press `Ctrl+C` in the terminal)
2. Start it again: `npm run dev`

### Step 4: Verify It's Working

The function checks for `SUPABASE_SERVICE_ROLE_KEY` first. If it finds it, it will use that key and bypass RLS. You should no longer get the RLS error.

## Quick Check

To verify you have the right key, you can decode the JWT (just the middle part between the dots):

1. Copy your key
2. Go to https://jwt.io
3. Paste your key
4. Look at the "payload" section
5. Check the `role` field:
   - Should say `"service_role"` (not `"anon"`)

## Still Having Issues?

If you're still getting RLS errors after this:

1. Make sure the `SUPABASE_SERVICE_ROLE_KEY` line is NOT commented (no `#` at the start)
2. Make sure there are no extra spaces around the `=` sign
3. Make sure you copied the ENTIRE key (it's very long)
4. Restart `netlify dev` after making changes
5. Check the terminal output when you start `netlify dev` - it should show environment variables being loaded
