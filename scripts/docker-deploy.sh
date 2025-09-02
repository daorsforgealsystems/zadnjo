#!/bin/bash
# Docker Deployment Automation Script for Flow Motion
# Handles Docker container deployment, scaling, and management

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_ENV=${DEPLOY_ENV:-production}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-}
DOCKER_USERNAME=${DOCKER_USERNAME:-}
DOCKER_PASSWORD=${DOCKER_PASSWORD:-}
SERVICES_TO_DEPLOY=${SERVICES_TO_DEPLOY:-all}
SCALE_FACTOR=${SCALE_FACTOR:-1}

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

# Docker functions
authenticate_registry() {
    if [[ -n "$DOCKER_REGISTRY" ]] && [[ -n "$DOCKER_USERNAME" ]] && [[ -n "$DOCKER_PASSWORD" ]]; then
        log_info "Authenticating with Docker registry..."

        echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin

        log_success "Authenticated with Docker registry"
    else
        log_info "No Docker registry credentials provided, using local images"
    fi
}

pull_images() {
    log_info "Pulling Docker images..."

    local compose_files=()
    compose_files+=("docker-compose.yml")

    if [[ -f "docker-compose.$DEPLOY_ENV.yml" ]]; then
        compose_files+=("docker-compose.$DEPLOY_ENV.yml")
    fi

    if [[ -f "docker-compose.override.yml" ]]; then
        compose_files+=("docker-compose.override.yml")
    fi

    # Build compose command
    local compose_cmd="docker-compose"
    for file in "${compose_files[@]}"; do
        compose_cmd="$compose_cmd -f $file"
    done

    # Pull images
    $compose_cmd pull

    log_success "Docker images pulled successfully"
}

