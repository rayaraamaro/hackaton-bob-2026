/**
 * AI Agent Project Studio - Infrastructure as Code
 * 
 * Provisions GCP resources for the MVP:
 * - Firestore Database
 * - Cloud Run (Backend)
 * - Cloud Storage (Frontend & Artifacts)
 * - Redis (Memorystore)
 * - IAM & Permissions
 */

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "firestore" {
  service = "firestore.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "run" {
  service = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "storage" {
  service = "storage.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "redis" {
  service = "redis.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "secretmanager" {
  service = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# Firestore Database
module "firestore" {
  source = "./modules/firestore"
  
  project_id = var.project_id
  region     = var.region
  
  depends_on = [google_project_service.firestore]
}

# Redis Instance
module "redis" {
  source = "./modules/redis"
  
  project_id = var.project_id
  region     = var.region
  environment = var.environment
  
  depends_on = [google_project_service.redis]
}

# Cloud Storage
module "storage" {
  source = "./modules/storage"
  
  project_id = var.project_id
  region     = var.region
  environment = var.environment
  
  depends_on = [google_project_service.storage]
}

# Cloud Run Backend
module "cloudrun" {
  source = "./modules/cloudrun"
  
  project_id = var.project_id
  region     = var.region
  environment = var.environment
  
  redis_host = module.redis.redis_host
  redis_port = module.redis.redis_port
  
  depends_on = [
    google_project_service.run,
    module.redis,
    module.firestore
  ]
}

# Service Account for Backend
resource "google_service_account" "backend" {
  account_id   = "bob-backend-${var.environment}"
  display_name = "BOB Backend Service Account"
  description  = "Service account for BOB backend application"
}

# IAM Roles for Backend Service Account
resource "google_project_iam_member" "backend_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_secretmanager" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend.email}"
}