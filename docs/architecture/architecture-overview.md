# SWIFTPAY — Visão Geral da Arquitetura

> **Data de análise:** 21/05/2026  
> **Tipo:** Documentação arquitetural (análise do estado atual, sem alterações)

---

## 1. O que é o SWIFTPAY

Plataforma brasileira de gateway de pagamentos **white-label** operando como subadquirente, com foco em **PIX**, **cartão de crédito** e **boleto**. Permite que merchants processem pagamentos através de múltiplas adquirentes (Bankizi, Rapdyn, HeartPay, etc.) de forma transparente — o merchant nunca sabe qual adquirente está processando sua transação.

---

## 2. Monorepo — Estrutura dos 5 Módulos

```
swiftpay/
├── swiftpay-api-core/       # .NET 10 Class Library (NuGet Package)
│   └── Entidades, enums, contratos, serviços compartilhados, consumers MassTransit, DbContexts, utilitários, middlewares
│
├── swiftpay-api/            # .NET 10 Web API — Gestão (FastEndpoints)
│   └── Autenticação, merchants, admin dashboard, credenciais, notificações, ranking, onboarding, KYC
│
├── swiftpay-api-payment/    # .NET 10 Web API — Gateway de Pagamentos (FastEndpoints)
│   └── Transações PIX/cartão/boleto, checkout, saques, webhooks, integração com adquirentes
│
├── swiftpay-web/            # Next.js 16 + React 19 — Painel Administrativo
│   └── Dashboard do merchant, admin, configurações, produtos, pedidos, referral, live balance
│
└── swiftpay-web-checkout/   # Next.js 16 + React 19 — Checkout Público
    └── Página de pagamento multi-template, payment links, tracking multi-plataforma
```

---

## 3. Arquitetura de Comunicação

```
┌─────────────────────┐     ┌──────────────────────┐
│   swiftpay-web      │     │ swiftpay-web-checkout│
│   (Painel Admin)    │     │   (Checkout Público)  │
│   Porta: 3000/3001  │     │   Porta: 3000/3002    │
└────────┬────────────┘     └──────────┬───────────┘
         │ HTTP/HTTPS                  │ HTTP/HTTPS
         ▼                             ▼
┌─────────────────────┐     ┌──────────────────────┐
│   swiftpay-api      │────▶│ swiftpay-api-payment │
│   (Gestão)          │ API │ (Gateway Pagamento)  │
│   Porta: 5279       │Key  │   Porta: 5166        │
└────────┬────────────┘     └──────────┬───────────┘
         │                              │
         │ RabbitMQ / MassTransit       │
         └──────────────┬───────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌─────────────┐
   │PostgreSQL│  │  Valkey  │  │  Adquirentes │
   │  (2 DBs) │  │ (Cache)  │  │  (9 externas)│
   └──────────┘  └──────────┘  └─────────────┘
```

### Formas de comunicação entre módulos:

| De | Para | Método | Quando |
|----|------|--------|--------|
| swiftpay-web | swiftpay-api | HTTP REST (Axios) | Todas as operações do painel |
| swiftpay-web-checkout | swiftpay-api-payment | HTTP REST (Axios) + Rewrites Next.js | Operações de checkout público |
| swiftpay-api | swiftpay-api-payment | HTTP (Internal API Key) | Criar transações, saques, pedidos internamente |
| swiftpay-api ↔ swiftpay-api-payment | RabbitMQ (MassTransit) | Eventos assíncronos | Notificações, dashboards, webhooks, ranking |
| Ambas APIs | swiftpay-api-core | Referência direta de projeto / NuGet package | Compartilhamento de código |

---

