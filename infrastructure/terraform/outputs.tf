/**
 * Terraform Outputs
 */

output "firestore_database" {
  description = "Firestore database name"
  value       = module.firestore.database_name
}

output "redis_host" {
  description = "Redis instance host"
  value       = module.redis.redis_host
}

output "redis_port" {
  description = "Redis instance port"
  value       = module.redis.redis_port
}

output "storage_bucket" {
  description = "Cloud Storage bucket for frontend"
  value       = module.storage.frontend_bucket
}

output "artifacts_bucket" {
  description = "Cloud Storage bucket for artifacts"
  value       = module.storage.artifacts_bucket
}

output "backend_url" {
  description = "Cloud Run backend URL"
  value       = module.cloudrun.service_url
}

output "service_account_email" {
  description = "Backend service account email"
  value       = google_service_account.backend.email
}