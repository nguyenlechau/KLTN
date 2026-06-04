# KLTN — Centralized Physical Advertising Asset Management System

A full-stack enterprise system for managing the complete lifecycle of physical advertising campaigns across multiple retail branches.

## What It Does

- **Registration workflow** — Branch staff create ad campaign requests that flow through multi-step approval (INPUTTER → APPROVER → BRAND → BRAND_MANAGER)
- **Master data management** — Manage ad content, locations, channels, categories, and physical items
- **Deployment tracking** — Photo upload and final acceptance of deployed ads
- **Role-based access control** — 6 user roles with granular permissions

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, Vite, runs on port 5173 |
| Backend | Node.js + TypeScript, Express, runs on port 4000 |
| Database | PostgreSQL (11 tables) |
| Auth | JWT |
| Container | Docker + Docker Compose |

## Project Structure

```
KLTN/
├── frontend/        # React app
├── backend/         # Express API + migrations
│   ├── src/         # TypeScript source
│   └── migrations/  # SQL migration files
├── docker-compose.yml
└── README.md
```

## Workflow States

| Step | State | Role |
|------|-------|------|
| 1 | DRAFT | INPUTTER / INPUTTER_HO |
| 2 | SUPERVISOR_REVIEW | APPROVER / APPROVER_HO |
| 3 | BRAND_ACCEPTANCE | BRAND |
| 4 | BRAND_MANAGER_APPROVAL | BRAND_MANAGER |
| 5 | APPROVED / REJECTED | — |
