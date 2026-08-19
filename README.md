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

## End-to-end tests (Playwright + axe-core)

The `frontend/e2e/` folder holds a Playwright suite that runs against the
deployed EC2 instance by default (`QUIPP_E2E_URL` env var to override) and:

- covers all public routes (landing, login, signup, verify 404, passport 404),
- walks the full learner happy path (signup → onboarding → academy → course →
  10/10 quiz → credential → passport → public verify),
- runs an axe-core WCAG 2 A/AA scan on every screen and fails on any
  serious/critical violation,
- captures a full-page screenshot for each stop of the flow so visual
  regressions are easy to eyeball.

```
cd frontend
npx playwright install chromium   # first time only
npm run e2e                       # both desktop + mobile projects
npm run e2e:desktop               # desktop only (fastest smoke)
npm run e2e:report                # open the HTML report
```

Point the tests at another environment:

```
QUIPP_E2E_URL=http://localhost:8080 npm run e2e:desktop
```

Screenshots and traces land in `frontend/test-results/`; the HTML report
lives in `frontend/playwright-report/`.

## Milestones

Tracked in `.cursor/plans/quipp_mvp_mongodb_ec2_*.plan.md`.
