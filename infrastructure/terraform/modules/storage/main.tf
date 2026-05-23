/**
 * Storage Module
 * 
 * Creates Cloud Storage buckets for frontend and artifacts
 */

resource "google_storage_bucket" "frontend" {
  name          = "${var.project_id}-bob-frontend-${var.environment}"
  location      = var.region
  force_destroy = true
  
  uniform_bucket_level_access = true
  
  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }
  
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "frontend"
  }
}

resource "google_storage_bucket" "artifacts" {
  name          = "${var.project_id}-bob-artifacts-${var.environment}"
  location      = var.region
  force_destroy = true
  
  uniform_bucket_level_access = true
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
    purpose     = "artifacts"
  }
}

# Make frontend bucket publicly readable
resource "google_storage_bucket_iam_member" "frontend_public" {
  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}