# Swiftpay — AI Development Guide

## Stack
- **Backend:** C# .NET 9/10 (ASP.NET Core Web API / FastEndpoints)
- **Frontend:** TypeScript (Next.js 16, React 19)
- **Database:** PostgreSQL 16/17 (EF Core + Npgsql)
- **Cache:** Redis / Valkey 8
- **Messaging:** RabbitMQ + MassTransit
- **Real-Time:** SignalR
- **Background Jobs:** Hangfire
- **Storage:** S3-compatible (DigitalOcean Spaces)
- **Testing:** xUnit + FluentAssertions + Moq
- **CI/CD:** GitHub Actions (build, test, lint, CodeQL, security scan)
- **Container:** Docker Compose (PostgreSQL, Redis, RabbitMQ, API, Frontend)

## Architecture
- **Pattern:** Clean Architecture (Domain → Application → Infrastructure → WebApi)
- **CQRS:** MediatR (Commands for writes, Queries for reads)
- **Auth:** JWT (access_token 2h + refresh_token 30d)
- **Ledger:** Double-entry accounting (Account → LedgerTransaction → LedgerEntry)
- **Multi-Provider:** Strategy pattern for 9 acquirers
- **Money:** long in cents (R$ 30,00 = 3000), never float/double
- **Errors:** Result<T> pattern for expected failures, global middleware for exceptions
- **Responses:** All wrapped in ApiResponse<T> envelope

## Available Skills (Consult Before Implementing)
### Superpowers (workflow — invoke in order)
- `brainstorming` — refine requirements before coding
- `writing-plans` — create implementation plan
- `subagent-driven-development` — execute tasks
- `test-driven-development` — RED-GREEN-REFACTOR
- `requesting-code-review` — review before merge
- `finishing-a-development-branch` — complete work

### .kilo/skills/dotnet/ (technical — consult as needed)
- `dotnet-webapi` — ASP.NET Core Web API / FastEndpoints patterns
- `dotnet-data` — EF Core, migrations, queries
- `assertion-quality` — assertion patterns and quality
- `test-anti-patterns` — anti-patterns to avoid in tests

### Custom Core (.kilo/skills/ — ALWAYS read first)
- `swiftpay-domain` — business rules, payment flows, ledger entities
- `swiftpay-architecture` — Clean Architecture + messaging + frontends
- `swiftpay-testing` — TDD conventions, test structure
- `swiftpay-workflow` — development ordering, commit conventions

### Custom Domain (.kilo/skills/ — consult when implementing these features)
- `swiftpay-ledger` — double-entry accounting system (Account, LedgerTransaction, LedgerEntry)
- `swiftpay-payment-processing` — PIX/Boleto/Card payment flow
- `swiftpay-acquirer-integration` — multi-provider strategy + 9 acquirers
- `swiftpay-messaging` — MassTransit/RabbitMQ consumers + messages
- `swiftpay-webhooks` — outgoing webhook delivery + incoming acquirer webhooks
- `swiftpay-signalr` — real-time dashboard updates via SignalR

### Custom Frontend (.kilo/skills/ — consult when building UI)
- `swiftpay-admin-web` — Next.js admin dashboard (monocrom black/white)
- `swiftpay-checkout` — public checkout pages (PIX/Boleto/Card)

## Pre-Implementation Checklist (MANDATORY)
1. Read **.kilo/skills/** (*.md) domain rules and architecture
2. Read **AGENTS.md** for full project context
3. Read **docs/superpowers/specs/** for approved design
4. Read **docs/superpowers/plans/** for current implementation plan
5. Invoke **superpowers:brainstorming** if requirements are unclear
6. Invoke **superpowers:writing-plans** to create the implementation plan

## Development Workflow (MANDATORY)
```
1. brainstorming → refine requirements
2. writing-plans → create implementation plan
3. subagent-driven-development → execute each task
4. test-driven-development → RED-GREEN-REFACTOR
5. requesting-code-review → review before merge
6. finishing-a-development-branch → complete and merge
```

## Technology Rules (Non-negotiable)
- ❌ No AutoMapper (use manual mapping via extension methods)
- ❌ No magic strings for routes (use `nameof` or constants)
- ❌ No direct Domain references from WebApi (go through Application)
- ❌ No float/double for monetary values
- ✅ All API responses wrapped in `ApiResponse<T>`
- ✅ All commands validated by FluentValidation
- ✅ Exceptions handled by global middleware, never try/catch in controllers
- ✅ EF Core migrations via `dotnet ef migrations add`
- ✅ Tests written BEFORE implementation code (TDD)

## First Run Instructions
```bash
# Start PostgreSQL
docker compose up -d

# Apply migrations
cd src/Swiftpay.WebApi
dotnet ef database update

# Run API
dotnet run

# Run all tests
dotnet test
```

## Repository
- **GitHub:** https://github.com/matspectrum-ai/swiftpay
- **Branch strategy:** `main` (protected) ← PR from `feature/*` branches
- **CI:** All tests + lint run automatically on push/PR
- **Security:** Dependabot alerts + CodeQL scanning enabled
