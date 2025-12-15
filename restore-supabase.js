#!/usr/bin/env node

/**
 * Supabase Restore Script
 * 
 * This script restores data from a backup created by backup-supabase.js
 * 
 * Usage:
 *   node restore-supabase.js <backup-directory>
 * 
 * Example:
 *   node restore-supabase.js backups/backup_2024-01-15_14-30-00
 * 
 * Or with npm script:
 *   npm run restore -- backups/backup_2024-01-15_14-30-00
 * 
 * Requirements:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY environment variable
 *   - Backup directory with JSON files
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load .env file if dotenv is available
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  try {
    require('dotenv').config({ path: envPath });
  } catch (e) {
    console.warn('⚠️  Warning: .env file exists but could not be loaded:', e.message);
  }
} else {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available, that's okay
  }
}

// Get backup directory from command line argument
const backupDir = process.argv[2];

if (!backupDir) {
  console.error('❌ Error: Backup directory not specified!');
  console.error('');
  console.error('Usage:');
  console.error('  node restore-supabase.js <backup-directory>');
  console.error('');
  console.error('Example:');
  console.error('  node restore-supabase.js backups/backup_2024-01-15_14-30-00');
  console.error('');
  console.error('Available backups:');
  const backupsDir = path.join(__dirname, 'backups');
  if (fs.existsSync(backupsDir)) {
    const backups = fs.readdirSync(backupsDir)
      .filter(f => fs.statSync(path.join(backupsDir, f)).isDirectory())
      .sort()
      .reverse();
    if (backups.length > 0) {
      backups.forEach(b => console.error(`  - ${b}`));
    } else {
      console.error('  (no backups found)');
    }
  } else {
    console.error('  (backups directory does not exist)');
  }
  process.exit(1);
}

const fullBackupPath = path.isAbsolute(backupDir) ? backupDir : path.join(__dirname, backupDir);

if (!fs.existsSync(fullBackupPath)) {
  console.error(`❌ Error: Backup directory not found: ${fullBackupPath}`);
  process.exit(1);
}

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found!');
  console.error('');
  console.error('Please set the following environment variables:');
  console.error('  - SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)');
  process.exit(1);
}

if (!supabaseKey.startsWith('eyJ')) {
  console.error('❌ Error: Invalid Supabase key format.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read backup summary
const summaryFile = path.join(fullBackupPath, 'backup_summary.json');
let summary = null;
if (fs.existsSync(summaryFile)) {
  summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
  console.log('📋 Backup Information:');
  console.log(`   Date: ${summary.backup_date}`);
  console.log(`   Total records: ${summary.total_records}`);
  console.log('');
}

// Function to restore a table
async function restoreTable(tableName) {
  const backupFile = path.join(fullBackupPath, `${tableName}.json`);
  
  if (!fs.existsSync(backupFile)) {
    console.log(`⚠️  Skipping ${tableName}: backup file not found`);
    return { success: true, skipped: true };
  }
  
  try {
    console.log(`📊 Restoring table: ${tableName}...`);
    
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const records = backupData.data || [];
    
    if (records.length === 0) {
      console.log(`   ℹ️  ${tableName}: No records to restore`);
      return { success: true, count: 0 };
    }
    
    // For restore, we need to handle tables differently:
    // 1. persons - upsert by pass_number
    // 2. attendance - upsert by (date, activity_type)
    // 3. attendance_persons - delete all first, then insert
    
    if (tableName === 'persons') {
      // Upsert persons by pass_number
      const { data, error } = await supabase
        .from('persons')
        .upsert(records, { onConflict: 'pass_number' });
      
      if (error) throw error;
      console.log(`   ✅ ${tableName}: ${records.length} records restored`);
    } else if (tableName === 'attendance') {
      // For attendance, we need to handle the unique constraint on (date, activity_type)
      // Delete existing records first, then insert
      const dates = [...new Set(records.map(r => r.date))];
      const activityTypes = [...new Set(records.map(r => r.activity_type))];
      
      // Delete existing records that match
      for (const date of dates) {
        for (const activityType of activityTypes) {
          await supabase
            .from('attendance')
            .delete()
            .eq('date', date)
            .eq('activity_type', activityType);
        }
      }
      
      // Insert all records
      const { data, error } = await supabase
        .from('attendance')
        .insert(records);
      
      if (error) throw error;
      console.log(`   ✅ ${tableName}: ${records.length} records restored`);
    } else if (tableName === 'attendance_persons') {
      // For attendance_persons, we need to restore after attendance and persons are restored
      // Delete all existing links first
      const { error: deleteError } = await supabase
        .from('attendance_persons')
        .delete()
        .neq('id', 0); // Delete all (hack to delete all records)
      
      if (deleteError && !deleteError.message.includes('0 rows')) {
        throw deleteError;
      }
      
      // Insert all links
      const { data, error } = await supabase
        .from('attendance_persons')
        .insert(records);
      
      if (error) throw error;
      console.log(`   ✅ ${tableName}: ${records.length} records restored`);
    } else {
      console.log(`   ⚠️  Unknown table: ${tableName}`);
      return { success: false };
    }
    
    return { success: true, count: records.length };
  } catch (error) {
    console.error(`   ❌ Error restoring ${tableName}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main restore function
async function runRestore() {
  console.log('🔄 Starting Supabase restore...');
  console.log(`📁 Backup directory: ${fullBackupPath}`);
  console.log('');
  
  // Restore in order: persons, attendance, attendance_persons
  const tables = ['persons', 'attendance', 'attendance_persons'];
  const results = {};
  
  for (const table of tables) {
    results[table] = await restoreTable(table);
  }
  
  console.log('');
  console.log('📋 Restore Summary:');
  const totalRestored = Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0);
  console.log(`   Total records restored: ${totalRestored}`);
  console.log('');
  
  // Check for errors
  const hasErrors = Object.values(results).some(r => !r.success && !r.skipped);
  if (hasErrors) {
    console.log('⚠️  Some tables had errors during restore. Please check the output above.');
    process.exit(1);
  } else {
    console.log('✅ Restore completed successfully!');
  }
}

// Run the restore
runRestore().catch(error => {
  console.error('❌ Fatal error during restore:', error);
  process.exit(1);
});

