# SWIFTPAY — Mapa do Backend

> **Data de análise:** 21/05/2026

---

## 1. Visão Geral

Três projetos .NET 10 compondo o backend:

| Projeto | Tipo | Framework | Porta |
|---------|------|-----------|-------|
| **swiftpay-api-core** | Class Library (NuGet) | .NET 10 | — |
| **swiftpay-api** | Web API | FastEndpoints 7.1.1 | 5279 |
| **swiftpay-api-payment** | Web API | FastEndpoints 7.1.1 | 5166 |

---

## 2. Endpoints — swiftpay-api (Gestão)

### 2.1 Auth (`/v1/auth`) — [AllowAnonymous, rate-limit: auth]

| Método | Rota | Propósito |
|--------|------|-----------|
| POST | `/v1/auth/signup` | Cadastro (name, email, password, refCode?, whatsApp) |
| POST | `/v1/auth/signin` | Login com deviceId |
| POST | `/v1/auth/verify-device` | Verificar código 2FA de novo dispositivo |
| POST | `/v1/auth/resend-device-code` | Reenviar código de dispositivo |
| POST | `/v1/auth/forgot-password` | Solicitar recuperação de senha |
| POST | `/v1/auth/reset-password` | Resetar senha com código |
| POST | `/v1/auth/confirm-email` | Confirmar email com token |
| POST | `/v1/auth/send-email-confirmation` | Reenviar confirmação de email |
| POST | `/v1/auth/signout` | Logout (revoga tokens) |
| GET | `/v1/auth/referrals/{refCode}` | Resolver código de indicação (público) |

### 2.2 Session (`/v1/session`) — [Authenticated]

| Método | Rota | Propósito |
|--------|------|-----------|
| GET | `/v1/session` | Ler sessão atual |
| PATCH | `/v1/session` | Atualizar (selectedMerchantId, environment) |

### 2.3 Users (`/v1/users`) — [Authenticated, rate-limit: users]

25+ endpoints: perfil (read, update, avatar), dispositivos confiáveis, push tokens FCM, ranking de usuários, programa de indicações (gerar código, saque de comissão, chave PIX), onboarding, notificações (list, count, mark read, delete), preferências, boletins (list, read, react)

### 2.4 Merchant (`/v1/merchant/{id}`) — [Authenticated]

50+ endpoints organizados em subdomínios:

| Subdomínio | Qtd | Principais endpoints |
|------------|-----|---------------------|
| **Settings** | 2 | GET/PATCH configurações, histórico |
| **Dashboard** | 1 | GET dashboard KPIs |
| **Balance** | 2 | GET saldo, histórico |
| **Payments** | 6 | CRUD, preview fee, resend webhook |
| **Payment Links** | 6 | CRUD, expirar |
| **Cashouts** | 6 | Criar, listar, cancelar, preview, simular |
| **Cashout Accounts** | 5 | CRUD conta de saque (PIX key) |
| **Orders** | 4 | CRUD, fulfillment |
| **Products** | 8 | CRUD (físico, digital, serviço) |
| **Checkouts** | 5 | CRUD, configuração de template |
| **Customers** | 4 | CRUD |
| **Coupons** | 5 | CRUD |
| **API Credentials** | 4 | Criar, regenerar, revogar |
| **Integrations** | 2 | Listar, atualizar (tracking) |
| **Email Templates** | 4 | CRUD, testar envio |
| **Fees** | 1 | GET taxas efetivas |
| **Nominals** | 4 | Listar, trocar, histórico, A/B test |
| **Notifications** | 5 | Listar, count, mark read, delete |
| **Achievements** | 1 | GET conquistas |
| **KYC** | 2 | Submeter, responder pendência |
| **Upload** | 1 | POST upload de arquivo |
| **Delete** | 2 | Solicitar/confirmar exclusão |

### 2.5 Admin (`/v1/admin`) — [Roles: God, Admin]

85+ endpoints organizados em:

| Subdomínio | Qtd | Principais endpoints |
|------------|-----|---------------------|
| **Dashboard** | 1 | GET admin dashboard |
| **Users** | 18 | Listar, detalhe, ativar/inativar/suspender, role, reset password, referral assign |
| **Merchants** | 15 | Listar, detalhe, KYC evaluate, settings, acquirer bind |
| **Acquirers** | 14 | CRUD, stats, required fields, merchants, nominal history, access accounts |
| **Balance** | 7 | Saldo, reconciliação, ajuste, refresh cache |
| **Platform Payouts** | 8 | Preview, criar, listar, cancelar, reprocessar |
| **Platform Payout Accounts** | 5 | CRUD, set default |
| **Cashouts** | 4 | Listar, detalhe, avaliar (approve/reject) |
| **Platform Settings** | 2 | GET/PATCH |
| **Templates** | 4 | CRUD de template de checkout |
| **Revenue** | 1 | GET receita da plataforma |
| **Referrals** | 4 | Listar, withdrawal requests, avaliar |
| **Ranking** | 1 | GET ranking de adquirentes |
| **Logs** | 1 | GET logs (filtro por tipo) |
| **DevTools** | 5+ | Reprocessar transações/cashouts/webhooks/achievements |
| **Wayne Protocol** | 2 | GET/PATCH configuração interna |

