# Swiftpay Development Workflow

## Sub-skills (MANDATORY — invoke these as needed)
- **superpowers:brainstorming** — when starting new features or changes
- **superpowers:writing-plans** — before any implementation, create the plan
- **superpowers:test-driven-development** — during all code writing
- **superpowers:subagent-driven-development** — for task execution
- **superpowers:requesting-code-review** — before merging changes
- **superpowers:finishing-a-development-branch** — when completing work
- **dotnet-webapi** (.kilo/skills/dotnet/) — ASP.NET Core Web API patterns
- **dotnet-data** (.kilo/skills/dotnet/) — EF Core query optimization
- **assertion-quality** (.kilo/skills/dotnet/) — test assertion patterns
- **test-anti-patterns** (.kilo/skills/dotnet/) — common test mistakes to avoid
- **swiftpay-ledger** (.kilo/skills/) — double-entry accounting system
- **swiftpay-payment-processing** (.kilo/skills/) — PIX/Boleto/Card payment flow
- **swiftpay-acquirer-integration** (.kilo/skills/) — multi-provider strategy pattern
- **swiftpay-messaging** (.kilo/skills/) — MassTransit/RabbitMQ consumers
- **swiftpay-webhooks** (.kilo/skills/) — outgoing/incoming webhook system
- **swiftpay-signalr** (.kilo/skills/) — real-time updates via SignalR
- **swiftpay-admin-web** (.kilo/skills/) — Next.js admin dashboard
- **swiftpay-checkout** (.kilo/skills/) — public checkout pages

## Global Workflow (ALWAYS)
```
1. BRAINSTORMING ──> design doc ──> user approves
2. WRITING-PLANS ──> implementation plan ──> user approves
3. SUBAGENT-DEV ──> TDD per task ──> code review ──> merge
4. FINISHING-BRANCH ──> cleanup
```

## Implementation Order (MANDATORY — per feature)
```
DOMAIN → APPLICATION → INFRASTRUCTURE → MESSAGING → WEBAPI → FRONTEND
```

Each layer must be completed and tested before moving to the next.

## Per-Feature Step-by-Step
1. Read **AGENTS.md** + **.kilo/skills/** for context
2. Invoke **superpowers:brainstorming** if requirements are unclear
3. Invoke **superpowers:writing-plans** to create the task plan
4. **Domain**: Write tests → implement entities → commit
5. **Application**: Write tests → implement use cases → commit
6. **Infrastructure**: Write tests → implement repos/services → commit
7. **WebApi**: Write tests → implement controllers → commit
8. Invoke **superpowers:requesting-code-review** before merge
9. Merge branch → Invoke **superpowers:finishing-a-development-branch**

## Branch Strategy
```
main ── protect this branch (no direct commits)
  │
  └── feature/{feature-name} ── work here
       │
       └── Pull Request → code review → merge to main
```

Branch naming:
- `feature/create-payment-link` — new feature
- `fix/withdrawal-validation` — bug fix
- `refactor/domain-entities` — refactoring
- `docs/api-documentation` — documentation

Each feature branch implements ONE feature from the plan. No mega-branches.

## Code Review Checklist (Before PR)
Before opening a PR, verify:
- [ ] All tests pass (`dotnet test`)
- [ ] No build warnings (`dotnet build --no-restore`)
- [ ] TDD followed (test exists before implementation)
- [ ] Domain has zero external dependencies
- [ ] No AutoMapper used (manual mapping only)
- [ ] ApiResponse envelope wrapped all endpoints
- [ ] FluentValidation rules exist for all Commands
- [ ] No hardcoded strings (use constants or nameof)
- [ ] Error handling via Result pattern (not exceptions for expected cases)
- [ ] Committed atomically (one commit per logical change)

## Commit Convention
```
type(scope): short description (max 72 chars)

type: feat | fix | refactor | test | docs | chore
scope: domain | application | infra | webapi | frontend | ci

Examples:
feat(domain): add PaymentLink entity
test(application): add CreatePaymentLink validation tests
feat(infra): add Npgsql EF Core configuration
fix(webapi): return 404 when payment link not found
```

## Integration with Reverse Engineering Data
- Zoppix reference data is in `tools/reversing/zoppix-data/`
- Consult API logs and data models when implementing similar endpoints
- Design docs in `docs/superpowers/specs/` capture the approved architecture

## Frontend Phase (separate workflow when reached)
- Framework: Next.js 14+ (TypeScript)
- Run `cd web && npm create next-app@latest . --typescript` to scaffold
- Frontend follows its own TDD cycle (Jest + React Testing Library)
