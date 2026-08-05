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

## 2026-08-05 — Checkout sem estilo ("não é nada"): basePath + nginx + next/image

- **Bug 2 (relatado pelo CEO junto com o erro do link)**: página do link renderizava SEM nenhum
  CSS/JS — visual branco, conteúdo espremido no canto sup-esq ("não tem nada de checkout").
- **Root cause**: o checkout é servido pelo nginx sob `/checkout/` (→ 5002), mas o Next.js gerava
  URLs de assets raiz (`/_next/static/...`) → nginx roteava para o app web principal (3001) → 404.
  Sem CSS (folha principal 404) e sem JS (todos os chunks 404) → sem hydration, sem tema, página
  crua. Log nginx confirmou os 404s.
- **Fixes (`a1eae91` + `a80eec1`, deployados; nginx ajustado na VPS)**:
  1. `next.config.ts`: `basePath: '/checkout'` — assets/router/`next/image` prefixados.
  2. nginx (`/etc/nginx/sites-available/swift-pay.top`): `proxy_pass http://127.0.0.1:5002/` →
     `proxy_pass http://127.0.0.1:5002` (sem barra final). O standalone com basePath 404a
     `/_next/...` sem prefixo; agora o upstream recebe o caminho completo `/checkout/_next/...`
     (200). **Nota: mudança somente na VPS, sem cópia no repo.**
  3. `unoptimized` no `next/image` do logo (e facebook pixel): otimizador retorna 400
     "received null" sob basePath (bug do Next standalone); logos de merchant já usavam
     `unoptimized`.
- **Verificado em prod**: tema dark aplicado (`data-theme=dark`), card centralizado (512px,
  x=528/1568), logo 512x512 ok, **zero recursos com erro** no browser; `scrollHeight=780`.
