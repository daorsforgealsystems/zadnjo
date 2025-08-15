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

resource "google_pubsub_topic" "orders" {
  name = "orders"
}

resource "google_pubsub_topic" "routes" {
  name = "routes"
}

resource "google_pubsub_topic" "tracking" {
  name = "tracking"
}

output "topics" { value = [google_pubsub_topic.orders.name, google_pubsub_topic.routes.name, google_pubsub_topic.tracking.name] }