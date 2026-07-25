# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-25)

**Core value:** Processar pagamentos com rapidez e confiabilidade
**Current focus:** Correção de logos e finalização da Fase 9 (MagicPay)

## Current Phase

**Phase 9** — Integração MagicPay como adquirente único

### Status

| Wave | Status | Description |
|------|--------|-------------|
| 9.1 | ✅ Done | Cliente HTTP MagicPay (5 endpoints) |
| 9.2 | ✅ Done | Models de requisição/resposta/webhook |
| 9.3 | ✅ Done | MagicPayService (PIX + Saque via IAcquirerService) |
| 9.4 | ✅ Done | Webhook endpoint com validação HMAC |
| 9.5 | ✅ Done | Cartão de Crédito e Boleto via MagicPay |
| 9.6 | ✅ Done | Seed, DI, registros, build |
| 9.7 | ✅ Done | Deploy produção |
| 9.8 | ✅ Done | Correção de logos (safefy → swiftpay) |

### Blockers

- (none)

## Memory

### Active Decisions

- MagicPay é adquirente único
- API Key nos DefaultCredentials do seed
- Webhook HMAC usa header X-Signature

### Gotchas

- Logos horizontais (`swiftpay-horizontal-dark.png`, etc.) foram apenas renomeados de safefy-* mas conteúdo da imagem ainda é Safefy
- Docker build cache não invalidou no primeiro deploy (precisa rebuild manual)
- `AcquirerClientResponse<T>` requer `using swiftpay_api_payment.Clients;`

---

*Last updated: 2026-07-25*
