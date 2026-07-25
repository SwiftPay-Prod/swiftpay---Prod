# SwiftPay

## What This Is

SwiftPay é um gateway de pagamentos completo com suporte a PIX, Cartão de Crédito, Boleto e Saques. Atualmente integrado exclusivamente com a adquirente MagicPay como único provedor de pagamentos.

## Core Value

Processar pagamentos com rapidez e confiabilidade, garantindo que cada transação seja concluída com segurança e rastreabilidade.

## Requirements

### Validated

- ✓ Integração MagicPay como adquirente único (PIX, Cartão, Boleto, Saque) — Fase 9
- ✓ Geração de QR Code PIX via MagicPay
- ✓ Processamento de webhooks de pagamento e transferência com validação HMAC
- ✓ Saques (withdraw) via MagicPay
- ✓ Pagamento com Cartão de Crédito via MagicPay
- ✓ Geração de Boleto via MagicPay
- ✓ CI/CD via GitHub Actions com deploy automático na VPS
- ✓ Frontend Next.js com dashboard do merchant
- ✓ Autenticação de usuários (signup, signin, forgot password)
- ✓ Autenticação de dispositivos
- ✓ Gerenciamento de merchants (organizações)
- ✓ Gerenciamento de checkouts, produtos, clientes
- ✓ Página de login com SwiftPayBrandLogo

### Active

- [ ] Substituir imagens safefy-* por logos corretos da SwiftPay nos formatos horizontal e icon
- [ ] Testar fluxo PIX real contra API MagicPay
- [ ] Deploy via GitHub Actions para produção

### Out of Scope

- Suporte a múltiplas adquirentes simultâneas — foco exclusivo MagicPay até novo aviso
- Suporte a outras adquirentes (Bankizi, IHubBanking, ActivePayments, Rapdyn, Coldfy, Pluggou, HunterPay, HeartPay, Accithus) — descontinuadas, apenas MagicPay ativo

## Context

### Stack
- **Backend**: .NET 10 (C#), FastEndpoints, Entity Framework Core, Npgsql
- **Frontend**: Next.js 16, React, Tailwind, HeroUI
- **Infra**: Docker Compose, PostgreSQL, RabbitMQ, MinIO, Valkey
- **Deploy**: VPS (169.58.70.201), Nginx, Let's Encrypt, GitHub Actions
- **Adquirente**: MagicPay (API em https://api.system-magicpay.com/v1)

### Estrutura
- `swiftpay-api/` — API principal (auth, admin, merchants)
- `swiftpay-api-core/` — Core library (models, constants, database)
- `swiftpay-api-payment/` — API de pagamentos (MagicPay, webhooks, transações)
- `swiftpay-web/` — Frontend Next.js
- `swiftpay-web-checkout/` — Página de checkout público

### Produção
- URL: https://swift-pay.top
- VPS: 169.58.70.201
- Docker compose com 8 serviços (api, payment, web, postgres, rabbitmq, minio, valkey)

## Constraints

- **Adquirente**: MagicPay é o único adquirente — API key configurada no seed
- **API Key**: `C28pm-n4XX2NWjvyvOimNF63ThtQKIGv1eJ6ne2eujo`
- **Webhook**: HMAC-SHA256 via header `X-Signature` com a mesma API key
- **Infra**: VPS root com Docker SDK 10.0

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MagicPay como adquirente único | Simplifica operação e manutenção | ✓ Good |
| WebhookToken = API Key | MagicPay usa mesma chave para HMAC | ✓ Good |
| Seed da MagicPay no startup | Evita config manual no painel admin | ✓ Good |
| `overflow-y-auto` no sidebar | Botão Sair ficava escondido sem scroll | ✓ Good |
| Sair movido para menu do usuário | Melhor UX, sempre acessível | ✓ Good |

---

*Last updated: 2026-07-25 after config inicial do GSD*
