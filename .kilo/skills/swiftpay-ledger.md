# Swiftpay Ledger System

## Sub-skills
- **swiftpay-domain** — entity definitions (Account, LedgerTransaction, LedgerEntry)
- **swiftpay-payment-processing** — how payments trigger ledger entries
- **swiftpay-messaging** — RecordLedgerPending consumer

## Overview
Double-entry accounting: every financial movement generates Credit + Debit entries across typed Accounts. **Never update balances directly — always go through LedgerService.**

## Account Types
```csharp
// Merchant accounts (per merchant, per environment, per acquirer bucket):
MerchantAvailable   → Saqueável
MerchantPending     → Aguardando confirmação do pagamento
MerchantBlocked     → Saque em andamento (locked)
MerchantReserved    → Em compensação (não disponível para saque)
MerchantPayoutsOut  → Total histórico já sacado

// Platform accounts:
PlatformBlocked     → Saques da plataforma em andamento
PlatformPayoutsOut  → Total histórico sacado pela plataforma

// Acquirer accounts:
AcquirerSettlement  → Dinheiro líquido recebido do adquirente
AcquirerPayoutsOut  → Total enviado ao adquirente para payout
```

## Core Entities
- **Account**: Id, Type (enum), MerchantId?, AcquirerId?, MerchantAcquirerId?, Currency, Balance (long, cents), Environment
- **LedgerTransaction**: Id (`tx-{Guid}`), Amount, Operation (enum), Status, PaymentId?, PayoutId?, Notes
- **LedgerEntry**: Id (`e-{Guid}`), LedgerTransactionId, AccountId, Type (Credit/Debit), Amount, Timestamp, Description

## Operation Types
```
Fee: PlatformFee
Settlement: SettlementIn, SettlementOut
Merchant: PayOut
Referral: ReferralCommissionPayOut
Platform: PlatformPayOutRequested, PlatformPayOut
PIX: PixIn, PixOut, PixRefund, PixPartialRefund
Reversal: Reversal
Adjustments: PlatformAdjustment, AcquirerAdjustment, MerchantAdjustment
```

## Payment Lifecycle (PIX Example)
1. **PaymentCreated** → `RecordPaymentPendingAsync`: Credits MerchantPending
2. **PaymentReceived** (webhook) → `RecordPaymentReceivedAsync`: Debits MerchantPending, Credits MerchantAvailable (settlement), Credits MerchantReserved (reserve), Credits AcquirerSettlement
3. **PaymentCancelled** → `RecordPaymentCancelledAsync`: Debits MerchantPending
4. **PaymentRefunded** → `RecordPaymentRefundedAsync`: Debits MerchantReserved first, then MerchantAvailable, Debits AcquirerSettlement

## Withdrawal Lifecycle
1. **Requested** → `RecordWithdrawalRequestedAsync`: Debits MerchantAvailable, Credits MerchantBlocked
2. **Completed** → `RecordWithdrawalCompletedAsync`: Debits MerchantBlocked, Credits MerchantPayoutsOut
3. **Failed** → `RecordWithdrawalFailedAsync`: Debits MerchantBlocked, Credits MerchantAvailable

## Critical Rules
- **Money is long cents**: Never float/decimal for balances
- **Atomic updates**: Use raw SQL `UPDATE Accounts SET Balance = Balance + delta` — never EF's last-write-wins
- **Idempotency**: Every operation checks for existing `TransactionId + Operation + Status` before creating
- **Get-or-Create**: Accounts are lazily created on first access
- **Acquirer-bucket isolation**: Merchant balances split by MerchantAcquirerId for FIFO withdrawal
- **Compensation locking**: Recent payments (not yet compensated) are excluded from withdrawable balance
- **Two-phase withdrawal**: Available → Blocked → PayoutsOut (or back to Available on failure)
- **KPIs**: MerchantBalanceDeltas with per-field deltas allow rebuilding from scratch