### 2.6 Outros Grupos

| Grupo | Prefixo | Auth | Propósito |
|-------|---------|------|-----------|
| BoletoGroup | `/v1/boleto` | AllowAnonymous | Visualização pública de boleto |
| FileGroup | `/v1/files` | Authenticated | Download de arquivos públicos/privados |
| DevToolsGroup | `/v1/dev-tools` | Role: God | Ferramentas de desenvolvimento |

---

## 3. Endpoints — swiftpay-api-payment (Gateway)

### 3.1 Transações (`/v1/transactions`) — [JWT, MerchantRateLimit]

| Método | Rota | Propósito |
|--------|------|-----------|
| POST | `/v1/transactions` | Criar (PIX, Cartão, Boleto) |
| GET | `/v1/transactions/{id}` | Detalhe da transação |
| GET | `/v1/transactions` | Listar transações |
| POST | `/v1/transactions/{id}/simulate` | Simular (sandbox) |
| POST | `/v1/transactions/{id}/resend-webhook` | Reenviar webhook |

### 3.2 Checkout (`/v1/checkouts`) — [AllowAnonymous, CORS]

| Método | Rota | Propósito |
|--------|------|-----------|
| POST | `/v1/checkouts/calculate` | Calcular valores |
| GET | `/v1/checkouts/{id}` | Obter config do checkout |
| POST | `/v1/checkouts/create-order` | Criar pedido |
| GET | `/v1/checkouts/get-order/{id}` | Obter pedido |
| POST | `/v1/checkouts/validate-coupon` | Validar cupom |
| POST | `/v1/checkouts/update-order/{id}` | Atualizar pedido |
| POST | `/v1/checkouts/reserve-order/{id}` | Reservar estoque |
| POST | `/v1/checkouts/reactivate-order/{id}` | Reativar pedido expirado |

### 3.3 Demais Grupos Públicos

| Grupo | Prefixo | Auth | Qtd |
|-------|---------|------|-----|
| Cashouts | `/v1/cashouts` | JWT | 5 (CRUD + cancel + simulate) |
| Customers | `/v1/customers` | JWT | 4 (CRUD) |
| PaymentLinks | `/v1/payment-links` | AllowAnonymous | 4 (get, start, status) |
| Orders | `/v1/orders` | JWT | 3 (CRUD) |
| Products | `/v1/products` | JWT | 2 (GET list/detail) |
| Balance | `/v1/balance` | JWT | 1 (GET) |
| Auth | `/v1/auth/token` | IP RateLimit | 1 (POST OAuth2) |

### 3.4 Internos (`/v1/internal/*`) — [X-Internal-Api-Key]

22+ endpoints para comunicação entre swiftpay-api e swiftpay-api-payment: criar transações internamente, criar/cancelar/avaliar saques, criar pedidos, criar payment links, submeter submerchant, reprocessar dev.

### 3.5 Webhooks de Adquirentes (`/v1/internal/{code}/webhooks`) — [Webhook Auth]

9 endpoints POST, um por adquirente.

---

## 4. Serviços — Mapa de Dependências

### swiftpay-api-core (18 serviços compartilhados)

```
Serviços Core
├── LedgerService (~1655 linhas)
│   ├── ILedgerRepository
│   ├── PrimaryDbContext
│   └── ICalculationService
├── CalculationService
│   ├── PrimaryDbContext
│   └── ILedgerRepository
├── MerchantCalculationService → PrimaryDbContext
├── NotificationService → INotificationRepository + IMessagePublisher
├── EmailService → IEmailTemplateService + Resend SDK
├── EmailTemplateService → IEmailTemplateProvider
├── EmailLogService → ILogQueue<EmailLogEntry>
├── ApiLogService → ILogQueue<ApiLogEntry>
├── SecurityLogDbService → ILogQueue<SecurityLogEntry>
├── AcquirerWebhookLogService → ILogQueue<AcquirerWebhookLogEntry>
├── PushNotificationService → Firebase SDK + PrimaryDbContext
├── BankReconciliationService → PrimaryDbContext + ILedgerService
├── GeoLocationService → API externa de geo-IP
├── AchievementService → PrimaryDbContext
├── StockService → PrimaryDbContext
├── OrderReservationCleanupService → PrimaryDbContext
├── WayneProtocolService → PrimaryDbContext
├── ReferralCommissionCompilationService → PrimaryDbContext
└── RabbitMQPublisher → MassTransit IBus
```

