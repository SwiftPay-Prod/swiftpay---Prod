# Swiftpay Domain Rules

## Sub-skills
- **superpowers:brainstorming** — refines domain rules before implementation
- **superpowers:test-driven-development** — RED-GREEN-REFACTOR for each domain entity
- **dotnet:dotnet** — C# language conventions and project structure
- **swiftpay-architecture** — Clean Architecture layers for domain placement

## Monetary Values
- All monetary values stored as **long in cents** (R$ 30,00 = 3000 cents)
- Use `Money` ValueObject (`record Money(long AmountInCents)`) for all monetary operations
- Never use float/double/decimal for internal storage — convert to decimal only for display/response
- Monetary calculations (fees, taxes) happen in Application layer, not Domain
- Zero-amount Money is `new Money(0)`, never null

## Payment Link Aggregate Rules
- Root entity: `PaymentLink` under `Swiftpay.Domain.Entities`
- `Slug` is auto-generated: 8 characters alphanumeric (lowercase) — must be unique per company
- `Amount` is the fixed price when `AmountMin` and `AmountMax` are null
- When `AmountMin/Max` are set, customer chooses the amount within range (min <= amount <= max)
- `IsActive = false` means the link is deactivated and cannot receive new payments
- `UsesCount` increments only when a payment reaches `Paid` status (not `Pending`)
- `MaxUses = null` means unlimited uses; `MaxUses = 5` means the link expires after 5 payments
- Soft delete via `DeletedAt` timestamp — never hard-delete payment links
- Payment link statuses: `Active` (is_active=true) | `Inactive` (is_active=false) | `Expired` (expires_at passed) | `Exhausted` (uses_count >= max_uses)

## Payment Flow (Transaction Aggregate)
- Root entity: `Transaction` under `Swiftpay.Domain.Entities`
- Transaction is the **single source of truth** for all financial movements
- Every paid payment link generates exactly one Transaction
- Status flow:
  - `Pending` → `Paid` (payment confirmed by gateway)
  - `Pending` → `Cancelled` (expired, customer cancelled, or fraud detected)
  - `Paid` → `Refunded` (refund processed — creates inverse transaction)
  - `Paid` → `Chargeback` (dispute opened by payer)
- Transactions are **immutable after creation** — status changes create audit log entries
- External reference: `GatewayTransactionId` links to PSP (Payment Service Provider) record

## Withdrawal Aggregate Rules
- Root entity: `Withdrawal` under `Swiftpay.Domain.Entities`
- Minimum withdrawal: calculated dynamically from fee structure (cash_out_fixed + any pending fees)
- Status flow: `Pending` → `Approved` → `Completed` | `Rejected`
- `PixKey` is required for payout (Brazilian payment system)
- `PixKeyType` values: `CPF` | `CNPJ` | `EMAIL` | `PHONE` | `RANDOM_KEY`
- Withdrawal can only be made when `Balance.Available >= Withdrawal.Amount + fees`

## Fee Structure (Domain Service)
- Default fee configuration:
  - Cash in (recebimento): **5.00% + R$ 1.80** fixed per transaction
  - Cash out (saque): **R$ 10.00** flat (no percentage)
  - Acquirer (adquirente): **3.00% + R$ 1.00** per transaction
- Fee calculation is a Domain Service (`IFeeCalculator` interface in Domain, implementation in Application)
- Fee structure can vary per company (stored in Infrastructure), but default applied if none configured

## Authentication Domain Rules
- Access token: JWT, **2 hours** expiry
- Refresh token: opaque string (not JWT), **30 days** expiry, revocable
- JWT claims: `sub` (user id GUID), `company_id` (GUID), `email`, `role` (Owner | Admin | Support)
- Password hashing: bcrypt (via ASP.NET Core Identity PasswordHasher)
- User roles: `Owner` (full access), `Admin` (management), `Support` (read-only)

## Domain Events (Key Events)
- `PaymentLinkCreated` — when a new link is created
- `PaymentLinkPaid` — when a transaction reaches Paid status
- `PaymentLinkExpired` — when a link expires without payment
- `WithdrawalRequested` — when a withdrawal is initiated
- `WithdrawalCompleted` — when funds are actually sent

## Ledger System (Contabilidade)

### Account Entity
- Root entity: `Account` under `Swiftpay.Domain.Entities`
- **Balance is stored as `long` (cents)** — never decimal/float
- Account types: `MerchantAvailable`, `MerchantPending`, `MerchantBlocked`, `MerchantReserved`, `MerchantPayoutsOut`, `PlatformBlocked`, `PlatformPayoutsOut`, `AcquirerSettlement`, `AcquirerPayoutsOut`
- Accounts are per-merchant, per-environment, per-acquirer-bucket
- `GetOrCreate` pattern: accounts created lazily on first access
- Balance updates via raw SQL (`UPDATE Accounts SET Balance = Balance + delta`) — never EF Core for writes

### LedgerTransaction Entity
- Groups multiple `LedgerEntry` records for a single financial event
- Operation types: `PixIn`, `PixOut`, `PixRefund`, `PixPartialRefund`, `PlatformFee`, `SettlementIn`, `SettlementOut`, `PayOut`, `PlatformPayOut`, `Reversal`, `PlatformAdjustment`, `AcquirerAdjustment`, `MerchantAdjustment`
- Statuses: `Pending`, `AwaitingBankProcessing`, `Approved`, `Refused`, `Failed`, `Reversed`
- Idempotency key: `PaymentId + Operation + Status`

### LedgerEntry Entity
- Atomic unit: each entry is a `Credit` or `Debit` on a specific `Account`
- Every transaction has at least 2 entries (dual effect)
- Timestamped and immutable after creation

## Payment Processing Entities

### Payment Entity
- Root entity for all payment transactions
- Status flow: `Pending → Processing → Completed | Failed | Expired`
- From `Completed`: can transition to `Refunded` or `PartiallyRefunded`
- Key fields: `Amount`, `PlatformFee`, `AcquirerFee`, `NetAmount` (merchant liquid), `MerchantSettlementAmount`, `AcquirerNetAmount`, `MerchantAcquirerId`, `ExternalId`, `AcquirerPaymentId`, `GatewayTransactionId`
- Related entities: `PaymentPix`, `PaymentBoleto`, `PaymentCreditCard` (one per method)
- Locking: optimistic via `UPDATE ... SET Status = 'Confirming' WHERE Status = 'Pending'`

### PaymentPix Entity
- `TxId`, `EndToEndId`, `QrCodePayload`, `QrCodeBase64`, `CopyAndPaste`
- `PixKey`, `PixKeyType`
- `PayerName`, `PayerDocument`, `PayerBank`, `PayerBranch`, `PayerAccount`
- `PaidAt`, `ExpiresAt`

## Aggregate Boundaries
- **Company Aggregate**: Company + Users + MerchantAcquirers + FeeConfiguration
- **Ledger Aggregate**: Account + LedgerTransaction + LedgerEntry (immutable)
- **Payment Aggregate**: Payment + PaymentPix/Boleto/Card (child)
- **PaymentLink Aggregate**: PaymentLink + Payments (child collection)
- **Transaction Aggregate**: Transaction only (standalone)
- **Withdrawal Aggregate**: Withdrawal only (standalone)

> Rule: Never load an entire aggregate just to access a single entity within it. Load the aggregate root or use a separate query.
> Rule: Ledger entries are **immutable** — never update or delete. Create reversal transactions instead.
> Rule: Payment status transitions must be **atomic** — use `ExecuteUpdateAsync` for optimistic locking.
