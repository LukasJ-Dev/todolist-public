output "bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.frontend.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.frontend.arn
}

output "bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.frontend.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.frontend.bucket_regional_domain_name
}

output "website_endpoint" {
  description = "Website endpoint of the S3 bucket"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "website_domain" {
  description = "Website domain of the S3 bucket"
  value       = aws_s3_bucket_website_configuration.frontend.website_domain
}

output "logs_bucket_id" {
  description = "ID of the S3 logs bucket"
  value       = var.enable_access_logging ? aws_s3_bucket.frontend_logs[0].id : null
}

output "logs_bucket_arn" {
  description = "ARN of the S3 logs bucket"
  value       = var.enable_access_logging ? aws_s3_bucket.frontend_logs[0].arn : null
}

output "bucket_policy" {
  description = "S3 bucket policy for CloudFront access"
  value       = aws_s3_bucket_policy.frontend.policy
}
