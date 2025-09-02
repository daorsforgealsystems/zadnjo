#!/bin/bash
# Flow Motion Production Deployment Script
# This script orchestrates the complete deployment process

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_ENV=${DEPLOY_ENV:-production}
CLOUD_PROVIDER=${CLOUD_PROVIDER:-aws}
ROLLBACK_ON_FAILURE=${ROLLBACK_ON_FAILURE:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Error handling
trap 'handle_error $? $LINENO' ERR

handle_error() {
    local exit_code=$1
    local line_number=$2
    log_error "Deployment failed at line $line_number with exit code $exit_code"

    if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
        log_warning "Initiating rollback..."
        rollback_deployment
    fi

    exit $exit_code
}

# Validation functions
validate_environment() {
    log_info "Validating deployment environment..."

    # Check required tools
    local required_tools=("docker" "docker-compose" "git" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done

    # Validate environment variables
    if [[ ! -f ".env.$DEPLOY_ENV" ]]; then
        log_error "Environment file not found: .env.$DEPLOY_ENV"
        exit 1
    fi

    # Run environment validation script
    if [[ -f "scripts/validate-config.sh" ]]; then
        log_info "Running configuration validation..."
        bash scripts/validate-config.sh
    fi

    log_success "Environment validation completed"
}

validate_deployment_artifacts() {
    log_info "Validating deployment artifacts..."

    # Check required files
    local required_files=(
        "docker-compose.yml"
        "docker-compose.prod.yml"
        "Dockerfile"
        ".env.$DEPLOY_ENV"
    )

    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file not found: $file"
            exit 1
        fi
    done

    # Validate Docker Compose files
    if ! docker-compose -f docker-compose.yml -f "docker-compose.$DEPLOY_ENV.yml" config -q; then
        log_error "Invalid Docker Compose configuration"
        exit 1
    fi

    log_success "Deployment artifacts validation completed"
}

# Deployment functions
create_backup() {
    log_info "Creating pre-deployment backup..."

    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    # Backup current environment file
    if [[ -f ".env.$DEPLOY_ENV" ]]; then
        cp ".env.$DEPLOY_ENV" "$backup_dir/"
    fi

    # Backup current docker-compose files
    cp docker-compose*.yml "$backup_dir/" 2>/dev/null || true

    # Backup database if running
    if docker-compose ps | grep -q "db"; then
        log_info "Creating database backup..."
        docker-compose exec -T db pg_dumpall -U postgres > "$backup_dir/database_backup.sql" || true
    fi

    echo "$backup_dir" > .last_backup
    log_success "Backup created at $backup_dir"
}

deploy_application() {
    log_info "Deploying Flow Motion application..."

    # Pull latest images
    log_info "Pulling latest Docker images..."
    docker-compose -f docker-compose.yml -f "docker-compose.$DEPLOY_ENV.yml" pull

    # Stop existing containers gracefully
    log_info "Stopping existing containers..."
    docker-compose -f docker-compose.yml -f "docker-compose.$DEPLOY_ENV.yml" down --timeout 30

    # Start new containers
    log_info "Starting new containers..."
    docker-compose -f docker-compose.yml -f "docker-compose.$DEPLOY_ENV.yml" up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f docker-compose.yml -f "docker-compose.$DEPLOY_ENV.yml" ps | grep -q "healthy\|running"; then
            break
        fi

        log_info "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done

    if [[ $attempt -gt $max_attempts ]]; then
        log_error "Services failed to start within timeout"
        return 1
    fi

    log_success "Application deployment completed"
}

run_health_checks() {
    log_info "Running health checks..."

    # Run health check script
    if [[ -f "scripts/health-check.sh" ]]; then
        if ! bash scripts/health-check.sh; then
            log_error "Health checks failed"
            return 1
        fi
    else
        # Basic health check
        local services=("api-gateway" "inventory-service" "user-service")
        for service in "${services[@]}"; do
            if ! docker-compose ps "$service" | grep -q "Up"; then
                log_error "Service $service is not running"
                return 1
            fi
        done
    fi

    log_success "Health checks passed"
}

run_database_migrations() {
    log_info "Running database migrations..."

    # Run migration script if it exists
    if [[ -f "scripts/run-migrations.sh" ]]; then
        bash scripts/run-migrations.sh
    else
        log_warning "No migration script found, skipping migrations"
    fi

    log_success "Database migrations completed"
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."

    # Remove unused images
    docker image prune -f

    # Remove dangling images
    docker image prune -f --filter "dangling=true"

    log_success "Docker cleanup completed"
}

rollback_deployment() {
    log_warning "Rolling back deployment..."

    # Get last backup
    if [[ -f ".last_backup" ]]; then
        local backup_dir=$(cat .last_backup)

        if [[ -d "$backup_dir" ]]; then
            log_info "Restoring from backup: $backup_dir"

            # Restore environment file
            if [[ -f "$backup_dir/.env.$DEPLOY_ENV" ]]; then
                cp "$backup_dir/.env.$DEPLOY_ENV" ".env.$DEPLOY_ENV"
            fi

            # Restore docker-compose files
            cp "$backup_dir/docker-compose."* . 2>/dev/null || true

            # Restart services
            docker-compose -f docker-compose.yml -f "docker-compose.$DEPLOY_ENV.yml" down
            docker-compose -f docker-compose.yml -f "docker-compose.$DEPLOY_ENV.yml" up -d

            log_success "Rollback completed"
            return 0
        fi
    fi

    log_error "No backup found for rollback"
    return 1
}

send_notifications() {
    log_info "Sending deployment notifications..."

    # Send Slack notification if webhook is configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local status=$1
        local message="Flow Motion deployment to $DEPLOY_ENV $status"

        if [[ "$status" == "completed" ]]; then
            message="$message ✅"
        else
            message="$message ❌"
        fi

        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"$message\"}" \
             "$SLACK_WEBHOOK_URL" || true
    fi

    # Send email notification if configured
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "Flow Motion deployment $1 at $(date)" | \
        mail -s "Flow Motion Deployment $1" "$NOTIFICATION_EMAIL" || true
    fi
}

# Main deployment function
main() {
    log_info "Starting Flow Motion deployment to $DEPLOY_ENV environment"
    log_info "Cloud Provider: $CLOUD_PROVIDER"
    log_info "Project Root: $PROJECT_ROOT"

    # Change to project root
    cd "$PROJECT_ROOT"

    # Validate environment and artifacts
    validate_environment
    validate_deployment_artifacts

    # Create backup
    create_backup

    # Run database migrations
    run_database_migrations

    # Deploy application
    deploy_application

    # Run health checks
    run_health_checks

    # Cleanup
    cleanup_old_images

    # Send success notification
    send_notifications "completed"

    log_success "Deployment completed successfully! 🎉"
    log_info "Application is running at: $(grep APP_URL .env.$DEPLOY_ENV | cut -d'=' -f2 || echo 'Check service logs')"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env=*)
            DEPLOY_ENV="${1#*=}"
            shift
            ;;
        --cloud=*)
            CLOUD_PROVIDER="${1#*=}"
            shift
            ;;
        --no-rollback)
            ROLLBACK_ON_FAILURE=false
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env=ENVIRONMENT    Deployment environment (default: production)"
            echo "  --cloud=PROVIDER     Cloud provider (default: aws)"
            echo "  --no-rollback        Disable automatic rollback on failure"
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

# Run main deployment
main "$@"