# Swiftpay

Payment gateway orchestrator — multi-provider PIX/Boleto/Card processing.

Built with C# .NET 9 (Clean Architecture + CQRS), Next.js 16, PostgreSQL, Redis, RabbitMQ.

## Architecture

```
src/
├── Swiftpay.Api.Core/      ← Shared: Domain, Ledger, Messaging, Services
├── Swiftpay.Api.Gestao/    ← API de Gestão (Auth, Admin)
└── Swiftpay.Api.Payment/   ← API de Pagamento (PIX, Transações, Webhooks)
```

## Quick Start

```bash
# Start infrastructure
docker compose up -d

# Run APIs
dotnet run --project src/Swiftpay.Api.Gestao    # :5001
dotnet run --project src/Swiftpay.Api.Payment   # :5002

# Tests
dotnet test
```

## Development

This project uses the **Superpowers** AI-assisted development workflow.
See `AGENTS.md` and `.kilo/skills/` for full instructions.
