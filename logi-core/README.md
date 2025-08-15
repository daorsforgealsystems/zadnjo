# LogiCore Monorepo

Monorepo scaffold for the LogiCore logistics platform.

- API Gateway (Node.js + Express)
- Core services: User (NestJS stub), Inventory (FastAPI stub)
- Frontends: Admin (Next.js - placeholder), Customer (React - placeholder)
- Infra: K8s manifests (base + dev overlay), Terraform skeleton for GCP (GKE, Cloud SQL, Pub/Sub)
- DB: Raw SQL migrations

## Workspaces

This repo uses npm workspaces:
- apps/*
- services/*

## Quick start (dev - placeholders)

1. Ensure Node 20+ and Python 3.11+ installed.
2. API Gateway
   - cd apps/api-gateway
   - npm install
   - npm run dev
3. User Service (NestJS stub)
   - cd services/user-service
   - npm install
   - npm run dev
4. Inventory Service (FastAPI)
   - cd services/inventory-service
   - python -m venv .venv && .venv/Scripts/activate (Windows)
   - pip install -r requirements.txt
   - uvicorn main:app --reload --port 8000

Kubernetes and Terraform content are scaffolds; fill in images, variables, and state backend before use.