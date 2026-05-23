/**
 * Firestore Module
 * 
 * Creates Firestore database in Native mode
 */

resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  concurrency_mode = "OPTIMISTIC"
  app_engine_integration_mode = "DISABLED"
}

# Create indexes for efficient queries
resource "google_firestore_index" "projects_user_status" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "projects"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "tasks_project_order" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "tasks"

  fields {
    field_path = "project_id"
    order      = "ASCENDING"
  }

  fields {
    field_path = "execution_order"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "token_usage_project_time" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "tokenUsage"

  fields {
    field_path = "project_id"
    order      = "ASCENDING"
  }

  fields {
    field_path = "timestamp"
    order      = "DESCENDING"
  }
}