# Swiftpay — Architecture & Development Design

## Project Overview

- **Project Name:** Swiftpay
- **Goal:** Payment platform (clone/alternative to Zoppix) — C# .NET backend + TypeScript frontend
- **Status:** Design approved — entering implementation phase
- **Methodology:** obra/superpowers (absolute workflow) + dotnet/skills (technical) + custom Swiftpay skills (domain)

---

## Section 0: AI Engineering Native Layer (Foundation)

### 0.1 Project Structure

```
swiftpay/
├── .kilo/
│   ├── skills/
│   │   ├── swiftpay-domain.md        # Business domain rules for payments
│   │   ├── swiftpay-architecture.md  # Clean Architecture .NET patterns
│   │   ├── swiftpay-testing.md       # TDD + xUnit conventions
│   │   └── swiftpay-workflow.md      # Development ordering rules
│   └── commands/                     # Custom Kilo commands (future)
├── AGENTS.md                          # Permanent AI context instructions
├── kilo.json                          # Project configuration
├── src/                               # Backend .NET 8
│   ├── Swiftpay.Domain/
│   ├── Swiftpay.Application/
│   ├── Swiftpay.Infrastructure/
│   └── Swiftpay.WebApi/
├── web/                               # Frontend Next.js
├── tests/
│   ├── Swiftpay.Domain.Tests/
│   ├── Swiftpay.Application.Tests/
│   ├── Swiftpay.Infrastructure.Tests/
│   └── Swiftpay.WebApi.Tests/
├── docker-compose.yml
└── docs/superpowers/
    ├── specs/
    └── plans/
```

### 0.2 Skills Architecture (No Ambiguity)

| Layer | Source | Responsibility |
|-------|--------|---------------|
| **Workflow** | obra/superpowers | brainstorming → worktree → writing-plans → TDD → subagent-dev → code-review → finish |
| **.NET Technical** | dotnet/skills (dotnet, dotnet-aspnet, dotnet-data, dotnet-test) | ASP.NET patterns, EF Core, test structure, project conventions |
| **Business Domain** | Custom `.kilo/skills/*` | Swiftpay payment rules, architecture patterns, testing conventions, workflow ordering |

### 0.3 Custom Skills Contents

**swiftpay-domain.md:** Money in cents (long), payment link rules, transaction status flow, fee calculations (cash_in 5% + R$1.80, cash_out R$10 flat, acquirer 3% + R$1.00), JWT auth with access (2h) + refresh tokens.

**swiftpay-architecture.md:** Clean Architecture layering (Domain → Application → Infrastructure → WebApi), Domain has zero external dependencies, Application relies only on Domain interfaces, Infrastructure implements Application interfaces, WebApi is the composition root.

**swiftpay-testing.md:** TDD mandatory (RED → GREEN → REFACTOR), xUnit + FluentAssertions, naming convention `Method_Should_ExpectedBehavior_When_Condition`, repository tests via EF Core InMemory, domain tests are pure no-mock.

**swiftpay-workflow.md:** Implementation order: Domain → Application → Infrastructure → WebApi → Frontend, each feature begins with domain tests, atomic commits per step, verify skills before implementing.

### 0.4 AGENTS.md

```markdown
# Swiftpay - AI Development Guide

## Stack
- Backend: C# .NET 8 (ASP.NET Core Web API)
- Frontend: TypeScript (Next.js)
- Database: PostgreSQL (EF Core + Npgsql)

## Architecture
- Clean Architecture: Domain → Application → Infrastructure → WebApi
- CQRS with MediatR
- JWT authentication (access + refresh tokens)
- Money in cents (long), never float

## Workflow (MANDATORY)
1. superpowers for the entire workflow
2. dotnet/skills for .NET technical patterns
3. .kilo/skills/ for Swiftpay business rules
4. TDD is mandatory
5. Domain layer: zero external dependencies
```

---

## Section 1: Backend Architecture

### 1.1 Solution Structure (Clean Architecture)

| Project | Dependencies | Responsibility |
|---------|-------------|----------------|
| Swiftpay.Domain | None | Entities, Value Objects, Enums, Interfaces |
| Swiftpay.Application | Domain | Use Cases (MediatR), DTOs, Repository Interfaces |
| Swiftpay.Infrastructure | Application | EF Core, JWT, Payment Gateway, Repositories |
| Swiftpay.WebApi | Infrastructure | Controllers, Middleware, Program.cs |

### 1.2 Domain Entities

