#!/usr/bin/env node

/**
 * Supabase Backup Script
 * 
 * This script creates a backup of all Supabase tables:
 * - persons
 * - attendance
 * - attendance_persons
 * 
 * Usage:
 *   node backup-supabase.js
 * 
 * Or with npm script:
 *   npm run backup
 * 
 * Requirements:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY environment variable
 *   - Can also use .env file (requires dotenv package)
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
    console.log('📄 Loaded .env file');
  } catch (e) {
    console.warn('⚠️  Warning: .env file exists but could not be loaded:', e.message);
    console.warn('   Trying to continue with environment variables...');
  }
} else {
  // Try to load dotenv anyway (might work if installed)
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available, that's okay - use environment variables directly
  }
}

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found!');
  console.error('');
  
  if (envExists) {
    console.error('⚠️  .env file exists but credentials were not loaded.');
    console.error('   Please check that your .env file contains:');
    console.error('     SUPABASE_URL=https://your-project.supabase.co');
    console.error('     SUPABASE_SERVICE_ROLE_KEY=eyJ...');
    console.error('');
    console.error('   Make sure there are no spaces around the = sign.');
    console.error('   Make sure the values are not quoted (unless needed).');
  } else {
    console.error('Please set the following environment variables:');
    console.error('  - SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)');
    console.error('');
    console.error('You can either:');
    console.error('  1. Set them in your shell:');
    console.error('     export SUPABASE_URL="https://your-project.supabase.co"');
    console.error('     export SUPABASE_SERVICE_ROLE_KEY="eyJ..."');
    console.error('');
    console.error('  2. Create a .env file in the project root:');
    console.error('     SUPABASE_URL=https://your-project.supabase.co');
    console.error('     SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  }
  process.exit(1);
}

if (!supabaseKey.startsWith('eyJ')) {
  console.error('❌ Error: Invalid Supabase key format.');
  console.error('Supabase keys should start with "eyJ..."');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Create backups directory
const backupsDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Generate timestamp for backup filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
const backupDir = path.join(backupsDir, `backup_${timestamp}`);

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

console.log('🔄 Starting Supabase backup...');
console.log(`📁 Backup directory: ${backupDir}`);
console.log('');

// Function to backup a table
async function backupTable(tableName) {
  try {
    console.log(`📊 Backing up table: ${tableName}...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      throw error;
    }
    
    const backupFile = path.join(backupDir, `${tableName}.json`);
    const backupData = {
      table: tableName,
      backup_date: new Date().toISOString(),
      record_count: data ? data.length : 0,
      data: data || []
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
    
    console.log(`   ✅ ${tableName}: ${data ? data.length : 0} records saved`);
    return { success: true, count: data ? data.length : 0 };
  } catch (error) {
    console.error(`   ❌ Error backing up ${tableName}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main backup function
async function runBackup() {
  const tables = ['persons', 'attendance', 'attendance_persons'];
  const results = {};
  
  for (const table of tables) {
    results[table] = await backupTable(table);
  }
  
  // Create a summary file
  const summary = {
    backup_date: new Date().toISOString(),
    supabase_url: supabaseUrl,
    tables: results,
    total_records: Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0)
  };
  
  const summaryFile = path.join(backupDir, 'backup_summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf8');
  
  console.log('');
  console.log('📋 Backup Summary:');
  console.log(`   Total records: ${summary.total_records}`);
  console.log(`   Backup location: ${backupDir}`);
  console.log('');
  
  // Check for errors
  const hasErrors = Object.values(results).some(r => !r.success);
  if (hasErrors) {
    console.log('⚠️  Some tables had errors during backup. Please check the output above.');
    process.exit(1);
  } else {
    console.log('✅ Backup completed successfully!');
    console.log('');
    console.log('💡 To restore this backup, you can use the restore script or manually import the JSON files.');
  }
}

// Run the backup
runBackup().catch(error => {
  console.error('❌ Fatal error during backup:', error);
  process.exit(1);
});

