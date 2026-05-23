output "frontend_bucket" {
  description = "Frontend bucket name"
  value       = google_storage_bucket.frontend.name
}

output "artifacts_bucket" {
  description = "Artifacts bucket name"
  value       = google_storage_bucket.artifacts.name
}

output "frontend_url" {
  description = "Frontend bucket URL"
  value       = "https://storage.googleapis.com/${google_storage_bucket.frontend.name}/index.html"
}