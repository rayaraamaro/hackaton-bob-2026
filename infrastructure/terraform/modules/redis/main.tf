/**
 * Redis Module
 * 
 * Creates Redis instance using Memorystore
 */

resource "google_redis_instance" "cache" {
  name           = "bob-redis-${var.environment}"
  tier           = "BASIC"
  memory_size_gb = 1
  
  region = var.region
  
  redis_version     = "REDIS_6_X"
  display_name      = "BOB Redis Cache"
  reserved_ip_range = "10.0.0.0/29"
  
  auth_enabled = false
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}