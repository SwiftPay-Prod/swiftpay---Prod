# Swiftpay - AI Development Guide

## Stack
- **Backend:** C# .NET 9 (ASP.NET Core Web API)
- **Frontend:** TypeScript (Next.js 14+)
- **Database:** PostgreSQL (EF Core + Npgsql)
- **Testing:** xUnit + FluentAssertions + Moq
- **CI/CD:** GitHub Actions

## Architecture
- Clean Architecture: Domain -> Application -> Infrastructure -> WebApi
- CQRS with MediatR
- JWT authentication (access_token 2h + refresh_token 30d)
- Money in cents (long), never float/double

## Repository
- GitHub: https://github.com/matspectrum-ai/swiftpay
- Branch strategy: main=protected, feature branches with PRs
- First commit from AI setup, then TDD-driven development

## Pre-Implementation Checklist (ALWAYS DO THIS)
1. Read .kilo/skills/ for domain rules and architecture
2. Read AGENTS.md for project context
3. Read docs/superpowers/specs/ for approved design
4. Read docs/superpowers/plans/ for current implementation plan

## Workflow (MANDATORY)
1. superpowers:brainstorming -> refine requirements
2. superpowers:writing-plans -> create implementation plan
3. superpowers:test-driven-development -> RED-GREEN-REFACTOR
4. superpowers:requesting-code-review -> review before merge
5. superpowers:finishing-a-development-branch -> complete task

## Technology Rules
- No AutoMapper (use manual mapping)
- No magic strings for routes (use nameof)
- All API responses wrapped in ApiResponse<T>
- Exceptions handled by global middleware
- EF Core migrations managed via dotnet ef
