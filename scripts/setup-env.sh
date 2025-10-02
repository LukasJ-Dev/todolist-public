#!/bin/bash

# =============================================================================
# Environment Setup Script
# =============================================================================
# This script helps users set up their environment variables securely
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to generate random secret
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to check if .env exists
check_env_file() {
    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Keeping existing .env file"
            return 0
        fi
    fi
    return 1
}

# Function to create .env file
create_env_file() {
    print_status "Creating .env file..."
    
    # Generate random secrets
    JWT_SECRET=$(generate_secret)
    REFRESH_HASH_SECRET=$(generate_secret)
    
    # Create .env file
    cat > .env << EOF
# AWS Configuration
AWS_REGION=eu-north-1
PROJECT_NAME=todolist
ENVIRONMENT=dev

# Application Secrets (Generated automatically)
JWT_SECRET=$JWT_SECRET
REFRESH_HASH_SECRET=$REFRESH_HASH_SECRET
DATABASE_URL=mongodb://your-mongodb-connection-string-here

# Optional: Custom values (will be set by Terraform outputs)
# ECR_BACKEND_URL=
# ECR_FRONTEND_URL=
# S3_BUCKET_NAME=
# CLOUDFRONT_DISTRIBUTION_ID=
# ALB_DNS_NAME=
EOF

    print_success ".env file created with generated secrets"
    print_warning "Please update DATABASE_URL with your MongoDB connection string"
}

# Function to validate .env file
validate_env_file() {
    print_status "Validating .env file..."
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found"
        print_status "Run './scripts/setup-env.sh' to create it"
        exit 1
    fi
    
    # Source the .env file
    source .env
    
    # Check required variables
    local missing_vars=()
    
    if [ -z "$JWT_SECRET" ]; then
        missing_vars+=("JWT_SECRET")
    fi
    
    if [ -z "$REFRESH_HASH_SECRET" ]; then
        missing_vars+=("REFRESH_HASH_SECRET")
    fi
    
    if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "mongodb://your-mongodb-connection-string-here" ]; then
        missing_vars+=("DATABASE_URL")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing or invalid environment variables: ${missing_vars[*]}"
        print_error "Please update your .env file"
        exit 1
    fi
    
    print_success "Environment variables validated"
}

# Main function
main() {
    print_status "Setting up environment variables..."
    
    if check_env_file; then
        validate_env_file
    else
        create_env_file
        print_warning "Please update DATABASE_URL in .env file before running deployment"
    fi
    
    print_success "Environment setup complete!"
    print_status "Next steps:"
    print_status "1. Update DATABASE_URL in .env file"
    print_status "2. Run './scripts/deploy.sh' to deploy"
}

# Run main function
main "$@"
