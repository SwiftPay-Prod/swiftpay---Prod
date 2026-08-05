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

## 2026-08-05 — "Nenhum adquirente configurado" ao clicar em Pagar (PIX)

- **Bug 3 (relatado pelo CEO)**: ao testar o link de pagamento e clicar em "Pagar", a API retornava
  "Nenhum adquirente configurado. Entre em contato com o suporte." (400, `no_acquirer_configured`).
- **Root cause**: o merchant do link (`019fac5d` "SwiftPay", admin-as-merchant, Status Active)
  **não tinha nenhuma linha em `MerchantAcquirers`** — os 3 vínculos existentes eram de outros
  merchants (Gustavo→MagicPay, "vendas..."→MagicPay, Mateus→AkkadPag). `GetMerchantAcquirerAsync`
  retorna null sem vínculo ativo → erro.
- **Fix (dados, sem deploy)**: `POST /v1/admin/merchant/{id}/acquirer` (endpoint admin real, com
  cookie JWT do admin) → MerchantAcquirer `019fcf69-cdf1-7abf-a8c1-bcd88ea79e0b`: AkkadPag
  `...0211`, `IsActive=true`, `IsDefault=true`, `ActivatedAt=now`, credenciais mescladas das
  `DefaultCredentials` da adquirente (publicKey/secretKey reais), fees copiadas da adquirente
  (PixInFeePercentage=1). `ProviderCategory=Acquirer` → submerchant provisioning é no-op (sem KYC).
- **Verificado em prod**: `POST /v1/payment-links/{token}/start` method=Pix → 200, cobrança Pending
  com `pix.txId` + QR Code EMV real da AkkadPag. Browser: Pagar → tela "Aguardando pagamento",
  "Código PIX Copia e Cola: 00020101021226...", countdown "Expira em 40:12", zero recursos falhando.
- Nota: `IsPixEnabled()` resolve `PixEnabled ?? Acquirer.PixEnabled` — AkkadPag tem
  `PixEnabled=true` na adquirente; Boleto/CreditCard `false` (PIX-only mantido).

## 2026-08-05 — Contraste do tema dark (link de pagamento) + domínio checkout.swiftpay.com.br

### Problema 1 — Textos escuros sobre fundo escuro (link de pagamento)
- CEO: "vários textos escuros sendo que o fundo é escuro". Medição no browser: footer
  "Pagamento processado com segurança / SSL / Seguro / Protegido" a 2.60:1, descrição
  do produto a 2.57:1, "Código expirado" a 2.63:1 (mínimo WCAG AA = 4.5:1).
- Causa: variáveis do tema dark em `swiftpay-web-checkout/templates/hero-pro/theme.css`
  muito escuras (`--hero-text-subtle: oklch(68%)`, `--hero-text-muted: 78%`,
  `--hero-text-danger: 65.32%`) + `text-red-400` hardcoded no label "Código expirado".
- Fix (commits `d2a4166`, `61d336a`): `--hero-text-subtle` 68→80%, `--hero-text-muted`
  78→84%, `--hero-text-placeholder` 68→75%, `--hero-text-danger` 65.32→76%,
  `--hero-disabled-text` 55.17→65% (blocos `:root` e `[data-theme='dark']`; tema light
  intocado). Label "Código expirado" → `hero-text-danger`.
- Verificado em prod: footer 2.60→5.48:1, descrição 2.57→5.43:1, "Produto" 7.10,
  "Aguardando pagamento" 7.10. Deploy imagem `04621ec40ae1` (healthy).

### Problema 2 — checkout.swiftpay.com.br "off"
- Causa raiz: **NXDOMAIN** — não existe registro DNS para `checkout.swiftpay.com.br`
  (verificado com `host`/`getent` na VPS). O `CheckoutBaseUrl` do appsettings é
  `https://checkout.swiftpay.com.br` → URL do checkout aponta para domínio inexistente.
- Checkout "Gusta" (`yd4ohjuzzv`, merchant 019fac5d) está Active/Production no banco,
  template `modern-checkout` (019fcf4c) ativo; renderiza OK em
  `https://swift-pay.top/checkout/yd4ohjuzzv` (200, "Checkout yd4ohjuzzv").
- App roda com `basePath: '/checkout'` → nginx do domínio raiz precisa reescrever
  `/<shortId>` → `/checkout/<shortId>` (assets `/checkout/_next/...` passam direto).
- Pronto na VPS (testado via Host header, HTTP 200 em rota e assets):
  `/etc/nginx/sites-available/checkout.swiftpay.com.br` (sites-enabled, nginx -t OK):
  `location /` com `rewrite ^/(.*)$ /checkout/$1 break;` + `location /checkout/` passthrough,
  ambos → 127.0.0.1:5002. Bloco 443 comentado (cert ainda não existe).
- **PENDENTE (externo)**: criar registro DNS `checkout.swiftpay.com.br A 169.58.70.201`
  no provedor do domínio .com.br (CEO/registrar). Depois: `certbot certonly --nginx -d
  checkout.swiftpay.com.br` e ativar o bloco 443.
- Arquivo nginx a versionar no repo: `deploy/nginx/checkout.swiftpay.com.br` (TODO).

## 2026-08-05 — Domínio do checkout resolvido: usar swift-pay.top (próprio)

- **Esclarecimento do CEO**: o domínio real é `swift-pay.top`. `swiftpay.com.br` NÃO é
  do CEO — é de terceiros (RDAP: registrado 2025-08-27, expira 2026-08-27, DNS Cloudflare,
  aponta para 72.60.57.206). Não comprar nada.
- `CheckoutBaseUrl` no appsettings apontava para `https://checkout.swiftpay.com.br`
  (domínio de terceiros, NXDOMAIN no subdomínio) → URL de checkout quebrada por config.
- Fix (commit `ab708b8`): `PlatformSettings__CheckoutBaseUrl: https://swift-pay.top/checkout`
  adicionado ao docker-compose.production.yaml (override por env — sem rebuild C#,
  só `up -d --force-recreate swiftpayapi`), appsettings.json e fallback do painel
  (`swiftpay-web/src/utils/checkout.ts`) atualizados.
- Verificado: env no container = `PlatformSettings__CheckoutBaseUrl=https://swift-pay.top/checkout`;
  URL final do checkout Gusta = `https://swift-pay.top/checkout/yd4ohjuzzv` (200, renderiza);
  link de pagamento segue 200. Containers healthy.
- **Pré-pronto na VPS** (para quando quiser domínio dedicado): `/etc/nginx/sites-available/
  checkout.swiftpay.com.br` com rewrite `/<shortId>` → `/checkout/<shortId>` (testado via
  Host header). Para `checkout.swift-pay.top` basta: registro A no painel SD
  (ns1/ns2.sdparking.com.br) → `certbot certonly --nginx -d checkout.swift-pay.top` →
  trocar server_name + CheckoutBaseUrl. TODO: versionar o arquivo nginx no repo.
