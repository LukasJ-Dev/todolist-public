# Outputs for ALB Controller module

output "alb_controller_role_arn" {
  description = "ARN of the IAM role for AWS Load Balancer Controller"
  value       = aws_iam_role.alb_controller.arn
}

output "alb_controller_service_account_name" {
  description = "Name of the Kubernetes service account for AWS Load Balancer Controller"
  value       = kubernetes_service_account.alb_controller.metadata[0].name
}

output "alb_controller_helm_release_name" {
  description = "Name of the Helm release for AWS Load Balancer Controller"
  value       = helm_release.aws_load_balancer_controller.name
}
