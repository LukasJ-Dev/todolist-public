# Main Terraform Configuration for AWS Infrastructure
# This file ties all modules together and defines the complete infrastructure

# Terraform Configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

# AWS Provider Configuration
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data source for AWS account ID
data "aws_caller_identity" "current" {}

# Kubernetes Provider Configuration
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_id]
  }
}

# Helm Provider Configuration
provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_id]
    }
  }
}

# Networking Module - VPC, subnets, security groups
module "networking" {
  source = "./modules/networking"
  
  project_name      = var.project_name
  environment       = var.environment
  aws_region        = var.aws_region
  vpc_cidr          = var.vpc_cidr
  availability_zones = var.availability_zones
}

# ECR Module - Container registries for backend and frontend
module "ecr" {
  source = "./modules/ecr"
  
  project_name        = var.project_name
  environment         = var.environment
  image_tag_mutability = var.image_tag_mutability
  scan_on_push        = var.scan_on_push
}

# EKS Module - Kubernetes cluster and node groups
module "eks" {
  source = "./modules/eks"
  
  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = module.networking.vpc_id
  private_subnets     = module.networking.private_subnet_ids
  public_subnets      = module.networking.public_subnet_ids
  kubernetes_version  = var.kubernetes_version
  instance_types      = var.instance_types
  capacity_type       = var.capacity_type
  desired_size        = var.desired_size
  max_size           = var.max_size
  min_size           = var.min_size
}

# ALB Module - Application Load Balancer with SSL termination
module "alb" {
  source = "./modules/alb"
  
  project_name     = var.project_name
  environment      = var.environment
  vpc_id          = module.networking.vpc_id
  public_subnets  = module.networking.public_subnet_ids
  certificate_arn = var.certificate_arn
}

# ALB Controller Module - AWS Load Balancer Controller for EKS
module "alb_controller" {
  source = "./modules/alb-controller"
  
  project_name      = var.project_name
  environment       = var.environment
  aws_region        = var.aws_region
  aws_account_id    = data.aws_caller_identity.current.account_id
  cluster_name      = module.eks.cluster_id
  vpc_id           = module.networking.vpc_id
  oidc_provider_arn = module.eks.oidc_provider_arn
}

# S3 Module - Static file hosting for frontend
module "s3" {
  source = "./modules/s3"
  
  project_name     = var.project_name
  environment      = var.environment
  cloudfront_distribution_arn = module.cloudfront.distribution_arn
  allowed_origins  = var.s3_allowed_origins
  enable_access_logging = var.s3_enable_access_logging
  enable_cloudfront_invalidation = var.s3_enable_cloudfront_invalidation
}

# CloudFront Module - CDN for frontend
module "cloudfront" {
  source = "./modules/cloudfront"
  
  project_name     = var.project_name
  environment      = var.environment
  s3_bucket_domain_name = module.s3.bucket_domain_name
  price_class      = var.cloudfront_price_class
  custom_domain_name = var.cloudfront_custom_domain_name
  certificate_arn  = var.cloudfront_certificate_arn
  aliases         = var.cloudfront_aliases
}

# Monitoring Module - CloudWatch, logging, and observability
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name     = var.project_name
  environment      = var.environment
  aws_region       = var.aws_region
  vpc_id          = module.networking.vpc_id
  eks_cluster_name = module.eks.cluster_id
  alb_arn         = module.alb.alb_arn
  
  log_retention_days      = var.log_retention_days
  enable_sns_notifications = var.enable_sns_notifications
  enable_xray_tracing    = var.enable_xray_tracing
  alarm_thresholds       = var.alarm_thresholds
}