## 4. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Backend Runtime** | .NET | 10.0 |
| **Backend Framework** | FastEndpoints | 7.1.1 |
| **Backend ORM** | Entity Framework Core + Npgsql | 10.x |
| **Mensageria** | MassTransit + RabbitMQ | 8.4.0 / 3.13 |
| **Cache/Sessão** | Valkey (StackExchange.Redis) | 8-alpine |
| **Background Jobs** | Hangfire (Valkey storage) | 1.8.20 |
| **Emails** | Resend API / SMTP (MailHog dev) | |
| **Push Notifications** | Firebase Cloud Messaging | |
| **Armazenamento** | S3 (DigitalOcean Spaces / MinIO) | |
| **Frontend Framework** | Next.js (App Router) | 16.1.x |
| **Frontend UI** | React | 19.2.3 |
| **Design System** | HeroUI v3 + Tailwind CSS v4 | |
| **Linguagem Frontend** | TypeScript | 5.9.3 |
| **Tempo Real** | SignalR (WebSocket) | |
| **Observabilidade** | Grafana | 10.2.3 |
| **Análises** | Microsoft Clarity | |
| **Tracking** | Facebook, TikTok, Kwai, Pinterest, Taboola, GTM, Utmify, Otimizey | |

---

## 5. Bancos de Dados

| Banco | Propósito | Tecnologia | Tabelas/Domain |
|-------|----------|-----------|----------------|
| **Primary DB** (`swiftpay`) | Dados operacionais da aplicação | PostgreSQL 15-17 | Users, Merchants, Payments, Payouts, Orders, Products, Accounts (Ledger), etc. |
| **Logs DB** (`swiftpaylogs`) | Auditoria e logs | PostgreSQL 15 | SecurityLogs, ApiLogs, EmailLogs, AcquirerWebhookLogs |

### Filtro de Ambiente (Query Filter)
O `PrimaryDbContext` aplica um filtro global de `ApiEnvironment` (Sandbox/Production) automaticamente via `IEnvironmentProvider`. Em contexto HTTP, lê o header `X-Environment`. Em Consumers/Background Jobs, usa `HybridEnvironmentProvider.SetEnvironment()`.

---

## 6. Message Broker — RabbitMQ Queues (23 filas mapeadas)

| Fila | Consumidor | Propósito | Publicador |
|------|-----------|----------|-----------|
| `swiftpay.ledger.pending` | RecordLedgerPendingConsumer | Registrar pagamento pendente no ledger | swiftpay-api-payment |
| `swiftpay.payment.completed` | PaymentCompletedConsumer | Processar mudança de status de pagamento | swiftpay-api-payment |
| `swiftpay.webhook.send` | SendWebhookConsumer | Enviar webhook HTTP ao merchant | PaymentCompletedConsumer |
| `swiftpay.cashout.process` | ProcessCashoutConsumer | Executar saque na adquirente | swiftpay-api |
| `swiftpay.cashout.webhook.send` | SendCashoutWebhookConsumer | Enviar webhook de saque ao merchant | CashoutService |
| `swiftpay.email.customer` | SendCustomerEmailsConsumer | Enviar emails transacionais ao cliente | PaymentCompletedConsumer |
| `swiftpay.digital.delivery` | ProcessDigitalDeliveryConsumer | Liberar entrega de itens digitais | SendCustomerEmailsConsumer |
| `swiftpay.notification.created` | NotificationCreatedConsumer | Enviar notificação via SignalR | Vários |
| `swiftpay.push.send` | SendPushNotificationConsumer | Enviar push notification (FCM) | Vários |
| `swiftpay.dashboard.merchant` | ProcessMerchantDashboardConsumer | Atualizar cache do dashboard merchant | swiftpay-api |
| `swiftpay.dashboard.admin` | ProcessAdminDashboardConsumer | Atualizar cache do dashboard admin | swiftpay-api |
| `swiftpay.dashboard.acquirer` | ProcessAcquirerDashboardConsumer | Atualizar cache do dashboard adquirente | swiftpay-api |
| `swiftpay.ranking.process` | ProcessRankingConsumer | Processar ranking de usuários | Hangfire (5 min) |
| `swiftpay.ranking.referral` | ProcessReferralRankingConsumer | Processar ranking de referrals | Hangfire |
| `swiftpay.ranking.acquirer` | ProcessAcquirerRankingConsumer | Processar ranking de adquirentes | Hangfire |
| `swiftpay.balance.platform` | ProcessPlatformBalanceConsumer | Calcular saldo da plataforma | Vários |
| `swiftpay.platform.payout` | ProcessPlatformPayoutConsumer | Processar payout da plataforma | Admin |
| `swiftpay.platform.payout.item` | ProcessPlatformPayoutItemConsumer | Processar item de payout | Administrativo |
| `swiftpay.platform.reconcile` | ReconcilePlatformBalanceConsumer | Reconciliar saldo da plataforma | Administrativo |
| `swiftpay.reconciliation.process` | ProcessBankReconciliationConsumer | Executar reconciliação bancária | Vários |
| `swiftpay.reconciliation.start-all` | StartAllReconciliationsConsumer | Iniciar reconciliações em massa | Administrativo |
| `swiftpay.referral.historical` | ProcessReferralHistoricalCommissionConsumer | Compilar comissão histórica | Administrativo |

