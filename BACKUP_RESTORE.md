# Supabase Backup & Restore Guide

This guide explains how to backup and restore your Supabase database tables.

## Tables Backed Up

The backup scripts save the following tables:

- `persons` - All person records
- `attendance` - All attendance records
- `attendance_persons` - Links between attendance and persons

## Prerequisites

### For Node.js Scripts (Recommended)

- Node.js installed
- `@supabase/supabase-js` package (already in package.json)

### For Bash Script

- `curl` (usually pre-installed)
- `jq` (install with: `brew install jq` on macOS, or `apt-get install jq` on Linux)

## Setup

### 1. Get Your Supabase Credentials

You need:

- `SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (starts with `eyJ...`)

Get them from: Supabase Dashboard → Settings → API

### 2. Set Environment Variables

**Option A: Create a `.env` file** (recommended for local use)

Create a `.env` file in the project root:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Option B: Export in your shell**

```bash
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Option C: Install dotenv** (if you want automatic .env loading)

```bash
npm install dotenv
```

## Backup

### Using Node.js Script (Recommended)

```bash
# Using npm script
npm run backup

# Or directly
node backup-supabase.js
```

### Using Bash Script

```bash
./backup-supabase.sh
```

### What Gets Created

Backups are saved in the `backups/` directory with timestamps:

```
backups/
  └── backup_2024-01-15_14-30-00/
      ├── persons.json
      ├── attendance.json
      ├── attendance_persons.json
      └── backup_summary.json
```

Each JSON file contains:

- `table` - Table name
- `backup_date` - When the backup was created
- `record_count` - Number of records
- `data` - Array of all records

## Restore

### Using Node.js Script

```bash
# List available backups first
ls backups/

# Restore from a specific backup
npm run restore -- backups/backup_2024-01-15_14-30-00

# Or directly
node restore-supabase.js backups/backup_2024-01-15_14-30-00
```

### Restore Process

The restore script:

1. Restores `persons` first (upserts by `pass_number`)
2. Restores `attendance` (deletes existing matching records, then inserts)
3. Restores `attendance_persons` (deletes all links, then inserts)

**⚠️ Warning:** Restoring will overwrite existing data! Make sure you have a backup before restoring.

## Manual Backup/Restore

You can also manually work with the JSON files:

### Manual Backup

1. Run the backup script
2. Copy the `backups/backup_XXXXX/` directory to a safe location
3. Keep multiple backups for different dates

### Manual Restore

1. Copy a backup directory back to `backups/`
2. Use the restore script, or
3. Manually import JSON files through Supabase dashboard or SQL

## Best Practices

1. **Regular Backups**: Run backups regularly (daily/weekly)
2. **Multiple Backups**: Keep multiple backup versions
3. **Off-site Storage**: Copy backups to cloud storage or external drive
4. **Test Restores**: Periodically test that your backups can be restored
5. **Before Major Changes**: Always backup before making schema changes

## Troubleshooting

### "Supabase credentials not found"

Make sure you've set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables or created a `.env` file.

### "Invalid Supabase key format"

Your key should start with `eyJ...`. Make sure you're using the **service role key**, not the anon key.

### "Permission denied" (bash script)

Make the script executable:

```bash
chmod +x backup-supabase.sh
```

### "jq: command not found" (bash script)

Install jq:

- macOS: `brew install jq`
- Linux: `apt-get install jq` or `yum install jq`
- Or use the Node.js script instead

### Backup fails with "Row Level Security" error

Make sure you're using the **service role key** (not the anon key). The service role key bypasses RLS policies.

## Example Workflow

```bash
# 1. Set up credentials (one time)
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# 2. Create a backup
npm run backup

# 3. Check the backup
ls -lh backups/

# 4. Later, if needed, restore
npm run restore -- backups/backup_2024-01-15_14-30-00
```

## Automation

You can automate backups using cron (Linux/macOS) or Task Scheduler (Windows):

### Cron Example (daily backup at 2 AM)

```bash
# Edit crontab
crontab -e

# Add this line (adjust path as needed)
0 2 * * * cd /path/to/absence_list && npm run backup
```

### GitHub Actions Example

You can also set up automated backups using GitHub Actions (see GitHub Actions documentation).
