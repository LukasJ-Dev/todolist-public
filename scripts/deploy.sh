#!/bin/bash

# =============================================================================
# AWS EKS + S3 + CloudFront Deployment Script
# =============================================================================
# This script automates the complete deployment of the todolist application
# to AWS EKS, S3, and CloudFront.
#
# Prerequisites:
# - AWS CLI configured with appropriate permissions
# - Terraform installed
# - Docker installed
# - kubectl installed
# - Helm installed
#
# Usage: ./scripts/deploy.sh
# Environment variables:
#   SKIP_DOCKER_BUILD=true          # Skip Docker build and push
#   SKIP_ALB_CONTROLLER_WAIT=true   # Skip waiting for ALB controller
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="todolist"
ENVIRONMENT="dev"
AWS_REGION="eu-north-1"
CLUSTER_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

# Check for skip flags
SKIP_ALB_CONTROLLER_WAIT=${SKIP_ALB_CONTROLLER_WAIT:-false}
SKIP_DOCKER_BUILD=${SKIP_DOCKER_BUILD:-false}

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists aws; then
        missing_deps+=("aws-cli")
    fi
    
    if ! command_exists terraform; then
        missing_deps+=("terraform")
    fi
    
    if ! command_exists docker; then
        missing_deps+=("docker")
    fi
    
    if ! command_exists kubectl; then
        missing_deps+=("kubectl")
    fi
    
    if ! command_exists helm; then
        missing_deps+=("helm")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_error "Please install the missing dependencies and run the script again."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to check AWS credentials
check_aws_credentials() {
    print_status "Checking AWS credentials..."
    
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_error "AWS credentials not configured or invalid"
        print_error "Please run 'aws configure' and set up your credentials"
        exit 1
    fi
    
    local caller_identity=$(aws sts get-caller-identity)
    
    # Try to parse with jq, fallback to grep if not available
    if command_exists jq; then
        local account_id=$(echo "$caller_identity" | jq -r '.Account')
        local user_arn=$(echo "$caller_identity" | jq -r '.Arn')
    else
        local account_id=$(echo "$caller_identity" | grep -o '"Account":"[^"]*"' | cut -d'"' -f4)
        local user_arn=$(echo "$caller_identity" | grep -o '"Arn":"[^"]*"' | cut -d'"' -f4)
    fi
    
    print_success "AWS credentials verified"
    print_status "Account ID: $account_id"
    print_status "User: $user_arn"
}

# Function to deploy infrastructure with Terraform
deploy_infrastructure() {
    print_status "Deploying AWS infrastructure with Terraform..."
    
    cd terraform/aws
    
    # Initialize Terraform
    print_status "Initializing Terraform..."
    terraform init
    
    # Plan the deployment
    print_status "Planning Terraform deployment..."
    terraform plan
    
    # Apply the deployment
    print_status "Applying Terraform configuration..."
    terraform apply -auto-approve
    
    # Get outputs
    print_status "Getting Terraform outputs..."
    ECR_BACKEND_URL=$(terraform output -raw backend_repository_url)
    ECR_FRONTEND_URL=$(terraform output -raw frontend_repository_url)
    S3_BUCKET_NAME=$(terraform output -raw s3_bucket_id)
    CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
    ALB_DNS_NAME=$(terraform output -raw alb_dns_name)
    
    print_success "Infrastructure deployed successfully"
    print_status "ECR Backend URL: $ECR_BACKEND_URL"
    print_status "ECR Frontend URL: $ECR_FRONTEND_URL"
    print_status "S3 Bucket: $S3_BUCKET_NAME"
    print_status "CloudFront Distribution ID: $CLOUDFRONT_DISTRIBUTION_ID"
    print_status "ALB DNS Name: $ALB_DNS_NAME"
    
    cd ../..
}

# Function to configure kubectl
configure_kubectl() {
    print_status "Configuring kubectl for EKS cluster..."
    
    aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"
    
    # Verify cluster access
    if kubectl get nodes >/dev/null 2>&1; then
        print_success "kubectl configured successfully"
        kubectl get nodes
    else
        print_error "Failed to configure kubectl"
        exit 1
    fi
}