---

## 7. Sistema de Ledger (Contabilidade de Dupla Entrada)

O coração financeiro do SWIFTPAY. Três entidades:

```
Account (Saldo real) ──▶ LedgerTransaction (Agrupamento) ──▶ LedgerEntry (Débito/Crédito)
```

### Tipos de Conta (AccountType):

| Tipo | Dono | Propósito |
|------|------|-----------|
| `MerchantAvailable` | Merchant | Saldo disponível para saque |
| `MerchantPending` | Merchant | Pagamentos aguardando confirmação |
| `MerchantBlocked` | Merchant | Saques em processamento |
| `MerchantReserved` | Merchant | Reserva financeira (% do valor) |
| `MerchantPayoutsOut` | Merchant | Histórico de saques concluídos |
| `PlatformBlocked` | Plataforma | Saques de plataforma em andamento |
| `PlatformPayoutsOut` | Plataforma | Lucro enviado ao banco |
| `AcquirerSettlement` | Adquirente | Valor líquido recebido (dinheiro físico) |
| `AcquirerPayoutsOut` | Adquirente | Dinheiro enviado via PIX de saque |

### Operações (17 tipos):

`PlatformFee`, `SettlementIn`, `SettlementOut`, `PayOut`, `PixIn`, `PixOut`, `PixRefund`, `PixPartialRefund`, `PlatformPayOutRequested`, `PlatformPayOut`, `ReferralCommissionPayOut`, `Reversal`, `PlatformAdjustment`, `AcquirerAdjustment`, `AcquirerSwiftPayProfitAdjustment`, `MerchantAdjustment`

### Propriedades críticas:
- **Imutabilidade:** Transações nunca são alteradas ou deletadas
- **Atomicidade:** `UPDATE Balance = Balance + @delta` em transação SQL
- **Segregação:** Saldo real (Ledger) ≠ KPIs (Dashboard Caches)

---

## 8. Sistema de Adquirentes (9 integradas)

| Adquirente | Auth | PIX | Boleto | Cartão | Saque | Submerchant |
|------------|------|-----|--------|--------|------|-------------|
| Bankizi | OAuth2 | ✅ | — | — | ✅ | — |
| IHubBanking | Basic + Secret | ✅ | — | — | ✅ | — |
| ActivePayments | API Key (pk/sk) | ✅ | ✅ | — | — | — |
| Rapdyn | Bearer Token | ✅ | — | — | ✅ | — |
| Coldfy | Basic + CompanyID | ✅ | ✅ | — | ✅ | — |
| Pluggou | Headers (pk/sk) | ✅ | — | — | ✅ | — |
| HunterPay | Basic + CompanyID | ✅ | — | — | ✅ | — |
| HeartPay | Bearer Token | ✅ | ✅ | — | ✅ | — |
| Accithus | Basic (pk/sk) | ✅ | ✅ | ✅ | ✅ | ✅ (IP) |

