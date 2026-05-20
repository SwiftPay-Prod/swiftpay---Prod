---
description: "Use when working with internal DEV reprocessing endpoints, health checks, startup behavior, and log database migration boundaries."
applyTo: 'Endpoints/Internal/**/*.cs, Program.cs, Extensions/**/*.cs'
---

## Reprocessamento DEV (Interno)

Quando a adquirente não permite reenvio de webhook e o registro real ficou inconsistente (`Pending`, `Processing`, `Failed`), existem endpoints internos de recuperação para reaplicar o fluxo:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /v1/internal/transactions/{transactionId}/dev/reprocess-completed` | POST | Reprocessa transação via fluxo de webhook com `targetStatus` (`Completed` ou `Failed`) |
| `POST /v1/internal/cashouts/{cashoutId}/dev/reprocess-completed` | POST | Reprocessa saque via fluxo de webhook com `targetStatus` (`Completed`, `Failed` ou `Rejected`) |
| `POST /v1/internal/acquirers/webhooks/{webhookLogId}/dev/reprocess` | POST | Reprocessa o payload bruto salvo em `AcquirerWebhookLogs` para reaplicar o fluxo de webhook da adquirente |

Regras:
- Em status que exigem rearme financeiro, deve recompor/bloquear saldo antes do reprocessamento
- Deve reutilizar os serviços de processamento existentes para preservar ledger/notificação/webhook

---

## Health Checks e Startup

Endpoints de saúde:

```
GET /health/live
GET /health/ready
GET /health
```

Comportamento:
- `/health/live` valida apenas se a API está de pé
- `/health/ready` e `/health` validam dependências registradas no health check

Startup não bloqueante:
- A API deve iniciar sem bloquear aguardando conexões/migrações
- Warmup de conexão/migração deve executar em `BackgroundService` com retry
- Em deploy, usar `/health/live` para startup probe e `/health/ready` para readiness probe

## Migrations (LogDbContext)

- O `LogDbContext` pertence ao `safefy-api-core`, mas as migrations do banco de logs vivem no projeto `safefy-api`
- O `safefy-api-payment` nao deve criar schema nem executar migrations do banco de logs
- No startup do payment, validar apenas conectividade com o banco de logs