# SwiftPay — Load Testing Plan for 100 Concurrent Users
Date: 2026-08-23
Status: Draft for execution

## 1. Objective
Validate that SwiftPay Web + Payment API can serve 100 concurrent users across the most critical user journeys without breaching latency, error-rate, or infrastructure limits.

## 2. What is already verified
- Frontend build compiles cleanly: 68/68 Next.js routes compile successfully with `bun run build` (2026-08-23).
- Typecheck passes: `npx tsc --noEmit` = 0 errors; changed files lint clean.
- Production smoke path verified end-to-end on live: signup, email confirmation, login gating, forgot-password intent, and reset flow all exercised successfully.
- Backend hardening present: ASP.NET Core rate limiting in prod, MerchantRateLimitPreProcessor, Polly circuit/retry/timeout on acquirer HTTP, Valkey session/cache, PostgreSQL pre-warmed connection pool, and Hangfire/background consumers registered.
- No known frontend/auth regressions from recent Revolut 10 / Ultra rollout or email-outbox migration.

## 2. What is still missing for 100% certainty
- Measured concurrent-load behavior on the actual production-like surface: real DB, real queue, real caches.
- Sustained concurrency on checkout creation and payment completion paths under load.
- SignalR and dashboard refresh behavior when many clients reconnect simultaneously.
- Apparent headroom before rate limits, DB pool, Kestrel limits, or frontend static/SSR saturation.

## 3. Tooling choice
Primary: `k6` (recommended).
Reasons:
- WebSocket support via `k6/experimental/websockets`, covering SignalR `/hubs/notifications` and `/hubs/payment-status`.
- HTTP scenario scripting fits authenticated panel API calls, anonymous checkout API calls, and webhook endpoints.
- Good CI integration; can run from this repo or a runner with outbound HTTPS.

Secondary/optional:
- `artillery` or `locust` only if the team already has them; otherwise `k6` keeps the repo simpler.
- Browser-level concurrency is NOT the primary evidence for 100 users; use API-level load first. Add a lightweight browser smoke only if UI regressions are suspected.

## 4. Load shape and success criteria

### 4.1 Load shape
- Total concurrent VUs: 100
- Duration: 15 minutes steady state after 2-minute ramp
- Iteration pattern: think time 1-5s per step to mimic real users
- Scenarios:
  1. Merchant dashboard + orders
  2. Checkout create/order + payment status polling
  3. Admin transactions list + payout list
  4. SignalR connection churn
  5. Auth/login + forgot-password

### 4.2 Success criteria
- HTTP API: p95 < 800ms for panel authenticated reads; p95 < 1.2s for payment-write paths.
- Error budget: < 1% HTTP 5xx; no auth loops/crashes from refresh under concurrency.
- WebSocket: < 2% connection failures; reconnect succeeds within 3s.
- Frontend server: no OOM or container restart; CPU/memory headroom visible in metrics.
- Backend: no DB connection pool exhaustion; no queue consumer lag spike; no rate-limit storms.

## 5. Target routes and journeys

### 5.1 Public/checkout
- `POST /v1/checkouts/calculate`
- `POST /v1/checkouts/create-order`
- `GET /v1/checkouts/{id}`
- `POST /v1/checkouts/reserve-order/{id}`
- `GET /v1/payment-links/start/{id}`
- Checkout runtime pages in `swiftpay-web-checkout` via load-route fetch:
  - `/{checkoutId}` checkout page data
  - `/sandbox/{checkoutId}` for dev preview checkout if needed

### 5.2 Merchant authenticated
- `GET /v1/session`
- `GET /v1/merchant/{id}/dashboard`
- `GET /v1/merchant/{id}/payments`
- `POST /v1/merchant/{id}/payment-links`
- `GET /v1/merchant/{id}/orders`
- `POST /v1/transactions` (pix create via internal/auth merchant context or credential)
- `GET /v1/merchant/{id}/balance`
- `POST /v1/merchant/{id}/cashouts`
- `GET /v1/merchant/{id}/transactions`

### 5.3 Admin authenticated
- `GET /v1/admin/dashboard`
- `GET /v1/admin/transactions`
- `GET /v1/admin/payouts`
- `GET /v1/admin/merchants`
- `GET /v1/admin/acquirers`
- `GET /v1/admin/platform-payouts`
- `GET /v1/admin/reconciliations`
- `GET /v1/admin/referrals`

### 5.4 Auth journeys
- `POST /v1/auth/signin`
- `POST /v1/auth/forgot-password`
- `POST /v1/auth/send-email-confirmation`
- `POST /v1/auth/resend-device-code`

### 5.5 Real-time
- `wss://.../hubs/notifications`
- `wss://.../hubs/payment-status`

## 6. Script structure

Create `k6/100-users.js` with stages:
- ramp-up: 0 -> 100 VUs over 2 minutes
- steady: 100 VUs for 15 minutes
- ramp-down: 100 -> 0 over 2 minutes

Use environment variables:
- `BASE_URL`
- `PANEL_BASE_URL`
- `API_USER_EMAIL`
- `API_USER_PASSWORD`
- `API_KEY`
- `MERCHANT_ID`
- `CHECKOUT_ID`
- `ACCESS_TOKEN` / `REFRESH_TOKEN` pre-seeded test accounts

Reuse:
- existing login flow to obtain access/refresh tokens in setup().
- preloaded merchant and checkout IDs from a seeded QA environment.

## 7. How to run it in this repo

### 7.1 Pre-requisites
- A QA/non-production environment with seeded merchants, products, and checkout templates.
- k6 installed locally or in CI.
- Outbound HTTPS allowed from load generator to SwiftPay APIs and checkout host.

### 7.2 Run command
```bash
k6 run \
  -e BASE_URL=https://api.qa.swiftpayment.info \
  -e PANEL_BASE_URL=https://panel.qa.swiftpayment.info \
  -e API_USER_EMAIL=loadtest-merchant@test.com \
  -e API_USER_PASSWORD=LoadTest123! \
  -e MERCHANT_ID=<seed-id> \
  -e CHECKOUT_ID=<seed-id> \
  k6/100-users.js
```

### 7.3 Where to store results
- Store k6 summary JSON as `artifacts/load/100-users-YYYYMMDD.json`.
- Attach screenshots of Grafana/container metrics from the same window.
- Record exact date, environment, seed state, and command in `TODOS.md` or a new `docs/load-results/` entry.

## 8. Observability during the run
- Container metrics: `docker stats` from production-like compose.
- API logs: filter `ApiLogs` by request latency and 5xx count.
- Queue lag: `rabbitmqctl list_queues name messages consumers` or management UI.
- Valkey: `INFO clients` and hit/miss counters if exposed.
- PostgreSQL: `pg_stat_activity`, `pg_stat_database`, and connection pool usage.

## 9. Go/no-go gate
- Green = all success criteria met on two consecutive runs.
- Yellow = rerun with doubled think time or lower checkout-write share.
- Red = stop, capture metrics/logs, and switch to diagnosis before any rollout decision.

## 10. Next concrete action
Execute the k6 script above against the QA environment and capture the first quantitative evidence for 100-user headroom; do not declare readiness before that run completes.