build_images() {
    local build_services=()

    if [[ "$SERVICES_TO_DEPLOY" == "all" ]]; then
        # Get all services that have build contexts
        while IFS= read -r service; do
            build_services+=("$service")
        done < <(docker-compose config --services 2>/dev/null | xargs -I {} sh -c 'docker-compose config {} | grep -q "build:" && echo {}')
    else
        IFS=',' read -r -a build_services <<< "$SERVICES_TO_DEPLOY"
    fi

    if [[ ${#build_services[@]} -gt 0 ]]; then
        log_info "Building Docker images for services: ${build_services[*]}"

        local compose_files=()
        compose_files+=("docker-compose.yml")

        if [[ -f "docker-compose.$DEPLOY_ENV.yml" ]]; then
            compose_files+=("docker-compose.$DEPLOY_ENV.yml")
        fi

        local compose_cmd="docker-compose"
        for file in "${compose_files[@]}"; do
            compose_cmd="$compose_cmd -f $file"
        done

        $compose_cmd build "${build_services[@]}"

        log_success "Docker images built successfully"
    else
        log_info "No services require building"
    fi
}

validate_compose_config() {
    log_info "Validating Docker Compose configuration..."

    local compose_files=()
    compose_files+=("docker-compose.yml")

    if [[ -f "docker-compose.$DEPLOY_ENV.yml" ]]; then
        compose_files+=("docker-compose.$DEPLOY_ENV.yml")
    fi

    if [[ -f "docker-compose.override.yml" ]]; then
        compose_files+=("docker-compose.override.yml")
    fi

    local compose_cmd="docker-compose"
    for file in "${compose_files[@]}"; do
        compose_cmd="$compose_cmd -f $file"
    done

    # Validate configuration
    if ! $compose_cmd config -q; then
        log_error "Invalid Docker Compose configuration"
        exit 1
    fi

    log_success "Docker Compose configuration is valid"
}

stop_services() {
    local timeout=${1:-30}

    log_info "Stopping existing services (timeout: ${timeout}s)..."

    local compose_files=()
    compose_files+=("docker-compose.yml")

    if [[ -f "docker-compose.$DEPLOY_ENV.yml" ]]; then
        compose_files+=("docker-compose.$DEPLOY_ENV.yml")
    fi

    local compose_cmd="docker-compose"
    for file in "${compose_files[@]}"; do
        compose_cmd="$compose_cmd -f $file"
    done

    # Stop services gracefully
    $compose_cmd down --timeout "$timeout"

    log_success "Services stopped successfully"
}

start_services() {
    log_info "Starting services..."

    local compose_files=()
    compose_files+=("docker-compose.yml")

    if [[ -f "docker-compose.$DEPLOY_ENV.yml" ]]; then
        compose_files+=("docker-compose.$DEPLOY_ENV.yml")
    fi

    if [[ -f "docker-compose.override.yml" ]]; then
        compose_files+=("docker-compose.override.yml")
    fi

    local compose_cmd="docker-compose"
    for file in "${compose_files[@]}"; do
        compose_cmd="$compose_cmd -f $file"
    done

    # Start services
    $compose_cmd up -d

    log_success "Services started successfully"
}

wait_for_services() {
    local timeout=${1:-300}
    local interval=${2:-10}

    log_info "Waiting for services to be healthy (timeout: ${timeout}s)..."

    local compose_files=()
    compose_files+=("docker-compose.yml")

    if [[ -f "docker-compose.$DEPLOY_ENV.yml" ]]; then
        compose_files+=("docker-compose.$DEPLOY_ENV.yml")
    fi

    local compose_cmd="docker-compose"
    for file in "${compose_files[@]}"; do
        compose_cmd="$compose_cmd -f $file"
    done

    local start_time=$(date +%s)
    local end_time=$((start_time + timeout))

    while [[ $(date +%s) -lt $end_time ]]; do
        # Check if all services are running
        if $compose_cmd ps | grep -q "Up"; then
            local running_services=$($compose_cmd ps --services --filter "status=running" | wc -l)
            local total_services=$($compose_cmd config --services | wc -l)

            if [[ $running_services -eq $total_services ]]; then
                log_success "All services are running ($running_services/$total_services)"
                return 0
            fi

            log_info "Services status: $running_services/$total_services running"
        else
            log_info "No services are currently running"
        fi

        sleep "$interval"
    done

    log_error "Timeout waiting for services to be healthy"
    $compose_cmd ps
    return 1
}

scale_services() {
    if [[ $SCALE_FACTOR -gt 1 ]]; then
        log_info "Scaling services by factor of $SCALE_FACTOR..."

        local compose_files=()
        compose_files+=("docker-compose.yml")

        if [[ -f "docker-compose.$DEPLOY_ENV.yml" ]]; then
            compose_files+=("docker-compose.$DEPLOY_ENV.yml")
        fi

        local compose_cmd="docker-compose"
        for file in "${compose_files[@]}"; do
            compose_cmd="$compose_cmd -f $file"
        done

        # Get scalable services
        local services=$($compose_cmd config --services)

        for service in $services; do
            # Scale service if it doesn't have specific scale settings
            if ! $compose_cmd config | grep -A 5 "^  $service:" | grep -q "scale:"; then
                $compose_cmd up -d --scale "$service=$SCALE_FACTOR"
            fi
        done

        log_success "Services scaled successfully"
    fi
}

cleanup_docker() {
    log_info "Cleaning up Docker resources..."

    # Remove unused containers
    docker container prune -f

    # Remove unused images
    docker image prune -f

    # Remove unused volumes
    docker volume prune -f

    # Remove unused networks
    docker network prune -f

    log_success "Docker cleanup completed"
}

show_deployment_status() {
    log_info "Deployment status:"

    local compose_files=()
    compose_files+=("docker-compose.yml")

    if [[ -f "docker-compose.$DEPLOY_ENV.yml" ]]; then
        compose_files+=("docker-compose.$DEPLOY_ENV.yml")
    fi

    local compose_cmd="docker-compose"
    for file in "${compose_files[@]}"; do
        compose_cmd="$compose_cmd -f $file"
    done

    echo ""
    echo "Container Status:"
    $compose_cmd ps

    echo ""
    echo "Resource Usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

    echo ""
    echo "Docker System Info:"
    docker system df
}

rollback_on_failure() {
    log_error "Deployment failed, attempting rollback..."

    if [[ -f "scripts/rollback.sh" ]]; then
        bash scripts/rollback.sh --env="$DEPLOY_ENV" --type=auto
    else
        log_error "Rollback script not found"
        # Manual rollback
        stop_services 10
        log_info "Manual rollback completed"
    fi
}

# Main deployment function
main() {
    log_info "Starting Docker deployment for Flow Motion..."
    log_info "Environment: $DEPLOY_ENV"
    log_info "Services: $SERVICES_TO_DEPLOY"
    log_info "Scale Factor: $SCALE_FACTOR"

    # Change to project root
    cd "$PROJECT_ROOT"

    # Set up error handling
    trap rollback_on_failure ERR

    # Validate configuration
    validate_compose_config

    # Authenticate with registry
    authenticate_registry

    # Pull or build images
    if [[ -n "$DOCKER_REGISTRY" ]]; then
        pull_images
    else
        build_images
    fi

    # Stop existing services
    stop_services

    # Start new services
    start_services

    # Scale services if requested
    scale_services

    # Wait for services to be healthy
    wait_for_services

    # Cleanup
    cleanup_docker

    # Show deployment status
    show_deployment_status

    log_success "Docker deployment completed successfully! 🎉"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env=*)
            DEPLOY_ENV="${1#*=}"
            shift
            ;;
        --registry=*)
            DOCKER_REGISTRY="${1#*=}"
            shift
            ;;
        --username=*)
            DOCKER_USERNAME="${1#*=}"
            shift
            ;;
        --password=*)
            DOCKER_PASSWORD="${1#*=}"
            shift
            ;;
        --services=*)
            SERVICES_TO_DEPLOY="${1#*=}"
            shift
            ;;
        --scale=*)
            SCALE_FACTOR="${1#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env=ENVIRONMENT       Deployment environment (default: production)"
            echo "  --registry=REGISTRY     Docker registry URL"
            echo "  --username=USERNAME     Docker registry username"
            echo "  --password=PASSWORD     Docker registry password"
            echo "  --services=SERVICES     Services to deploy (default: all)"
            echo "  --scale=FACTOR          Scale factor for services (default: 1)"
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

# Run deployment
main "$@"