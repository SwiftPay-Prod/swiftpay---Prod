# Swiftpay

Payment platform -- built with C# .NET 9 + Next.js 14.

## Tech Stack
- **Backend:** .NET 9 (ASP.NET Core Web API, Clean Architecture)
- **Frontend:** TypeScript, Next.js 14
- **Database:** PostgreSQL (EF Core + Npgsql)
- **Auth:** JWT (access + refresh tokens)
- **CI/CD:** GitHub Actions, Dependabot, CodeQL

## Project Structure
```
src/Swiftpay.Domain/          # Pure domain entities
src/Swiftpay.Application/     # Use cases, CQRS
src/Swiftpay.Infrastructure/  # EF Core, JWT, external services
src/Swiftpay.WebApi/          # API controllers
web/                          # Next.js frontend
```

## Getting Started
```bash
# Run database
docker compose up -d

# Run API
cd src/Swiftpay.WebApi && dotnet run

# Run frontend
cd web && npm install && npm run dev
```

## Development Workflow
This project uses the Superpowers methodology with AI-assisted development.
See AGENTS.md and .kilo/skills/ for full workflow instructions.
