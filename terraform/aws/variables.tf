# Variables for AWS Infrastructure
# This file defines all input variables for the infrastructure

# Project Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "todolist"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-north-1"
}

# Networking Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["eu-north-1a", "eu-north-1b"]
}

# EKS Configuration
variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "instance_types" {
  description = "List of EC2 instance types for EKS nodes"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "capacity_type" {
  description = "Capacity type for EKS nodes (ON_DEMAND or SPOT)"
  type        = string
  default     = "ON_DEMAND"
}

variable "desired_size" {
  description = "Desired number of EKS nodes"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of EKS nodes"
  type        = number
  default     = 3
}

variable "min_size" {
  description = "Minimum number of EKS nodes"
  type        = number
  default     = 1
}

# ECR Configuration
variable "image_tag_mutability" {
  description = "Image tag mutability for ECR repositories"
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = "Enable image scanning on push"
  type        = bool
  default     = true
}

# ALB Configuration
variable "certificate_arn" {
  description = "ARN of the SSL certificate for ALB"
  type        = string
  default     = ""
}

# Monitoring Configuration
variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 7
}

variable "enable_sns_notifications" {
  description = "Enable SNS notifications for alarms"
  type        = bool
  default     = false
}

variable "enable_xray_tracing" {
  description = "Enable X-Ray distributed tracing"
  type        = bool
  default     = false
}

variable "alarm_thresholds" {
  description = "Thresholds for CloudWatch alarms"
  type = object({
    cpu_high_threshold    = number
    memory_high_threshold = number
    response_time_threshold = number
    error_count_threshold = number
  })
  default = {
    cpu_high_threshold    = 80
    memory_high_threshold = 80
    response_time_threshold = 2
    error_count_threshold = 10
  }
}

# S3 Configuration
variable "s3_allowed_origins" {
  description = "List of allowed origins for S3 CORS"
  type        = list(string)
  default     = ["*"]
}

variable "s3_enable_access_logging" {
  description = "Enable S3 access logging"
  type        = bool
  default     = false
}

variable "s3_enable_cloudfront_invalidation" {
  description = "Enable CloudFront cache invalidation on S3 object changes"
  type        = bool
  default     = false
}

# CloudFront Configuration
variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "cloudfront_custom_domain_name" {
  description = "Custom domain name for CloudFront"
  type        = string
  default     = ""
}

variable "cloudfront_certificate_arn" {
  description = "ARN of the SSL certificate for CloudFront custom domain"
  type        = string
  default     = ""
}

variable "cloudfront_aliases" {
  description = "List of aliases for the CloudFront distribution"
  type        = list(string)
  default     = []
}