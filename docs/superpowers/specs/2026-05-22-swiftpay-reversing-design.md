# Swiftpay — Reverse Engineering & Reconstruction Design

## Project Overview

- **Project Name:** Swiftpay
- **Goal:** Reverse engineer the Zoppix payment platform (app.zoppix.com.br) and reconstruct it as an independent system
- **Tech Stack:** C# .NET (backend), TypeScript (frontend)
- **Methodology:** Superpowers workflow (obra/superpowers) as absolute development flow
- **Skills:** dotnet/skills (relevant plugins) + custom Swiftpay domain skills
- **Status:** Design approved — entering implementation phase

## Phase 1: Interactive Playwright Session & Reverse Engineering

### 1.1 Session Setup

- Use Playwright with `channel: 'chrome'` to open the user's system-installed Google Chrome
- Script opens Chrome in non-headless (interactive) mode
- User logs in manually to Zoppix
- After login, session state (cookies, tokens, localStorage) is saved
- Browser stays open for exploration

### 1.2 Network Interception

- Playwright's `page.route()` intercepts all network requests
- Every request/response is logged with:
  - URL, HTTP method, request headers, request body
  - Response status, response headers, response body
  - Timestamp
- Data saved to `zoppix-data/api-logs/`

### 1.3 Data Capture Structure

```
swiftpay/
└── zoppix-data/
    ├── api-logs/            # Raw network captures
    ├── api-map.json         # Consolidated API endpoint map
    ├── data-models.json     # Inferred data models
    ├── screenshots/         # Page screenshots
    ├── html-snapshots/      # Full HTML snapshots
    └── session-state.json   # Authentication state
```

### 1.4 Systematic Exploration Plan

1. Dashboard / Home
2. Authentication & Profile
3. Payments / PIX / Billing
4. Customers / Recipients
5. Transactions / History
6. Webhooks / Integrations
7. Settings / Configuration
8. API Documentation (if public)

### 1.5 Analysis Output

After exploration, a secondary script (`analyze-api.mjs`) processes the raw logs into:

- Complete API endpoint catalog (method, path, params, request/response schemas)
- Data model definitions (entities, relationships, fields)
- Business flow diagrams (login, payment, webhook)
- Authentication mechanism documentation (JWT, OAuth, session)

## Phase 2: Swiftpay Architecture & Development

### 2.1 Development Stack

| Layer | Technology |
|-------|-----------|
| Backend | C# .NET 8+ (ASP.NET Core Web API) |
| Frontend | TypeScript (React / Next.js) |
| Database | PostgreSQL |
| ORM | Entity Framework Core |
| Auth | JWT / Identity |
| Container | Docker |

### 2.2 Skills Architecture

| Layer | Source | Contents |
|-------|--------|----------|
| Workflow | obra/superpowers | brainstorming, worktree, writing-plans, TDD, subagent-dev, code-review, finish |
| .NET Technical | dotnet/skills (dotnet, dotnet-aspnet, dotnet-data, dotnet-test) | ASP.NET patterns, EF Core, testing, project structure |
| Business Domain | Custom Swiftpay skills | Payment flows, PIX, split payments, compliance, architecture |

### 2.3 No-Ambiguity Rules

1. **Superpowers** owns the **workflow** — if superpowers has a skill for it, USE IT (brainstorming, TDD, code review, etc.)
2. **dotnet/skills** owns the **how** — .NET technical implementation patterns
3. **Custom skills** own the **what** — Swiftpay business rules and domain logic
4. No duplicated responsibilities across skill layers

## Phase 3: Implementation Order

1. ✅ Interactive Playwright session (current)
2. Capture and analyze all Zoppix APIs and flows
3. Design Swiftpay architecture based on findings
4. Create Swiftpay project structure (.NET + TS)
5. Implement core payment engine (PIX, boleto, card)
6. Implement authentication and user management
7. Implement API layer (REST)
8. Implement frontend
9. Implement webhooks and integrations
10. Testing and deployment

## Key Principles

- **TDD First** — all code written via RED-GREEN-REFACTOR
- **YAGNI** — only build what's needed based on reverse engineering findings
- **Evidence over claims** — verify with tests before declaring success
- **Clean Architecture** — domain-driven design for payment logic
- **Security-first** — financial platform requires auth, encryption, compliance
