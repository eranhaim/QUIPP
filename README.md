# QUIPP

Professional identity platform for hospitality workers. See [frontend/QUIPP_Build_Prompt_v2.1.md](frontend/QUIPP_Build_Prompt_v2.1.md) for the product spec.

## Repo layout

```
frontend/   Vite + React + TypeScript app (originally from Lovable)
backend/    Node.js + Express + TypeScript API, MongoDB via Mongoose
infra/      Docker Compose + nginx config for EC2 deploy
```

## Local dev

1. Create a free MongoDB Atlas M0 cluster and copy the connection string.
2. `cd backend && cp .env.example .env` — paste the connection string into `MONGODB_URI`.
3. `cd backend && npm install && npm run dev` — starts the API on `http://localhost:4000`.
4. `cd frontend && npm install && npm run dev` — starts the app on `http://localhost:8080`.

Health check: `curl http://localhost:4000/api/health` should return `{"status":"ok","db":"connected"}`.

## Milestones

Tracked in `.cursor/plans/quipp_mvp_mongodb_ec2_*.plan.md`.