```csharp
// AGGREGATES
public class User : IAggregateRoot     { Guid Id, Name, Email, PasswordHash, Role, CompanyId }
public class Company : IAggregateRoot   { Guid Id, Name, Document, KycStatus, Users, Acquirers }
public class PaymentLink : IAggregateRoot { Guid Id, Title, Description, Money Amount, Slug, ... }
public class Transaction : IAggregateRoot { Guid Id, Money Amount, Type, Status, Method, GatewayTxId }
public class Withdrawal : IAggregateRoot { Guid Id, Money Amount, Status, PixKey, PixKeyType }

// ENTITIES
public class Acquirer : IEntity          { Guid Id, Name, IsSelected, CompanyId }

// VALUE OBJECTS
public record Money(long AmountInCents);
public record Email(string Address);
public record Product(string Name, Money Price, int Quantity);
```

### 1.3 Application Layer (CQRS + MediatR)

```
Features/
├── Auth/
│   ├── Commands/LoginCommand.cs → JwtResponse
│   ├── Commands/RegisterCommand.cs → JwtResponse
│   └── Queries/GetCurrentUserQuery.cs → UserResponse
├── PaymentLinks/
│   ├── Commands/CreatePaymentLinkCommand.cs → PaymentLinkResponse
│   ├── Commands/DeactivatePaymentLinkCommand.cs
│   └── Queries/{GetPaymentLinkQuery, ListPaymentLinksQuery}.cs
└── Wallet/
    ├── Commands/RequestWithdrawalCommand.cs
    └── Queries/{GetBalanceQuery, ListTransactionsQuery}.cs
```

### 1.4 Infrastructure

- **ORM:** EF Core 8 + Npgsql (PostgreSQL)
- **Auth:** JWT with HMAC-SHA256, access_token (2h) + refresh_token (30d)
- **Validation:** FluentValidation
- **Mapping:** Manual mapping (extension methods)

### 1.5 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Register company + user |
| POST | `/api/v1/auth/login` | No | Login → JWT |
| POST | `/api/v1/auth/refresh` | No | Refresh access token |
| GET | `/api/v1/auth/me` | JWT | Current user + company |
| POST | `/api/v1/payment-links` | JWT | Create payment link |
| GET | `/api/v1/payment-links` | JWT | List payment links |
| GET | `/api/v1/payment-links/{id}` | JWT | Get payment link |
| DELETE | `/api/v1/payment-links/{id}` | JWT | Deactivate payment link |
| GET | `/api/v1/wallet/balance` | JWT | Get balance |
| GET | `/api/v1/wallet/transactions` | JWT | List transactions |
| POST | `/api/v1/wallet/withdrawals` | JWT | Request withdrawal |
| GET | `/api/v1/fees` | JWT | Fee structure |

---

## Section 2: Frontend Architecture (Future Phase)

- **Framework:** Next.js 14+ (TypeScript)
- **State:** React Query (server state) + Context (auth)
- **Styling:** Tailwind CSS + shadcn/ui
- **Pages:** Login, Dashboard, Payment Links CRUD, Wallet

---

## Section 3: Implementation Order

### Phase A: AI Engineering Foundation (NOW)
1. Create `.kilo/skills/` with 4 custom skills
2. Create `AGENTS.md` with full project context
3. Create `kilo.json` configuration

### Phase B: Backend Foundation
4. Scaffold .NET solution with Clean Architecture
5. Domain entities + Value Objects + tests
6. AppDbContext + EF Core migrations
7. JWT auth pipeline

### Phase C: Core Features
8. Payment Links CRUD + tests
9. Balance + Transactions + tests
10. Withdrawals + tests

### Phase D: Frontend (separate sub-project)
11. Next.js setup + login page
12. Dashboard + Payment Links UI
13. Wallet/Carteira UI

---

## Key Principles

- **YAGNI** — build only what's in scope for MVP
- **TDD** — RED → GREEN → REFACTOR on every feature
- **Domain purity** — zero external dependencies in Domain layer
- **Atomic commits** — one commit per implementation step
- **Security-first** — hash passwords (bcrypt), JWT with expiry, input validation

---

## Appendix: Zoppix Reverse Engineering Reference

### Auth
- `POST /v1/auth/login` → email + password → JWT (access_token + refresh_token)
- JWT claims: sub (user UUID), company_id, type=merchant

### Payment Links
- `POST /v1/payment-links` → create (all fields documented)
- `GET /v1/payment-links?limit=50&status=all` → list
- Slug is auto-generated (8 chars alphanumeric)
- Amount in cents (3000 = R$ 30,00)

### Fee Structure
- Cash in: 5% + R$ 1.80
- Cash out: R$ 10.00 flat
- Acquirer: 3% + R$ 1.00
