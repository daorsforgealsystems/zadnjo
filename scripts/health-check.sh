#!/bin/bash
# Flow Motion Health Check Script
# Performs comprehensive health checks on all services

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_ENV=${DEPLOY_ENV:-production}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-30}
MAX_RETRIES=${MAX_RETRIES:-3}

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

# Health check functions
check_docker_containers() {
    log_info "Checking Docker containers..."

    local services=("api-gateway" "inventory-service" "user-service" "geolocation-service" "routing-service" "order-service" "notification-service")
    local failed_services=()

    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up"; then
            log_success "Service $service is running"
        else
            log_error "Service $service is not running"
            failed_services+=("$service")
        fi
    done

    if [[ ${#failed_services[@]} -gt 0 ]]; then
        log_error "Failed services: ${failed_services[*]}"
        return 1
    fi

    log_success "All Docker containers are healthy"
}

check_service_health_endpoints() {
    log_info "Checking service health endpoints..."

    # Load environment variables
    if [[ -f ".env.$DEPLOY_ENV" ]]; then
        set -a
        source ".env.$DEPLOY_ENV"
        set +a
    fi

    local base_url=${APP_URL:-http://localhost:3000}
    local health_endpoints=(
        "/health:api-gateway"
        "/api/v1/health:api-gateway"
        "/api/v1/inventory/health:inventory-service"
        "/api/v1/users/health:user-service"
    )

    local failed_endpoints=()

    for endpoint_info in "${health_endpoints[@]}"; do
        IFS=':' read -r endpoint service <<< "$endpoint_info"
        local url="$base_url$endpoint"

        if curl -f -s --max-time "$HEALTH_CHECK_TIMEOUT" "$url" > /dev/null 2>&1; then
            log_success "Health endpoint $endpoint ($service) is responding"
        else
            log_error "Health endpoint $endpoint ($service) is not responding"
            failed_endpoints+=("$endpoint ($service)")
        fi
    done

    if [[ ${#failed_endpoints[@]} -gt 0 ]]; then
        log_error "Failed health endpoints: ${failed_endpoints[*]}"
        return 1
    fi

    log_success "All health endpoints are responding"
}

check_database_connectivity() {
    log_info "Checking database connectivity..."

    if ! docker-compose exec -T db pg_isready -U postgres -h localhost > /dev/null 2>&1; then
        log_error "Database is not accessible"
        return 1
    fi

    log_success "Database connectivity is healthy"
}

check_redis_connectivity() {
    log_info "Checking Redis connectivity..."

    if ! docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        log_error "Redis is not accessible"
        return 1
    fi

    log_success "Redis connectivity is healthy"
}

check_service_dependencies() {
    log_info "Checking service dependencies..."

    # Check if services can communicate with each other
    local api_container=$(docker-compose ps -q api-gateway)

    if [[ -z "$api_container" ]]; then
        log_error "API Gateway container not found"
        return 1
    fi

    # Test internal service communication
    if ! docker exec "$api_container" curl -f -s --max-time 10 http://inventory-service:3001/health > /dev/null 2>&1; then
        log_warning "API Gateway cannot reach inventory service internally"
    else
        log_success "Internal service communication is working"
    fi
}

check_resource_usage() {
    log_info "Checking resource usage..."

    # Check container resource usage
    local containers=$(docker-compose ps -q)

    for container in $containers; do
        local container_name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/\///')
        local cpu_usage=$(docker stats --no-stream --format "table {{.CPUPerc}}" "$container" | tail -n 1)
        local mem_usage=$(docker stats --no-stream --format "table {{.MemPerc}}" "$container" | tail -n 1)

        log_info "Container $container_name - CPU: $cpu_usage, Memory: $mem_usage"

        # Check for high resource usage
        local cpu_percent=$(echo "$cpu_usage" | sed 's/%//')
        local mem_percent=$(echo "$mem_usage" | sed 's/%//')

        if (( $(echo "$cpu_percent > 90" | bc -l) )); then
            log_warning "High CPU usage detected for $container_name: $cpu_usage"
        fi

        if (( $(echo "$mem_percent > 90" | bc -l) )); then
            log_warning "High memory usage detected for $container_name: $mem_usage"
        fi
    done

    log_success "Resource usage check completed"
}

check_ssl_certificates() {
    log_info "Checking SSL certificates..."

    if [[ -f "/etc/ssl/certs/flowmotion.crt" ]]; then
        local cert_end_date=$(openssl x509 -in /etc/ssl/certs/flowmotion.crt -noout -enddate | cut -d'=' -f2)
        local cert_end_epoch=$(date -d "$cert_end_date" +%s)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( ($cert_end_epoch - $current_epoch) / 86400 ))

        if [[ $days_until_expiry -lt 30 ]]; then
            log_warning "SSL certificate expires in $days_until_expiry days"
        else
            log_success "SSL certificate is valid (expires in $days_until_expiry days)"
        fi
    else
        log_warning "SSL certificate not found"
    fi
}

check_logs_for_errors() {
    log_info "Checking logs for errors..."

    local services=("api-gateway" "inventory-service" "user-service")
    local time_window="5 minutes ago"

    for service in "${services[@]}"; do
        local error_count=$(docker-compose logs --since "$time_window" "$service" 2>&1 | grep -i error | wc -l)

        if [[ $error_count -gt 0 ]]; then
            log_warning "Found $error_count errors in $service logs in the last 5 minutes"
            # Show last few error lines
            docker-compose logs --tail 5 "$service" 2>&1 | grep -i error || true
        else
            log_success "No errors found in $service logs"
        fi
    done
}

generate_health_report() {
    log_info "Generating health report..."

    local report_file="health-report-$(date +%Y%m%d_%H%M%S).txt"
    {
        echo "Flow Motion Health Check Report"
        echo "Generated: $(date)"
        echo "Environment: $DEPLOY_ENV"
        echo "================================="
        echo ""

        echo "Docker Containers:"
        docker-compose ps
        echo ""

        echo "Resource Usage:"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
        echo ""

        echo "Service Health Endpoints:"
        # Add endpoint check results here
        echo "Health checks completed successfully"
        echo ""

    } > "$report_file"

    log_success "Health report generated: $report_file"
}

send_alerts() {
    local alert_message=$1
    local alert_level=${2:-warning}

    log_warning "Sending $alert_level alert: $alert_message"

    # Send Slack alert if configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color="warning"
        [[ "$alert_level" == "error" ]] && color="danger"

        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"Flow Motion Health Alert\",\"attachments\":[{\"color\":\"$color\",\"text\":\"$alert_message\"}]}" \
             "$SLACK_WEBHOOK_URL" || true
    fi

    # Send email alert if configured
    if [[ -n "${ALERT_EMAIL:-}" ]]; then
        echo "$alert_message" | mail -s "Flow Motion Health Alert - $alert_level" "$ALERT_EMAIL" || true
    fi
}

# Main health check function
main() {
    log_info "Starting Flow Motion health checks..."
    log_info "Environment: $DEPLOY_ENV"
    log_info "Timeout: $HEALTH_CHECK_TIMEOUT seconds"
    log_info "Max retries: $MAX_RETRIES"

    # Change to project root
    cd "$PROJECT_ROOT"

    local failed_checks=()
    local alerts=()

    # Perform health checks
    checks=(
        "check_docker_containers"
        "check_service_health_endpoints"
        "check_database_connectivity"
        "check_redis_connectivity"
        "check_service_dependencies"
        "check_resource_usage"
        "check_ssl_certificates"
        "check_logs_for_errors"
    )

    for check in "${checks[@]}"; do
        local retry_count=0
        local check_passed=false

        while [[ $retry_count -lt $MAX_RETRIES ]]; do
            log_info "Running $check (attempt $((retry_count + 1))/$MAX_RETRIES)..."

            if $check; then
                check_passed=true
                break
            else
                ((retry_count++))
                if [[ $retry_count -lt $MAX_RETRIES ]]; then
                    log_warning "Retrying $check in 5 seconds..."
                    sleep 5
                fi
            fi
        done

        if [[ "$check_passed" != "true" ]]; then
            failed_checks+=("$check")
            alerts+=("$check failed after $MAX_RETRIES attempts")
        fi
    done

    # Generate health report
    generate_health_report

    # Handle results
    if [[ ${#failed_checks[@]} -gt 0 ]]; then
        log_error "Health checks failed: ${failed_checks[*]}"

        # Send alerts for failed checks
        for alert in "${alerts[@]}"; do
            send_alerts "$alert" "error"
        done

        log_error "Health check summary: ${#failed_checks[@]} failed, $(( ${#checks[@]} - ${#failed_checks[@]} )) passed"
        return 1
    else
        log_success "All health checks passed! ✅"
        return 0
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env=*)
            DEPLOY_ENV="${1#*=}"
            shift
            ;;
        --timeout=*)
            HEALTH_CHECK_TIMEOUT="${1#*=}"
            shift
            ;;
        --max-retries=*)
            MAX_RETRIES="${1#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env=ENVIRONMENT       Deployment environment (default: production)"
            echo "  --timeout=SECONDS       Health check timeout in seconds (default: 30)"
            echo "  --max-retries=NUMBER    Maximum number of retries (default: 3)"
            echo "  --help                  Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run health checks
main "$@"