### swiftpay-api Services (13 internos)

```
├── TokenService → JWT HMAC-SHA512 + PrimaryDbContext
├── SessionService → Valkey + IDataProtector
├── StorageService → AWS S3 SDK (DigitalOcean Spaces / MinIO)
├── NotificationHubService → SignalR IHubContext<MainHub>
├── DashboardHubService → SignalR IHubContext<MainHub>
├── AutomaticCashoutService → ILedgerService + Hangfire + PrimaryDbContext
├── RankingSchedulerService → IMessagePublisher + Hangfire
├── RankingProcessingStatusService → SystemInternalConfig
├── SubmerchantProvisioningService → PrimaryDbContext + PaymentApiClient
├── PaymentApiClient → HttpClient (typed) → swiftpay-api-payment
├── ReferralCommissionCalculator → PrimaryDbContext
├── SecurityLogService → ILogQueue + IGeoLocationService
└── StartupWarmupService → PrimaryDbContext + LogDbContext
```

### swiftpay-api-payment Services (17+)

```
├── TransactionService → ILedgerService + ICalculationService + IPaymentMethodServiceFactory
│   ├── PixTransactionService → PixService
│   ├── CreditCardTransactionService
│   └── BoletoTransactionService
├── PixService → AcquirerServiceFactory → IAcquirerService (12 implementações)
├── PaymentProcessingService → ILedgerService + IMessagePublisher + PrimaryDbContext
├── CashoutService (~1935 linhas) → ILedgerService + WithdrawService + IMessagePublisher
├── CashoutWebhookService → HTTP + retry
├── WebhookService → HTTP + HMAC + retry
├── OrderService → IStockService + PrimaryDbContext
├── DigitalDeliveryService → IEmailService + PrimaryDbContext
├── WithdrawService → AcquirerServiceFactory → IAcquirerService.WithdrawAsync()
├── PlatformPayoutWebhookService → ILedgerService
├── AcquirerNominalTrackingService → PrimaryDbContext
└── 12 Acquirer Services (um por adquirente, incluindo PixHub)
```

---

## 5. Database — Esquema de Entidades

### PrimaryDbContext — 90+ DbSet Properties

**Domínios principais:**

**Usuários e Autenticação:** `Users`, `RefreshTokens`, `PasswordResetCodes`, `PasswordChangeCodes`, `EmailConfirmationTokens`, `TrustedDevices`, `DeviceVerificationCodes`, `PushTokens`, `UserNotificationPreferences`, `Achievements`, `UserAchievements`, `UserSelectedEmblems`, `LevelConfigs`

**Merchants:** `Merchants`, `MerchantKycs`, `MerchantKycPendingItems`, `MerchantSettings`, `MerchantSettingsChangeHistories`, `MerchantApiCredentials`, `MerchantAcquirers`, `MerchantAcquirerChangeHistories`, `MerchantIntegrations`, `MerchantPayoutAccounts`, `MerchantNominalAbTests`, `MerchantEmailTemplates`, `MerchantEmailSettings`, `MerchantDeletionCodes`, `ApiCredentialCodes`, `PayoutAccountVerificationCodes`

**Financeiro (Ledger):** `Accounts`, `LedgerTransactions`, `LedgerEntries`, `MerchantBalances`

**Pagamentos:** `Payments`, `PaymentsPix`, `PaymentsBoleto`, `PaymentLinks`

**Pedidos:** `Orders`, `OrderItems`

**Produtos:** `Products` (base), `Categories`, `Variants`, `PhysicalProducts`, `PhysicalProductVariants`, `DigitalProducts`, `DigitalProductVariants`, `DigitalProductItems`, `ServiceProducts`

**Checkout:** `Checkouts`, `CheckoutConfigs`, `CheckoutProducts`, `CheckoutTemplates`

**Saques:** `Payouts`

**Clientes:** `Customers`

**Cupons:** `Coupons`

**Adquirentes:** `Acquirers`, `AcquirerPixNominalHistories`

**Notificações:** `Notifications`

**Dashboards (Cache):** `MerchantDashboardCaches`, `AdminDashboardCaches`, `AcquirerDashboardCaches`, `PlatformBalanceCaches`

**Rankings:** `UserRankingCaches`, `ReferralRankingCaches`, `AcquirerRankingCaches`

**Reconciliação:** `BankReconciliations`, `BankReconciliationDiscrepancies`

