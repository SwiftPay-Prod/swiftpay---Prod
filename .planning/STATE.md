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

## 2026-08-05 — Payment link error fix (env var rename)

- **Bug (pergunta do CEO "oque diabos é isso ao gerar um link e testar")**: checkout SSR renderizava
  "Algo deu errado / Nao foi possivel conectar ao servidor" em todo payment link.
- **Root cause**: rename safefy→swiftpay (commit `02e608e`) atualizou `clients/client.ts` para ler
  `INTERNAL_SWIFTPAY_API_PAYMENT_URL`, mas `docker-compose.production.yaml` continuava setando
  `INTERNAL_SAFEFY_API_PAYMENT_URL`. Em runtime o baseURL do axios (server-side) ficava `undefined` →
  o fetch SSR a `/v1/payment-links/{token}` lançava exceção → catch → `api_error` → tela de erro.
  GET direto da API (`/api/payment/v1/payment-links/...`) sempre funcionou (200) — por isso só o
  checkout quebrava.
- **Fix (`5c33364`, deployado)**: compose renomeado para `INTERNAL_SWIFTPAY_API_PAYMENT_URL` /
  `NEXT_PUBLIC_SWIFTPAY_API_PAYMENT_URL` (+ `.bak`); Dockerfile do checkout ganhou
  `ARG/ENV NEXT_PUBLIC_SWIFTPAY_API_PAYMENT_URL` + `build.args` no compose (inlining no bundle client,
  hero-pro). `.env` local do checkout corrigido (gitignored).
- **Verificado em prod**: container com envs corretos; página `https://swift-pay.top/checkout/pay_...`
  renderiza R$ 56,00 + PIX sem strings de erro; `NEXT_PUBLIC` inlined em `.next/static`.