# Function to install AWS Load Balancer Controller
install_alb_controller() {
    print_status "Installing AWS Load Balancer Controller..."
    
    # Add EKS charts repository
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    
    # Check if already installed
    if helm list -n kube-system | grep -q aws-load-balancer-controller; then
        print_status "AWS Load Balancer Controller already installed, upgrading..."
        helm upgrade aws-load-balancer-controller eks/aws-load-balancer-controller \
            --set clusterName="$CLUSTER_NAME" \
            --set serviceAccount.create=false \
            --set serviceAccount.name=aws-load-balancer-controller \
            -n kube-system
    else
        # Install the controller
        helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
            --set clusterName="$CLUSTER_NAME" \
            --set serviceAccount.create=false \
            --set serviceAccount.name=aws-load-balancer-controller \
            -n kube-system
    fi
    
    # Wait for controller to be ready with better error handling
    if [ "$SKIP_ALB_CONTROLLER_WAIT" = "true" ]; then
        print_warning "Skipping AWS Load Balancer Controller wait (SKIP_ALB_CONTROLLER_WAIT=true)"
        print_warning "Controller may not be ready, but continuing..."
    else
        print_status "Waiting for AWS Load Balancer Controller to be ready..."
        print_status "Tip: Set SKIP_ALB_CONTROLLER_WAIT=true to skip this wait"
        
        # Wait up to 5 minutes for pods to appear
        local timeout=300
        local elapsed=0
        while [ $elapsed -lt $timeout ]; do
            if kubectl get pods -n kube-system | grep -q aws-load-balancer-controller; then
                print_status "Controller pods found, waiting for them to be ready..."
                break
            fi
            print_status "Waiting for controller pods to appear... ($elapsed/$timeout seconds)"
            sleep 10
            elapsed=$((elapsed + 10))
        done
        
        # Wait for pods to be ready
        if kubectl get pods -n kube-system | grep -q aws-load-balancer-controller; then
            kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=aws-load-balancer-controller -n kube-system --timeout=300s
            print_success "AWS Load Balancer Controller installed and ready"
        else
            print_warning "AWS Load Balancer Controller pods not found, but continuing..."
            print_warning "You may need to check IAM permissions manually"
        fi
    fi
}

# Function to build and push Docker images
build_and_push_images() {
    if [ "$SKIP_DOCKER_BUILD" = "true" ]; then
        print_warning "Skipping Docker build (SKIP_DOCKER_BUILD=true)"
        print_status "Make sure your ECR images are up to date!"
        return 0
    fi
    
    print_status "Building and pushing Docker images..."
    
    # Login to ECR
    print_status "Logging in to ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_BACKEND_URL"
    
    # Build and push backend
    print_status "Building backend image..."
    if docker build -f docker/Dockerfile.backend -t todolist-backend:latest .; then
        docker tag todolist-backend:latest "$ECR_BACKEND_URL:latest"
        if docker push "$ECR_BACKEND_URL:latest"; then
            print_success "Backend image pushed successfully"
        else
            print_error "Failed to push backend image"
            exit 1
        fi
    else
        print_error "Failed to build backend image"
        exit 1
    fi
    
    # Note: Frontend is deployed to S3 + CloudFront, not as Docker image
    print_status "Skipping frontend Docker build (will be deployed to S3 + CloudFront)"
    
    print_success "Docker images built and pushed successfully"
}

# Function to load environment variables
load_environment() {
    print_status "Loading environment variables..."
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found"
        print_error "Please run './scripts/setup-env.sh' first"
        exit 1
    fi
    
    # Source the .env file
    source .env
    
    # Validate required variables
    if [ -z "$JWT_SECRET" ] || [ -z "$REFRESH_HASH_SECRET" ] || [ -z "$DATABASE_URL" ]; then
        print_error "Missing required environment variables"
        print_error "Please check your .env file"
        exit 1
    fi
    
    print_success "Environment variables loaded"
}