**Referral:** `ReferralCommissionPayments`, `ReferralCommissionWithdrawalRequests`, `ReferralCommissionMovements`, `ReferralCommissionBalances`, `ReferralReferredUserSummaries`

**Plataforma:** `PlatformSettings`, `PlatformPayouts`, `PlatformPayoutItems`, `PlatformPayoutAccounts`, `SystemInternalConfigs`, `WayneProtocolCycleStates`, `AutomaticCashoutLogs`

**Boletins:** `Bulletins`, `BulletinReads`, `BulletinReactions`

**Storage:** `StoredFiles`, `StockMovements`, `StockNotificationSubscriptions`

**Data Protection:** `DataProtectionKeys`

### LogDbContext

`SecurityLogs`, `ApiLogs`, `EmailLogs`, `AcquirerWebhookLogs`

---

## 6. Interfaces — Catálogo Completo (28)

`IAchievementService`, `IAcquirerNominalTrackingService`, `IAcquirerWebhookLogService`, `IApiLogService`, `IBankReconciliationService`, `ICalculationService`, `IDashboardHubService`, `IDigitalDeliveryService`, `IEmailBlockRenderer`, `IEmailLogService`, `IEmailService`, `IEmailTemplateProvider`, `IEmailTemplateService`, `IEnvironmentProvider`, `IGeoLocationService`, `ILedgerRepository`, `ILedgerService`, `ILogQueue<T>`, `IMerchantCalculationService`, `IMessagePublisher`, `INotificationHubService`, `INotificationRepository`, `INotificationService`, `IPushNotificationService`, `IRankingProcessingStatusService`, `IReferralCommissionCompilationService`, `ISecurityLogService`, `IStockService`

---

## 7. Ledger — Sistema de Contabilidade

### Entidades

```
Account (saldo real)
├── AccountType: MerchantAvailable, MerchantPending, MerchantBlocked,
│                MerchantReserved, MerchantPayoutsOut,
│                PlatformBlocked, PlatformPayoutsOut,
│                AcquirerSettlement, AcquirerPayoutsOut
├── Balance (decimal, atualizado atomicamente)
└── Owner: MerchantId, AcquirerId (ou null para Platform)

LedgerTransaction (agrupamento)
├── Operation: PlatformFee, SettlementIn, SettlementOut, PayOut,
│              PixIn, PixOut, PixRefund, PixPartialRefund,
│              PlatformPayOutRequested, PlatformPayOut,
│              ReferralCommissionPayOut, Reversal,
│              PlatformAdjustment, AcquirerAdjustment,
│              AcquirerSwiftPayProfitAdjustment, MerchantAdjustment
├── Status: Pending, Approved, Refused
└── Reference: PaymentId, PayoutId, PlatformPayoutId, etc.

LedgerEntry (débito/crédito)
├── Type: Credit, Debit
├── Amount, AccountId
└── Description (imutável)
```

### Operações Atômicas

```sql
-- Padrão usado em toda atualização de saldo:
UPDATE Accounts SET Balance = Balance + @delta WHERE Id = @id;
```

Todas as operações de ledger executam dentro de uma transação SQL com `ExecuteSqlRawAsync`, garantindo atomicidade entre as entries e os updates de balance.

### KPIs (MerchantBalance)

Separados do saldo real (Ledger):
`LifetimeVolume`, `LifetimeFeesPaid`, `LifetimePayouts`, `LifetimeRefunds`, `VolumeToday`, `VolumeThisWeek`, `VolumeThisMonth`, `ApprovalRate`, `FeesToday`, etc.

---

## 8. Patterns Arquiteturais

| Pattern | Onde | Por quê |
|---------|------|--------|
| **Repository** | `LedgerRepository`, `NotificationRepository` | Abstração de acesso a dados |
| **Service Layer** | Todos `Services/` | Lógica de negócio isolada |
| **Strategy** | `IEnvironmentProvider` (Header vs Hybrid), `IMessagePublisher` (Real vs Disabled) | Comportamento trocável |
| **Factory** | `AcquirerServiceFactory`, `PaymentMethodServiceFactory` | Resolução polimórfica |
| **Options** | 10+ classes `*Settings` via `IOptions<T>` | Configuração tipada |
| **Mediator** | MassTransit + RabbitMQ | Desacoplamento assíncrono |
| **Observer** | SignalR hubs | Notificações em tempo real |
| **Unit of Work** | `PrimaryDbContext` | Transações atômicas |
| **Query Filter** | EF Core `HasQueryFilter` | Isolamento Sandbox/Production |
| **Mapper** | Classes estáticas em `Mappers/` | DTO ↔ Entity |
| **Background Service** | `LogBackgroundService`, `OrderReservationCleanupService` | Processamento assíncrono |
| **Extension Methods** | 12+ classes em `Extensions/` | DI modular |
