#!/bin/bash
# Flow Motion Rollback Script
# Rolls back application to previous working version

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_ENV=${DEPLOY_ENV:-production}
ROLLBACK_TYPE=${ROLLBACK_TYPE:-auto}
MAX_BACKUPS=${MAX_BACKUPS:-5}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Rollback functions
find_available_backups() {
    log_info "Finding available backups..."

    local backup_dir="backups"
    local available_backups=()

    if [[ ! -d "$backup_dir" ]]; then
        log_error "Backup directory not found: $backup_dir"
        return 1
    fi

    # Find backup directories sorted by modification time (newest first)
    while IFS= read -r -d '' backup; do
        available_backups+=("$backup")
    done < <(find "$backup_dir" -maxdepth 1 -type d -name "20*" -print0 | sort -rz)

    if [[ ${#available_backups[@]} -eq 0 ]]; then
        log_error "No backups found"
        return 1
    fi

    log_info "Found ${#available_backups[@]} backups:"
    for i in "${!available_backups[@]}"; do
        local backup_name=$(basename "${available_backups[$i]}")
        echo "  $((i + 1)). $backup_name"
    done

    # Return available backups array
    echo "${available_backups[@]}"
}

select_backup() {
    local available_backups=("$@")

    if [[ "$ROLLBACK_TYPE" == "auto" ]]; then
        # Auto-select the most recent backup
        SELECTED_BACKUP="${available_backups[0]}"
        log_info "Auto-selected latest backup: $(basename "$SELECTED_BACKUP")"
    else
        # Manual selection
        echo "Select backup to rollback to:"
        for i in "${!available_backups[@]}"; do
            local backup_name=$(basename "${available_backups[$i]}")
            echo "  $((i + 1)). $backup_name"
        done

        local choice
        read -p "Enter backup number (1-${#available_backups[@]}): " choice

        if [[ ! "$choice" =~ ^[0-9]+$ ]] || [[ "$choice" -lt 1 ]] || [[ "$choice" -gt ${#available_backups[@]} ]]; then
            log_error "Invalid choice: $choice"
            return 1
        fi

        SELECTED_BACKUP="${available_backups[$((choice - 1))]}"
        log_info "Selected backup: $(basename "$SELECTED_BACKUP")"
    fi
}

validate_backup() {
    local backup_dir=$1

    log_info "Validating backup integrity..."

    # Check required files exist
    local required_files=(
        ".env.$DEPLOY_ENV"
        "docker-compose.yml"
    )

    for file in "${required_files[@]}"; do
        if [[ ! -f "$backup_dir/$file" ]]; then
            log_error "Required file missing in backup: $file"
            return 1
        fi
    done

    # Validate docker-compose configuration
    if ! docker-compose -f "$backup_dir/docker-compose.yml" config -q 2>/dev/null; then
        log_error "Invalid Docker Compose configuration in backup"
        return 1
    fi

    # Check if database backup exists and is valid
    if [[ -f "$backup_dir/database_backup.sql" ]]; then
        local db_size=$(stat -f%z "$backup_dir/database_backup.sql" 2>/dev/null || stat -c%s "$backup_dir/database_backup.sql" 2>/dev/null || echo "0")
        if [[ "$db_size" -lt 1000 ]]; then
            log_warning "Database backup seems too small ($db_size bytes)"
        else
            log_success "Database backup found and appears valid"
        fi
    else
        log_warning "No database backup found in backup directory"
    fi

    log_success "Backup validation completed"
}

create_pre_rollback_backup() {
    log_info "Creating pre-rollback backup..."

    local pre_rollback_dir="backups/pre_rollback_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$pre_rollback_dir"

    # Backup current state
    if [[ -f ".env.$DEPLOY_ENV" ]]; then
        cp ".env.$DEPLOY_ENV" "$pre_rollback_dir/"
    fi

    cp docker-compose*.yml "$pre_rollback_dir/" 2>/dev/null || true

    # Backup database
    if docker-compose ps | grep -q "db"; then
        log_info "Creating database backup before rollback..."
        docker-compose exec -T db pg_dumpall -U postgres > "$pre_rollback_dir/database_backup_pre_rollback.sql" || true
    fi

    log_success "Pre-rollback backup created at $pre_rollback_dir"
}

stop_services() {
    log_info "Stopping current services..."

    # Stop services gracefully
    docker-compose -f docker-compose.yml -f "docker-compose.$DEPLOY_ENV.yml" down --timeout 60

    # Wait for services to stop
    local max_attempts=30
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if ! docker-compose ps | grep -q "Up"; then
            break
        fi

        log_info "Waiting for services to stop... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done

    if [[ $attempt -gt $max_attempts ]]; then
        log_warning "Services did not stop gracefully, forcing stop..."
        docker-compose -f docker-compose.yml -f "docker-compose.$DEPLOY_ENV.yml" down -v --remove-orphans
    fi

    log_success "Services stopped"
}

restore_files() {
    local backup_dir=$1

    log_info "Restoring files from backup..."

    # Restore environment file
    if [[ -f "$backup_dir/.env.$DEPLOY_ENV" ]]; then
        cp "$backup_dir/.env.$DEPLOY_ENV" ".env.$DEPLOY_ENV"
        log_success "Environment file restored"
    fi

    # Restore docker-compose files
    cp "$backup_dir/docker-compose.yml" . 2>/dev/null || true
    cp "$backup_dir/docker-compose.prod.yml" . 2>/dev/null || true

    log_success "Files restored from backup"
}

restore_database() {
    local backup_dir=$1

    if [[ ! -f "$backup_dir/database_backup.sql" ]]; then
        log_warning "No database backup found, skipping database restore"
        return 0
    fi

    log_info "Restoring database from backup..."

    # Start database service if not running
    if ! docker-compose ps db | grep -q "Up"; then
        log_info "Starting database service for restore..."
        docker-compose up -d db

        # Wait for database to be ready
        local max_attempts=30
        local attempt=1

        while [[ $attempt -le $max_attempts ]]; do
            if docker-compose exec -T db pg_isready -U postgres -h localhost > /dev/null 2>&1; then
                break
            fi

            log_info "Waiting for database... (attempt $attempt/$max_attempts)"
            sleep 2
            ((attempt++))
        done

        if [[ $attempt -gt $max_attempts ]]; then
            log_error "Database failed to start for restore"
            return 1
        fi
    fi

    # Perform database restore
    log_info "Performing database restore..."
    docker-compose exec -T db psql -U postgres < "$backup_dir/database_backup.sql"

    log_success "Database restored from backup"
}

start_services() {
    log_info "Starting services with rolled back version..."

    # Start services
    docker-compose -f docker-compose.yml -f "docker-compose.$DEPLOY_ENV.yml" up -d

    # Wait for services to be healthy
    local max_attempts=60
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose ps | grep -q "Up"; then
            log_success "Services started successfully"
            return 0
        fi

        log_info "Waiting for services to start... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done

    log_error "Services failed to start after rollback"
    return 1
}

run_post_rollback_checks() {
    log_info "Running post-rollback health checks..."

    # Run health check script
    if [[ -f "scripts/health-check.sh" ]]; then
        if bash scripts/health-check.sh --timeout=60; then
            log_success "Post-rollback health checks passed"
        else
            log_error "Post-rollback health checks failed"
            return 1
        fi
    else
        log_warning "Health check script not found, skipping checks"
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up old backups..."

    local backup_dir="backups"
    local backup_count=$(find "$backup_dir" -maxdepth 1 -type d -name "20*" | wc -l)

    if [[ $backup_count -gt $MAX_BACKUPS ]]; then
        local backups_to_delete=$((backup_count - MAX_BACKUPS))

        log_info "Deleting $backups_to_delete old backups..."

        # Delete oldest backups
        find "$backup_dir" -maxdepth 1 -type d -name "20*" -print0 | \
        sort | head -n "$backups_to_delete" | xargs -0 rm -rf

        log_success "Old backups cleaned up"
    else
        log_info "No old backups to clean up"
    fi
}

send_rollback_notification() {
    local rollback_result=$1
    local backup_name=$(basename "$SELECTED_BACKUP")

    log_info "Sending rollback notification..."

    # Send Slack notification if webhook is configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local message="Flow Motion rollback $rollback_result"
        local color="good"

        if [[ "$rollback_result" == "failed" ]]; then
            color="danger"
        fi

        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"$message\",\"attachments\":[{\"color\":\"$color\",\"fields\":[{\"title\":\"Backup\",\"value\":\"$backup_name\",\"short\":true}]}]}" \
             "$SLACK_WEBHOOK_URL" || true
    fi

    # Send email notification if configured
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "Flow Motion rollback $rollback_result - Backup: $backup_name" | \
        mail -s "Flow Motion Rollback $rollback_result" "$NOTIFICATION_EMAIL" || true
    fi
}

# Main rollback function
main() {
    log_info "Starting Flow Motion rollback..."
    log_info "Environment: $DEPLOY_ENV"
    log_info "Rollback type: $ROLLBACK_TYPE"

    # Change to project root
    cd "$PROJECT_ROOT"

    # Find available backups
    local available_backups
    IFS=' ' read -r -a available_backups <<< "$(find_available_backups)"

    if [[ ${#available_backups[@]} -eq 0 ]]; then
        log_error "No backups available for rollback"
        exit 1
    fi

    # Select backup
    select_backup "${available_backups[@]}"

    # Validate selected backup
    validate_backup "$SELECTED_BACKUP"

    # Create pre-rollback backup
    create_pre_rollback_backup

    # Stop current services
    stop_services

    # Restore files
    restore_files "$SELECTED_BACKUP"

    # Restore database
    restore_database "$SELECTED_BACKUP"

    # Start services
    if start_services; then
        # Run post-rollback checks
        if run_post_rollback_checks; then
            log_success "Rollback completed successfully! ✅"
            send_rollback_notification "completed"

            # Cleanup old backups
            cleanup_old_backups

            return 0
        fi
    fi

    # Rollback failed
    log_error "Rollback failed! ❌"
    send_rollback_notification "failed"

    log_error "Manual intervention may be required"
    log_info "Pre-rollback backup created for recovery"
    return 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env=*)
            DEPLOY_ENV="${1#*=}"
            shift
            ;;
        --type=*)
            ROLLBACK_TYPE="${1#*=}"
            shift
            ;;
        --max-backups=*)
            MAX_BACKUPS="${1#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env=ENVIRONMENT    Deployment environment (default: production)"
            echo "  --type=TYPE          Rollback type: auto or manual (default: auto)"
            echo "  --max-backups=NUM    Maximum number of backups to keep (default: 5)"
            echo "  --help               Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run rollback
main "$@"