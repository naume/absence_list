#!/bin/bash

# Supabase Backup Script (Bash version)
# 
# This script creates a backup of all Supabase tables using curl and the Supabase REST API
# 
# Usage:
#   ./backup-supabase.sh
# 
# Requirements:
#   - SUPABASE_URL environment variable
#   - SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY environment variable
#   - curl and jq (install with: brew install jq on macOS, or apt-get install jq on Linux)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for required commands
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ Error: curl is not installed${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ Error: jq is not installed${NC}"
    echo -e "${YELLOW}Install with: brew install jq (macOS) or apt-get install jq (Linux)${NC}"
    exit 1
fi

# Load .env file if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Get Supabase credentials
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_KEY}}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo -e "${RED}❌ Error: Supabase credentials not found!${NC}"
    echo ""
    echo "Please set the following environment variables:"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)"
    exit 1
fi

# Create backups directory
BACKUPS_DIR="backups"
mkdir -p "$BACKUPS_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="$BACKUPS_DIR/backup_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}🔄 Starting Supabase backup...${NC}"
echo -e "${BLUE}📁 Backup directory: $BACKUP_DIR${NC}"
echo ""

# Function to backup a table
backup_table() {
    local table_name=$1
    echo -e "${BLUE}📊 Backing up table: $table_name...${NC}"
    
    # Use Supabase REST API to fetch all records
    # Note: This uses the PostgREST API which Supabase provides
    local response=$(curl -s -X GET \
        "$SUPABASE_URL/rest/v1/$table_name?select=*" \
        -H "apikey: $SUPABASE_KEY" \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation")
    
    # Check if request was successful
    if echo "$response" | jq empty 2>/dev/null; then
        # Count records
        local count=$(echo "$response" | jq '. | length')
        
        # Create backup JSON
        local backup_data=$(jq -n \
            --arg table "$table_name" \
            --arg date "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
            --argjson count "$count" \
            --argjson data "$response" \
            '{table: $table, backup_date: $date, record_count: $count, data: $data}')
        
        # Save to file
        echo "$backup_data" | jq '.' > "$BACKUP_DIR/$table_name.json"
        
        echo -e "${GREEN}   ✅ $table_name: $count records saved${NC}"
        echo "$count"
    else
        echo -e "${RED}   ❌ Error backing up $table_name${NC}"
        echo "0"
        return 1
    fi
}

# Backup all tables
TABLES=("persons" "attendance" "attendance_persons")
TOTAL_RECORDS=0

for table in "${TABLES[@]}"; do
    count=$(backup_table "$table")
    TOTAL_RECORDS=$((TOTAL_RECORDS + count))
done

# Create summary
SUMMARY=$(jq -n \
    --arg date "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg url "$SUPABASE_URL" \
    --argjson total "$TOTAL_RECORDS" \
    '{backup_date: $date, supabase_url: $url, total_records: $total}')

echo "$SUMMARY" | jq '.' > "$BACKUP_DIR/backup_summary.json"

echo ""
echo -e "${GREEN}📋 Backup Summary:${NC}"
echo -e "${GREEN}   Total records: $TOTAL_RECORDS${NC}"
echo -e "${GREEN}   Backup location: $BACKUP_DIR${NC}"
echo ""
echo -e "${GREEN}✅ Backup completed successfully!${NC}"

