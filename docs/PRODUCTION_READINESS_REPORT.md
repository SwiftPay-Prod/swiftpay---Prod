# SwiftPay — Production Readiness Report

> **Data:** 2026-08-09
> **Escopo:** auditoria completa do sistema e infraestrutura, sem aplicação de alterações.
> **Fontes:** `AGENTS.md`, `CLAUDE.md`, `TODOS.md`, `docs/architecture/*`, `docs/decisions/*`, `swiftpay-api/docker-compose.production.yaml`, `swiftpay-api/Program.cs`, `swiftpay-api-payment/Program.cs`, `.github/workflows/deploy.yml`, `infra/nginx/swiftpayment.info.conf`, `scripts/backup.sh`, `scripts/restore.sh`.

---

## 1) Resumo executivo

**Veredito: NÃO está pronto para produção em escala.**

O SwiftPay tem uma base arquitetural sólida, mas existem **bloqueios operacionais e riscos** que impedem o go-live seguro. Os principais problemas concentram-se em: composição de produção incompleta, plataforma de email em transição, deploy/testes automatizados insuficientes e configurações que ainda precisam de ajustes.

---

## 2) Pontos fortes confirmados

- Arquitetura bem documentada (5 módulos, mapas de backend/frontend/webhooks/providers/deployment).
- Segurança de autenticação e webhooks:
  - JWT HMAC-SHA512
  - Internal API key
  - Webhook auth com múltiplos modos (`None`, `Token`, `Ip`, `TokenAndIp`, `HmacSha256`)
- Resiliência HTTP/Polly:
  - Circuit breaker
  - Retry com backoff e jitter
  - Timeouts
- Ledger imutável + idempotência:
  - contabilidade de dupla entrada
  - lock otimista por `ExecuteUpdateAsync`
  - proteção contra double spend/webhook atrasado
- Infraestrutura Docker com healthchecks, dependências e volumes.
- Nginx com HTTPS, HSTS e headers de segurança.
- Testes unitários e de integração relevantes para foundations, mapeamento de status e fluxos básicos.

---

## 3) Bloqueios críticos

| # | Item | Evidência |
|---|------|-----------|
| 1 | RabbitMQ, Valkey e Storage/MinIO ausentes no compose de produção | `swiftpay-api/docker-compose.production.yaml` |
| 2 | Plataforma de email Firebase/Resend não ativada | `EmailPlatformSettings.Enabled = false`; Firestore não criado |
| 3 | Testes existentes não executados/validados | `TODOS.md` marca várias waves como não executadas |
| 4 | Deploy automatizado incompleto | Apenas 1 workflow para `swiftpay-api-core` NuGet; APIs e frontends sem CI/CD completo |

---

## 4) Riscos médios-altos

| # | Item | Evidência | Severidade |
|---|------|-----------|-----------|
| 5 | Rota `/docs` no nginx aponta para frontend | `infra/nginx/swiftpayment.info.conf` | Alta |
| 6 | MiniProfiler habilitado em produção | `swiftpay-api/Program.cs`, `swiftpay-api-payment/Program.cs` | Média-alta |
| 7 | CORS produção inclui origem `.vercel.app` | `swiftpay-api/Extensions/CorsExtensions.cs` | Média |
| 8 | Deploy manual com senha via ambiente | `deploy.sh`, `.github/workflows/deploy.yml` | Alta |
| 9 | Sem monitoramento/alertas configurados | Ausência de configuração de métricas/alertas | Alta |
| 10 | Backup sem automação/validação | `scripts/backup.sh`, `scripts/restore.sh` | Alta |
| 11 | Repo com artefatos obsoletos/working tree sujo | Backups antigos, branch sujo | Média-alta |

---

## 5) Documentos de suporte

- `docs/PRODUCTION_READINESS_PLAN.md` — plano faseado de correção
- `docs/PRODUCTION_READINESS_AUDIT_PHASE1.md` — auditoria detalhada da Fase 1

## 6) Próxima ação recomendada

1. Aprovar o plano de readiness.
2. Executar a **Fase 1** primeiro:
   - definir infraestrutura de produção completa
   - corrigir `/docs`
   - remover MiniProfiler de prod
   - revisar CORS
   - documentar `start.sh` como dev-only
3. Só então prosseguir para **Fase 2** (email platform), **Fase 3** (deploy automatizado), **Fase 4** (testes automatizados) e **Fase 5** (observabilidade).

> Estado atual em 2026-08-09: Fase 1 foi executada nos itens acima; bloqueio remanescente passa a ser a validação/ativação da plataforma de email Firebase/Resend.

---

## 7) Conclusão

O sistema **não está completo para produção em escala** no estado atual.  
A fundação é boa, mas faltam **capacidades operacionais imprescindíveis**: composição de produção completa, plataforma de email ativa, pipeline de deploy/teste automatizado e validação executada da suíte de testes.

Este relatório deve ser usado como base para priorizar as fases de correção antes de qualquer go-live.
