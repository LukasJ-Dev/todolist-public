variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  type        = string
  default     = ""
}

variable "allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "enable_access_logging" {
  description = "Enable S3 access logging"
  type        = bool
  default     = false
}

variable "enable_cloudfront_invalidation" {
  description = "Enable CloudFront cache invalidation on S3 object changes"
  type        = bool
  default     = false
}

variable "bucket_name_suffix" {
  description = "Suffix to append to bucket name"
  type        = string
  default     = ""
}

variable "versioning_enabled" {
  description = "Enable S3 bucket versioning"
  type        = bool
  default     = true
}

variable "lifecycle_rules" {
  description = "S3 bucket lifecycle rules"
  type = object({
    enable_noncurrent_version_expiration = bool
    noncurrent_version_expiration_days   = number
    enable_abort_incomplete_multipart    = bool
    abort_incomplete_multipart_days      = number
  })
  default = {
    enable_noncurrent_version_expiration = true
    noncurrent_version_expiration_days   = 30
    enable_abort_incomplete_multipart    = true
    abort_incomplete_multipart_days      = 7
  }
}
