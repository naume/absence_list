# Supabase Database Setup (Free & Easy)

Supabase is a free PostgreSQL database that works great with Netlify. Here's how to set it up:

## Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (easiest)
4. Click "New Project"
5. Fill in:
   - **Name**: "Attendance Tracker" (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
6. Click "Create new project"
7. Wait 2-3 minutes for setup

## Step 2: Create the Database Table

1. In Supabase dashboard, go to **"Table Editor"** (left sidebar)
2. Click **"New Table"**
3. Name it: `attendance`
4. Add these columns:

| Column Name   | Type      | Default | Nullable                  |
| ------------- | --------- | ------- | ------------------------- |
| id            | int8      | auto    | No (Primary Key)          |
| date          | date      | -       | No                        |
| activity_type | text      | -       | No                        |
| present_kids  | text      | -       | No (comma-separated list) |
| total_kids    | int4      | 0       | No                        |
| absent_kids   | int4      | 0       | No                        |
| created_at    | timestamp | now()   | No                        |

5. Click "Save"

## Step 2.5: Configure Row-Level Security (RLS) Policies

**IMPORTANT:** Supabase enables Row-Level Security by default. You need to create a policy to allow inserts.

1. In Supabase dashboard, go to **"Table Editor"** (left sidebar)
2. Click on the `attendance` table
3. Click on the **"Policies"** tab (or go to **"Authentication"** → **"Policies"**)
4. Click **"New Policy"**
5. Choose **"Create a policy from scratch"**
6. Configure the policy:
   - **Policy name**: `Allow public inserts` (or any name)
   - **Allowed operation**: `INSERT`
   - **Target roles**: `anon` (or `public`)
   - **USING expression**: Leave empty or use `true`
   - **WITH CHECK expression**: Leave empty or use `true`
7. Click **"Review"** then **"Save policy"**

**Alternative (Less Secure):** If you want to disable RLS entirely (not recommended for production):

1. Go to **"Table Editor"** → `attendance` table
2. Click the **"..."** menu → **"Disable RLS"**
3. ⚠️ **Warning:** This allows anyone to insert/read/update/delete data

## Step 3: Get API Credentials

1. Go to **"Settings"** → **"API"**
2. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` key, not the `service_role` key)

## Step 3: Update Netlify Function

1. Install Supabase client:

   ```bash
   npm install @supabase/supabase-js
   ```

2. Update `netlify/functions/save-attendance.js` to use Supabase (see example below)

## Step 4: Add Environment Variables to Netlify

1. Go to your Netlify site dashboard
2. Go to **Site settings** → **Environment variables**
3. Add:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_KEY` = your anon/public key

## Step 5: Update index.html

Change the `APPS_SCRIPT_URL` to point to your Netlify function:

```javascript
APPS_SCRIPT_URL: "/.netlify/functions/save-attendance";
```

Or if deployed:

```javascript
APPS_SCRIPT_URL: "https://your-site.netlify.app/.netlify/functions/save-attendance";
```

## Alternative: Firebase Firestore (Also Free)

If you prefer Firebase:

1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable Firestore Database
4. Get your config
5. Use Firebase SDK in Netlify Function

## Alternative: Airtable (Also Free)

1. Go to https://airtable.com
2. Create a base
3. Create a table with columns: Date, Activity Type, Present Kids, Total Kids, Absent Kids
4. Get API key
5. Use Airtable API in Netlify Function
