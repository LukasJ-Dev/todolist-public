output "log_group_arns" {
  description = "ARNs of the CloudWatch log groups"
  value = {
    eks_cluster = aws_cloudwatch_log_group.eks_cluster.arn
    application = aws_cloudwatch_log_group.application.arn
  }
}

output "alarm_arns" {
  description = "ARNs of the CloudWatch alarms"
  value = {
    eks_cluster_cpu_high    = aws_cloudwatch_metric_alarm.eks_cluster_cpu_high.arn
    eks_cluster_memory_high  = aws_cloudwatch_metric_alarm.eks_cluster_memory_high.arn
    alb_response_time_high  = aws_cloudwatch_metric_alarm.alb_response_time_high.arn
    alb_5xx_errors_high    = aws_cloudwatch_metric_alarm.alb_5xx_errors_high.arn
  }
}

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = var.enable_sns_notifications ? aws_sns_topic.alerts[0].arn : null
}

output "xray_sampling_rule_arn" {
  description = "ARN of the X-Ray sampling rule"
  value       = var.enable_xray_tracing ? aws_xray_sampling_rule.main[0].arn : null
}