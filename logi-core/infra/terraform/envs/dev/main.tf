terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "vpc" {
  source     = "../../modules/vpc"
  project_id = var.project_id
  region     = var.region
}

module "gke" {
  source     = "../../modules/gke"
  project_id = var.project_id
  region     = var.region
  network    = module.vpc.network
  subnet     = module.vpc.subnet
}

module "cloudsql" {
  source     = "../../modules/cloudsql"
  project_id = var.project_id
  region     = var.region
}

module "pubsub" {
  source     = "../../modules/pubsub"
  project_id = var.project_id
}