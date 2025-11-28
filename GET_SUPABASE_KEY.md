# How to Get Your Supabase API Key

## The Error

```
Database error: Invalid API key
```

This means the Supabase key you're using is incorrect or in the wrong format.

## Supabase Key Format

Supabase keys are **JWT tokens** that start with `eyJ...` (they're long base64-encoded strings).

**Example of a valid key:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXJwcm9qZWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step-by-Step: Get Your Keys

### 1. Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Sign in and select your project

### 2. Navigate to API Settings

1. Click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"** in the settings menu

### 3. Find Your Keys

You'll see two keys:

#### Option A: Anon/Public Key (For RLS Policies)

- **Label**: `anon` `public`
- **Use this if**: You've set up RLS policies (recommended)
- **Format**: Starts with `eyJ...`
- **Where to use**: Set as `SUPABASE_KEY` in your `.env` file

#### Option B: Service Role Key (Bypasses RLS)

- **Label**: `service_role` `secret`
- **Use this if**: You want to bypass RLS (easier, but less secure)
- **Format**: Starts with `eyJ...` (longer than anon key)
- **Where to use**: Set as `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file
- ⚠️ **Keep this secret!** Never expose it in client-side code.

### 4. Copy the Key

1. Click the **copy icon** next to the key you want to use
2. The key should be a long string starting with `eyJ...`

### 5. Update Your `.env` File

Create or update `.env` in your project root:

```bash
# For using anon key with RLS policies:
SUPABASE_URL=https://bfhkzqbztkyojvbhkxzg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmaGt6cWJ6dGt5b2p2YmhreHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4OTI4MDAsImV4cCI6MjA0ODQ2ODgwMH0.your-actual-key-here

# OR for using service_role key (bypasses RLS):
SUPABASE_URL=https://bfhkzqbztkyojvbhkxzg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmaGt6cWJ6dGt5b2p2YmhreHpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjg5MjgwMCwiZXhwIjoyMDQ4NDY4ODAwfQ.your-actual-service-role-key-here
```

**Important:** Replace the example keys above with your actual keys from Supabase!

### 6. Restart Netlify Dev

After updating `.env`:

1. Stop the server (Ctrl+C)
2. Start it again: `npm run dev`

## Quick Test

To verify your key is correct, check:

1. ✅ Key starts with `eyJ...`
2. ✅ Key is very long (hundreds of characters)
3. ✅ You copied the entire key (no truncation)
4. ✅ No extra spaces or quotes around the key in `.env`

## Common Mistakes

❌ **Wrong**: Using a key that starts with `sb_` or other prefixes
✅ **Correct**: Using a key that starts with `eyJ...`

❌ **Wrong**: Using a truncated/incomplete key
✅ **Correct**: Copy the entire key (it's very long)

❌ **Wrong**: Adding quotes around the key in `.env`
✅ **Correct**: No quotes needed: `SUPABASE_KEY=eyJ...`

❌ **Wrong**: Using the wrong project's key
✅ **Correct**: Make sure the key matches your project URL

## Still Having Issues?

1. Double-check you're in the correct Supabase project
2. Verify the project URL matches: `https://bfhkzqbztkyojvbhkxzg.supabase.co`
3. Make sure your `.env` file is in the project root (same folder as `package.json`)
4. Restart `netlify dev` after changing `.env`
5. Check that `.env` is in `.gitignore` (it should be)
