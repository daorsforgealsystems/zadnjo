terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

variable "project_id" { type = string }
variable "region"     { type = string }

resource "google_sql_database_instance" "postgres" {
  name             = "logi-core-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro"
    ip_configuration {
      ipv4_enabled = true
    }
  }
}

resource "google_sql_database" "app" {
  name     = "logi_core_db"
  instance = google_sql_database_instance.postgres.name
}

output "instance_connection_name" { value = google_sql_database_instance.postgres.connection_name }