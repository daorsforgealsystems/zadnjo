#!/bin/bash

# GitHub Repository Secrets Setup Script
# This script helps configure all required GitHub repository secrets for CI/CD

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

# Function to validate email format
validate_email() {
    if [[ $1 =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate URL format
validate_url() {
    if [[ $1 =~ ^https?:// ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate SSH key format
validate_ssh_key() {
    if [[ $1 =~ ^-----BEGIN ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate UUID format
validate_uuid() {
    if [[ $1 =~ ^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to prompt for secret with validation
prompt_secret() {
    local secret_name=$1
    local description=$2
    local validation_func=$3
    local example=$4

    print_info "$description"
    if [ -n "$example" ]; then
        echo "Example: $example"
    fi

    while true; do
        read -p "Enter $secret_name: " -s value
        echo

        if [ -z "$value" ]; then
            print_warning "Value cannot be empty. Please try again."
            continue
        fi

        if [ -n "$validation_func" ] && ! $validation_func "$value"; then
            print_warning "Invalid format. Please check and try again."
            continue
        fi

        echo "$secret_name=$value" >> .secrets.env
        print_success "$secret_name configured"
        break
    done
}

# Function to generate GitHub setup instructions
generate_github_instructions() {
    print_header "GitHub Setup Instructions"

    echo
    print_info "Follow these steps to add secrets to your GitHub repository:"
    echo
    echo "1. Go to your GitHub repository"
    echo "2. Click 'Settings' tab"
    echo "3. Scroll to 'Security' section"
    echo "4. Click 'Secrets and variables'"
    echo "5. Click 'Actions'"
    echo "6. Click 'New repository secret' for each secret below"
    echo

    if [ -f .secrets.env ]; then
        echo "Required Secrets to Add:"
        echo "------------------------"

        while IFS='=' read -r key value; do
            echo "• $key"
        done < .secrets.env

        echo
        print_info "Secret values have been saved to .secrets.env (keep this file secure!)"
        print_warning "Remember to delete .secrets.env after setting up GitHub secrets"
    fi
}

# Function to generate test workflow
generate_test_workflow() {
    cat > .github/workflows/test-secrets.yml << 'EOF'
name: Test Secrets Configuration
on: workflow_dispatch

jobs:
  validate-secrets:
    runs-on: ubuntu-latest
    steps:
      - name: Validate Netlify Secrets
        run: |
          if [ -z "$NETLIFY_AUTH_TOKEN" ]; then echo "❌ NETLIFY_AUTH_TOKEN not set"; exit 1; fi
          if [ -z "$NETLIFY_SITE_ID" ]; then echo "❌ NETLIFY_SITE_ID not set"; exit 1; fi
          echo "✅ Netlify secrets configured correctly"

      - name: Validate Docker Secrets
        run: |
          if [ -z "$DOCKER_USERNAME" ]; then echo "❌ DOCKER_USERNAME not set"; exit 1; fi
          if [ -z "$DOCKER_PASSWORD" ]; then echo "❌ DOCKER_PASSWORD not set"; exit 1; fi
          echo "✅ Docker secrets configured correctly"

      - name: Validate Production SSH Secrets
        run: |
          if [ -z "$PRODUCTION_HOST" ]; then echo "❌ PRODUCTION_HOST not set"; exit 1; fi
          if [ -z "$PRODUCTION_USER" ]; then echo "❌ PRODUCTION_USER not set"; exit 1; fi
          if [ -z "$PRODUCTION_SSH_KEY" ]; then echo "❌ PRODUCTION_SSH_KEY not set"; exit 1; fi
          echo "✅ Production SSH secrets configured correctly"

      - name: Validate Codecov Secret
        run: |
          if [ -z "$CODECOV_TOKEN" ]; then echo "❌ CODECOV_TOKEN not set"; exit 1; fi
          echo "✅ Codecov secret configured correctly"

      - name: Success Message
        run: echo "🎉 All required secrets are properly configured!"
    env:
      NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
      NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
      DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
      DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
      PRODUCTION_HOST: ${{ secrets.PRODUCTION_HOST }}
      PRODUCTION_USER: ${{ secrets.PRODUCTION_USER }}
      PRODUCTION_SSH_KEY: ${{ secrets.PRODUCTION_SSH_KEY }}
      CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
EOF

    print_success "Test workflow created: .github/workflows/test-secrets.yml"
}

# Main script
main() {
    print_header "GitHub Repository Secrets Setup Script"
    echo
    print_info "This script will help you configure all required GitHub secrets for CI/CD"
    print_warning "Make sure you have all credentials ready before proceeding"
    echo

    # Clean up any existing secrets file
    if [ -f .secrets.env ]; then
        rm .secrets.env
    fi

    # Required secrets
    print_header "Required Secrets Configuration"

    # Netlify secrets
    echo
    print_info "=== Netlify Configuration ==="
    prompt_secret "NETLIFY_AUTH_TOKEN" "Netlify Personal Access Token" "" "nf..."
    prompt_secret "NETLIFY_SITE_ID" "Netlify Site ID" "validate_uuid" "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

    # Docker secrets
    echo
    print_info "=== Docker Hub Configuration ==="
    prompt_secret "DOCKER_USERNAME" "Docker Hub Username" "" "your-dockerhub-username"
    prompt_secret "DOCKER_PASSWORD" "Docker Hub Access Token" "" "dckr_pat_..."

    # Production SSH secrets
    echo
    print_info "=== Production Server Configuration ==="
    prompt_secret "PRODUCTION_HOST" "Production Server Host/IP" "" "your-server.example.com"
    prompt_secret "PRODUCTION_USER" "SSH Username" "" "ubuntu"
    prompt_secret "PRODUCTION_SSH_KEY" "Private SSH Key" "validate_ssh_key" "-----BEGIN OPENSSH PRIVATE KEY-----"

    # Codecov secret
    echo
    print_info "=== Code Coverage Configuration ==="
    prompt_secret "CODECOV_TOKEN" "Codecov Upload Token" "validate_uuid" "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

    # Optional secrets
    echo
    print_info "=== Optional Secrets (press Enter to skip) ==="

    read -p "Configure Supabase secrets? (y/N): " configure_supabase
    if [[ $configure_supabase =~ ^[Yy]$ ]]; then
        echo
        print_info "=== Supabase Configuration ==="

        # Development
        prompt_secret "DEV_SUPABASE_URL" "Development Supabase URL" "validate_url" "https://your-project.supabase.co"
        prompt_secret "DEV_SUPABASE_ANON_KEY" "Development Supabase Anon Key" "" "eyJ..."
        prompt_secret "DEV_SUPABASE_DB_URL" "Development Database URL" "validate_url" "postgresql://user:pass@host:5432/db"

        # Production
        prompt_secret "PROD_SUPABASE_URL" "Production Supabase URL" "validate_url" "https://your-project.supabase.co"
        prompt_secret "PROD_SUPABASE_ANON_KEY" "Production Supabase Anon Key" "" "eyJ..."
    fi

    # Generate instructions
    echo
    generate_github_instructions

    # Generate test workflow
    echo
    read -p "Generate test workflow to validate secrets? (Y/n): " generate_test
    if [[ ! $generate_test =~ ^[Nn]$ ]]; then
        generate_test_workflow
    fi

    # Final instructions
    echo
    print_header "Next Steps"
    echo
    print_info "1. Set up all secrets in GitHub using the instructions above"
    print_info "2. Delete the .secrets.env file for security"
    print_info "3. Run the test workflow to validate configuration"
    print_info "4. Your CI/CD pipeline should now work correctly"
    echo
    print_success "Setup complete! 🎉"
}

# Check if running interactively
if [ -t 0 ]; then
    main
else
    print_error "This script must be run interactively"
    exit 1
fi