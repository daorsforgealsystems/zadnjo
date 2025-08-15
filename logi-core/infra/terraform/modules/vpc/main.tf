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

resource "google_compute_network" "vpc" {
  name                    = "logi-core-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "logi-core-subnet"
  ip_cidr_range = "10.10.0.0/16"
  region        = var.region
  network       = google_compute_network.vpc.id
}

output "network" { value = google_compute_network.vpc.name }
output "subnet"  { value = google_compute_subnetwork.subnet.name }