**Padrão de integração:** Cada adquirente implementa `IAcquirerService` com `GeneratePixAsync()`, `GetPixStatusAsync()`, `WithdrawAsync()`. Resolução via `AcquirerServiceFactory` por dicionário `AcquirerType → IAcquirerService`.

---

## 9. Autenticação

| API | Método | Público-alvo |
|-----|--------|-------------|
| swiftpay-api | JWT Bearer (HMAC-SHA512) | Usuários do painel (admin, merchant) |
| swiftpay-api-payment | JWT Bearer (client_credentials) | Merchants via API (pk_/sk_ credentials) |
| swiftpay-api-payment | Internal API Key (X-Internal-Api-Key) | Comunicação interna entre APIs |
| swiftpay-api-payment | Webhook Auth (5 modos) | Adquirentes enviando callbacks |

### Webhook Auth Modes: `None`, `Token`, `Ip`, `TokenAndIp`, `HmacSha256`

---

## 10. Endpoints — Visão Geral

| API | Prefixo | Auth | Qtd Endpoints | Domínio |
|-----|---------|------|---------------|--------|
| swiftpay-api | `/v1/admin` | Roles: God, Admin | 85+ | Gestão administrativa |
| swiftpay-api | `/v1/auth` | AllowAnonymous | 10 | Autenticação |
| swiftpay-api | `/v1/merchant` | Authenticated | 50+ | Operações do merchant |
| swiftpay-api | `/v1/users` | Authenticated | 25+ | Perfil, notificações, referral |
| swiftpay-api | `/v1/session` | Authenticated | 2 | Gerenciamento de sessão |
| swiftpay-api | `/v1/files` | Authenticated | 2 | Upload/download de arquivos |
| swiftpay-api | `/v1/boleto` | AllowAnonymous | 1 | Visualização pública de boleto |
| swiftpay-api-payment | `/v1/transactions` | JWT | 5 | CRUD de transações |
| swiftpay-api-payment | `/v1/cashouts` | JWT | 5 | Saques |
| swiftpay-api-payment | `/v1/checkouts` | AllowAnonymous | 8 | Checkout público |
| swiftpay-api-payment | `/v1/customers` | JWT | 4 | Clientes |
| swiftpay-api-payment | `/v1/payment-links` | AllowAnonymous | 4 | Links de pagamento |
| swiftpay-api-payment | `/v1/auth/token` | Rate-limited | 1 | OAuth2 token |
| swiftpay-api-payment | `/v1/internal/*` | Internal API Key | 20+ | Comunicação interna |
| swiftpay-api-payment | `/v1/internal/{acquirer}/webhooks` | Webhook Auth | 9 | Callbacks de adquirentes |

---

## 11. Premissas Arquiteturais Ocultas

1. **Invisible Acquirer:** O merchant NUNCA sabe qual adquirente processa seu pagamento. Payloads padronizados.
2. **Environment Isolation:** Filtro automático Sandbox/Production no EF Core. Em consumers, requer `IgnoreQueryFilters()` + filtro manual.
3. **Dual-Database:** Dois bancos PostgreSQL separados (primary + logs) com connection pools independentes.
4. **RabbitMQ desabilitado por padrão:** `RabbitMQSettings.Enabled = false`. Deve ser explicitamente habilitado em produção.
5. **Migrações automáticas:** Ambos os bancos executam `Database.Migrate()` no startup. Nunca usam `EnsureCreated`.
6. **Rate Limiting só em Produção:** Desabilitado em desenvolvimento.
7. **Thread Pool pre-alocado:** 100 threads mínimas para evitar starvation em cold starts.
8. **ReloadOnChange desabilitado em Produção:** Configurações JSON não recarregam em produção.
9. **Server GC:** Coleta de lixo configurada para modo servidor em ambos os projetos .NET.
10. **Wayne Protocol:** Sistema interno de retenção total de taxas por amostragem cíclica — transparente ao merchant.
