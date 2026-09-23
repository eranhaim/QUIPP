# QUIPP

Professional identity platform for hospitality workers. See [frontend/QUIPP_Build_Prompt_v2.1.md](frontend/QUIPP_Build_Prompt_v2.1.md) for the product spec and [docs/END_USER_INTERACTION_CATALOGUE.md](docs/END_USER_INTERACTION_CATALOGUE.md) for release-ready end-user flows, fallbacks, escalation, and success signals.

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

## Vultr deployment

The production Compose stack serves the web application directly on port `8089`
and keeps the API internal to the Docker network. It does not modify Caddy or
require a domain.

1. Clone the repository to `/home/deploy/projects/quipp` and check out the
   release branch.
2. Create `/home/deploy/projects/quipp/backend/.env` from
   `backend/.env.example`. Use a production MongoDB URI, distinct 32+ character
   JWT secrets, `NODE_ENV=production`, `APP_URL=http://SERVER_IP:8089`, and
   `CORS_ORIGIN=http://SERVER_IP:8089`. Set `COOKIE_SECURE=false` for direct
   HTTP only; switch it to `true` only after terminating HTTPS upstream.
3. Keep optional provider variables blank until their accounts are configured.
   QUIPPY, Stripe checkout, S3 video operations, email delivery, and WhatsApp
   each fail closed with a user-facing unavailable state when their respective
   credentials are absent.
4. Run:

```sh
cd /home/deploy/projects/quipp/infra
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:8089/api/health
```

The `web` service waits for the API health check before starting. A healthy
direct deployment is reachable at `http://SERVER_IP:8089`.

## Milestones

Tracked in `.cursor/plans/quipp_mvp_mongodb_ec2_*.plan.md`.
