# AWS Infrastructure

This directory contains Terraform configurations for the AWS infrastructure.

## Structure

- `main.tf` - Main infrastructure configuration
- `variables.tf` - Input variables
- `outputs.tf` - Output values
- `terraform.tfvars` - Variable values
- `modules/` - Reusable Terraform modules
  - `networking/` - VPC, subnets, security groups
  - `eks/` - EKS cluster and node groups
  - `ecr/` - Container registries
  - `alb/` - Application Load Balancer
  - `monitoring/` - CloudWatch and logging

## Usage

1. Configure AWS credentials
2. Update `terraform.tfvars` with your values
3. Run `terraform init`
4. Run `terraform plan`
5. Run `terraform apply`
