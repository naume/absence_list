# Supabase New Schema Setup Guide

This guide explains how to set up the new database schema with proper foreign key relationships.

## Database Schema Overview

The new schema consists of three tables:

1. **`persons`** - Stores person information
2. **`attendance`** - Stores attendance records (date, activity type, totals)
3. **`attendance_persons`** - Junction table linking attendance to persons (many-to-many)

**Note:** All ID columns use `BIGINT` (int8) to match your existing `attendance` table schema. This ensures compatibility with your current data.

## Foreign Key Relationships

```
attendance_persons
├── attendance_id → attendance.id (Foreign Key with CASCADE DELETE)
└── person_id → persons.id (Foreign Key with CASCADE DELETE)
```

### What This Means:

- **`attendance_persons.attendance_id`** references `attendance.id`
  - When an attendance record is deleted, all related `attendance_persons` records are automatically deleted (CASCADE)
- **`attendance_persons.person_id`** references `persons.id`

  - When a person is deleted, all related `attendance_persons` records are automatically deleted (CASCADE)

- **UNIQUE constraint** on `(attendance_id, person_id)` ensures a person can only be marked present once per attendance record

## Step-by-Step Setup

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"**
5. Copy and paste the entire contents of `supabase_migration.sql`
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. Verify the tables were created by going to **"Table Editor"**

### Option 2: Using Supabase Dashboard (Manual)

#### Create `persons` Table

1. Go to **"Table Editor"** → **"New Table"**
2. Name: `persons`
3. Add columns:
   - `id` - Type: `int8` (bigint) - Primary Key - Auto-increment (Identity)
   - `pass_number` - Type: `text` - Unique - Not Null
   - `first_name` - Type: `text` - Not Null
   - `last_name` - Type: `text` - Not Null
   - `team` - Type: `text` - Nullable
   - `birth_date` - Type: `date` - Nullable
   - `created_at` - Type: `timestamptz` - Default: `now()`
   - `updated_at` - Type: `timestamptz` - Default: `now()`
4. Click **"Save"**

#### Create/Update `attendance` Table

**Note:** If you already have an `attendance` table, the migration script will add missing columns. If creating new:

1. Go to **"Table Editor"** → **"New Table"**
2. Name: `attendance`
3. Add columns:
   - `id` - Type: `int8` (bigint) - Primary Key - Auto-increment (Identity)
   - `date` - Type: `date` - Not Null
   - `activity_type` - Type: `text` - Not Null
   - `total_persons` - Type: `int4` - Not Null - Default: `0`
   - `absent` - Type: `int4` - Not Null - Default: `0`
   - `created_at` - Type: `timestamptz` - Default: `now()`
   - `updated_at` - Type: `timestamptz` - Default: `now()`
4. Add Unique Constraint:
   - Click **"Add constraint"** → **"Unique"**
   - Columns: `date`, `activity_type`
5. Click **"Save"**

#### Create `attendance_persons` Junction Table

1. Go to **"Table Editor"** → **"New Table"**
2. Name: `attendance_persons`
3. Add columns:
   - `id` - Type: `int8` (bigint) - Primary Key - Auto-increment (Identity)
   - `attendance_id` - Type: `int8` (bigint) - Not Null
   - `person_id` - Type: `int8` (bigint) - Not Null
   - `created_at` - Type: `timestamptz` - Default: `now()`
4. Add Foreign Keys:
   - Click **"Add foreign key"**
   - **From**: `attendance_id` → **To**: `attendance.id`
   - **On delete**: `CASCADE`
   - Click **"Add foreign key"** again
   - **From**: `person_id` → **To**: `persons.id`
   - **On delete**: `CASCADE`
5. Add Unique Constraint:
   - Click **"Add constraint"** → **"Unique"**
   - Columns: `attendance_id`, `person_id`
6. Click **"Save"**

## Setting Up Row Level Security (RLS) Policies

After creating the tables, you need to set up RLS policies. The SQL script includes these, but if you created tables manually:

1. Go to **"Table Editor"** → Select each table
2. Click the **"..."** menu → **"Enable RLS"**
3. Go to the **"Policies"** tab
4. For each table, create policies for:
   - **SELECT** (read) - Allow `anon` role
   - **INSERT** (create) - Allow `anon` role
   - **UPDATE** (modify) - Allow `anon` role
   - **DELETE** (remove) - Allow `anon` role (only for `attendance_persons`)

## Verifying Foreign Keys

To verify the foreign keys are set up correctly:

1. Go to **"Table Editor"** → `attendance_persons` table
2. Click on the **"Foreign keys"** tab
3. You should see:
   - `attendance_id` → `attendance.id` (CASCADE)
   - `person_id` → `persons.id` (CASCADE)

## Testing the Schema

Run this query in SQL Editor to test:

```sql
-- Insert a test person
INSERT INTO persons (pass_number, first_name, last_name, team, birth_date)
VALUES ('TEST001', 'John', 'Doe', 'Junior-A', '2010-01-01')
RETURNING *;

-- Insert a test attendance record
INSERT INTO attendance (date, activity_type, total_persons, absent)
VALUES ('2025-01-15', 'Training', 10, 2)
RETURNING *;

-- Link the person to the attendance (mark as present)
INSERT INTO attendance_persons (attendance_id, person_id)
SELECT
    (SELECT id FROM attendance WHERE date = '2025-01-15' LIMIT 1),
    (SELECT id FROM persons WHERE pass_number = 'TEST001')
RETURNING *;

-- Query the view to see the relationship
SELECT * FROM attendance_with_persons WHERE date = '2025-01-15';
```

**Note:** The migration script will automatically detect if you already have an `attendance` table and will:

- Keep your existing table structure
- Add any missing columns (`total_persons`, `absent`, `updated_at`)
- Add the unique constraint on `(date, activity_type)` if it doesn't exist

## Migration from Old Schema

If you have existing data in the old `attendance` table:

1. First, create the new tables using the migration script
2. Extract unique person names from `present_kids` column
3. Insert them into the `persons` table
4. Create new attendance records and link them via `attendance_persons`

A migration script for this will be provided separately if needed.

## Next Steps

After setting up the schema:

1. Update the Netlify functions to use the new schema
2. Update the frontend to work with person IDs instead of names
3. Create a function to sync persons from Google Sheets
