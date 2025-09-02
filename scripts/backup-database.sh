#!/bin/bash

# Database Backup Script for Flow Motion Logistics Platform
# This script creates automated backups of the PostgreSQL database

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/logistics_backup_$TIMESTAMP.sql"
LOG_FILE="$BACKUP_DIR/backup_log_$TIMESTAMP.log"

# Database connection details (use environment variables or defaults)
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"logistics"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"postgres123"}

# Retention settings
RETENTION_DAYS=${RETENTION_DAYS:-7}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a "$LOG_FILE"
}

log "Starting database backup for $DB_NAME"

# Set PostgreSQL password environment variable
export PGPASSWORD="$DB_PASSWORD"

# Create backup using pg_dump
log "Creating backup file: $BACKUP_FILE"
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE" --no-password --verbose >> "$LOG_FILE" 2>&1; then
    log "Backup completed successfully"

    # Compress the backup file
    COMPRESSED_FILE="$BACKUP_FILE.gz"
    log "Compressing backup file to: $COMPRESSED_FILE"
    gzip "$BACKUP_FILE"

    # Calculate backup size
    BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    log "Backup size: $BACKUP_SIZE"

    # Clean up old backups
    log "Cleaning up backups older than $RETENTION_DAYS days"
    find "$BACKUP_DIR" -name "logistics_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

    # Verify backup integrity
    log "Verifying backup integrity"
    if gunzip -c "$COMPRESSED_FILE" | head -n 10 > /dev/null; then
        log "Backup integrity check passed"
    else
        log "ERROR: Backup integrity check failed"
        exit 1
    fi

else
    log "ERROR: Backup failed"
    exit 1
fi

# List current backups
log "Current backups:"
ls -la "$BACKUP_DIR"/logistics_backup_*.sql.gz | tee -a "$LOG_FILE"

log "Database backup process completed"

# Unset password for security
unset PGPASSWORD

# Send notification (optional - requires mail setup)
# echo "Database backup completed successfully" | mail -s "Database Backup Success" admin@example.com