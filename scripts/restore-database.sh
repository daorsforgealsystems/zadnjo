#!/bin/bash

# Database Restore Script for Flow Motion Logistics Platform
# This script restores the PostgreSQL database from a backup

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/backups"
LOG_FILE="$BACKUP_DIR/restore_log_$(date +"%Y%m%d_%H%M%S").log"

# Database connection details
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"logistics"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"postgres123"}

# Log function
log() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a "$LOG_FILE"
}

# Function to show usage
usage() {
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 /backups/logistics_backup_20231201_120000.sql.gz"
    echo ""
    echo "Available backups:"
    ls -la "$BACKUP_DIR"/logistics_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
}

# Check if backup file is provided
if [ $# -eq 0 ]; then
    log "ERROR: No backup file specified"
    usage
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log "ERROR: Backup file $BACKUP_FILE does not exist"
    exit 1
fi

log "Starting database restore from $BACKUP_FILE"

# Confirm action
echo "WARNING: This will overwrite the current database '$DB_NAME'"
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log "Restore cancelled by user"
    exit 0
fi

# Set PostgreSQL password environment variable
export PGPASSWORD="$DB_PASSWORD"

# Create backup of current database before restore (safety measure)
CURRENT_BACKUP="$BACKUP_DIR/pre_restore_backup_$(date +"%Y%m%d_%H%M%S").sql"
log "Creating safety backup of current database to $CURRENT_BACKUP"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$CURRENT_BACKUP" --no-password

# Terminate active connections to the database
log "Terminating active connections to database $DB_NAME"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" --no-password

# Drop and recreate database
log "Dropping and recreating database $DB_NAME"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "DROP DATABASE IF EXISTS $DB_NAME;" --no-password
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME;" --no-password

# Restore from backup
log "Restoring database from $BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    # Decompress and restore
    gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-password
else
    # Restore directly
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE" --no-password
fi

# Verify restore
log "Verifying database restore"
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" --no-password)
log "Database restored successfully. Found $TABLE_COUNT tables."

# Run any post-restore scripts if they exist
POST_RESTORE_SCRIPT="$BACKUP_DIR/post_restore.sql"
if [ -f "$POST_RESTORE_SCRIPT" ]; then
    log "Running post-restore script"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$POST_RESTORE_SCRIPT" --no-password
fi

log "Database restore completed successfully"

# Unset password for security
unset PGPASSWORD

# Send notification (optional)
# echo "Database restore completed successfully" | mail -s "Database Restore Success" admin@example.com