# Function to update Kubernetes manifests with environment variables
update_k8s_manifests() {
    print_status "Updating Kubernetes manifests with environment variables..."
    
    # Create temporary directory for processed manifests (in /tmp for security)
    TEMP_DIR=$(mktemp -d)
    print_status "Using temporary directory: $TEMP_DIR"
    
    # Copy and process each manifest
    for file in k8s/*.yaml; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            print_status "Processing $filename..."
            
            # Replace placeholders with actual values (escape special characters)
            sed "s|{{ECR_BACKEND_URL}}|$ECR_BACKEND_URL|g" "$file" | \
            sed "s|{{ECR_FRONTEND_URL}}|$ECR_FRONTEND_URL|g" | \
            sed "s|{{JWT_SECRET}}|$JWT_SECRET|g" | \
            sed "s|{{REFRESH_HASH_SECRET}}|$REFRESH_HASH_SECRET|g" | \
            sed "s|{{DATABASE_URL}}|$DATABASE_URL|g" > "$TEMP_DIR/$filename"
        fi
    done
    
    # Store temp directory for cleanup
    echo "$TEMP_DIR" > .k8s-temp-dir
    
    print_success "Kubernetes manifests updated"
}

# Function to deploy to Kubernetes
deploy_to_k8s() {
    print_status "Deploying to Kubernetes..."
    
    # Get temp directory
    if [ -f ".k8s-temp-dir" ]; then
        TEMP_DIR=$(cat .k8s-temp-dir)
        print_status "Using processed manifests from: $TEMP_DIR"
        
        # Apply namespace first
        print_status "Creating namespace..."
        kubectl apply -f "$TEMP_DIR/namespace.yaml"
        
        # Wait for namespace to be ready (namespaces are usually ready immediately)
        print_status "Waiting for namespace to be ready..."
        sleep 5
        if kubectl get namespace todolist >/dev/null 2>&1; then
            print_success "Namespace is ready"
        else
            print_warning "Namespace not found, but continuing..."
        fi
        
        # Apply other resources
        print_status "Applying other resources..."
        kubectl apply -f "$TEMP_DIR/configmap.yaml"
        kubectl apply -f "$TEMP_DIR/secret.yaml"
        kubectl apply -f "$TEMP_DIR/backend-deployment.yaml"
        
        # Check if ALB controller webhook is ready before applying service
        print_status "Checking ALB controller webhook..."
        if kubectl get endpoints aws-load-balancer-webhook-service -n kube-system >/dev/null 2>&1; then
            # Check if endpoints are actually available
            if kubectl get endpoints aws-load-balancer-webhook-service -n kube-system -o jsonpath='{.subsets[*].addresses[*].ip}' | grep -q .; then
                print_status "ALB controller webhook is ready, applying service..."
                kubectl apply -f "$TEMP_DIR/backend-service.yaml"
            else
                print_warning "ALB controller webhook service exists but no endpoints, skipping service..."
                print_warning "You can apply the service later with: kubectl apply -f k8s/backend-service.yaml"
            fi
        else
            print_warning "ALB controller webhook not ready, skipping service for now..."
            print_warning "You can apply the service later with: kubectl apply -f k8s/backend-service.yaml"
        fi
        
        kubectl apply -f "$TEMP_DIR/ingress.yaml"
        
        # Wait for deployments to be ready
        print_status "Waiting for deployments to be ready..."
        kubectl wait --for=condition=available deployment/backend -n todolist --timeout=300s
        
        # Get ingress information
        print_status "Getting ingress information..."
        kubectl get ingress -n todolist
        
        # Secure cleanup of temp directory
        print_status "Securely cleaning up temporary files..."
        rm -rf "$TEMP_DIR"
        rm -f .k8s-temp-dir
        
        print_success "Kubernetes deployment completed"
    else
        print_error "Temporary directory not found"
        exit 1
    fi
}

# Function to build and deploy frontend
deploy_frontend() {
    print_status "Building and deploying frontend..."
    
    # Get ALB URL for frontend API calls
    print_status "Getting ALB URL for frontend API configuration..."
    ALB_URL=$(kubectl get ingress -n todolist -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
    
    if [ -z "$ALB_URL" ]; then
        print_warning "ALB URL not found, using default localhost for development"
        ALB_URL="localhost:3000"
    else
        print_status "Using ALB URL: $ALB_URL"
    fi
    
    # Set API URL for frontend build
    export VITE_API_URL="http://$ALB_URL/api/v1"
    print_status "Setting VITE_API_URL to: $VITE_API_URL"
    
    # Build React app with API URL
    print_status "Building React application with API URL..."
    if pnpm -F @todolist/frontend build; then
        print_success "React application built successfully"
    else
        print_error "Failed to build React application"
        exit 1
    fi
    
    # Upload to S3
    print_status "Uploading frontend to S3..."
    if aws s3 sync apps/frontend/dist/ "s3://$S3_BUCKET_NAME" --delete; then
        print_success "Frontend uploaded to S3 successfully"
    else
        print_error "Failed to upload frontend to S3"
        exit 1
    fi
    
    # Create CloudFront invalidation
    print_status "Creating CloudFront invalidation..."
    if aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"; then
        print_success "CloudFront invalidation created successfully"
    else
        print_warning "Failed to create CloudFront invalidation, but continuing..."
    fi
    
    print_success "Frontend deployed successfully"
}

# Function to display final information
display_final_info() {
    print_success "Deployment completed successfully!"
    echo
    print_status "Application URLs:"
    print_status "Frontend (CloudFront): https://$(aws cloudfront get-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text)"
    print_status "Backend (ALB): http://$ALB_DNS_NAME"
    print_status "Health Check: http://$ALB_DNS_NAME/health"
    echo
    print_status "Useful commands:"
    print_status "kubectl get pods -n todolist"
    print_status "kubectl get services -n todolist"
    print_status "kubectl get ingress -n todolist"
    print_status "kubectl logs -f deployment/backend -n todolist"
    echo
    print_status "To scale down for cost savings:"
    print_status "kubectl scale deployment backend --replicas=0 -n todolist"
    print_status "kubectl scale deployment frontend --replicas=0 -n todolist"
    echo
    print_status "To scale back up:"
    print_status "kubectl scale deployment backend --replicas=2 -n todolist"
    print_status "kubectl scale deployment frontend --replicas=2 -n todolist"
}

# Main execution
main() {
    print_status "Starting AWS EKS + S3 + CloudFront deployment..."
    echo
    
    check_prerequisites
    check_aws_credentials
    load_environment
    deploy_infrastructure
    configure_kubectl
    install_alb_controller
    build_and_push_images
    update_k8s_manifests
    deploy_to_k8s
    deploy_frontend
    display_final_info
}

# Run main function
main "$@"
