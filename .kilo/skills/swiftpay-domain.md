# Swiftpay Domain Rules

## Monetary Values
- All monetary values stored as **long in cents** (R$ 30,00 = 3000 cents)
- Use `Money` ValueObject for all monetary operations
- Never use float/double for money
- Convert to decimal only for display

## Payment Link Rules
- `Slug` is auto-generated: 8 characters alphanumeric (lowercase)
- `Amount` is the fixed price when `AmountMin` and `AmountMax` are null
- When `AmountMin/Max` are set, customer chooses the amount within range
- `IsActive = false` means the link is deactivated and cannot be used
- `UsesCount` increments when a payment is completed
- `MaxUses = null` means unlimited uses
- Soft delete via `DeletedAt` timestamp

## Transaction Status Flow
- `Pending` -> `Paid` (payment confirmed)
- `Pending` -> `Cancelled` (expired or cancelled)
- `Paid` -> `Refunded` (refund processed)
- Transactions are immutable after creation (audit trail)

## Withdrawal Rules
- Minimum withdrawal: calculated from fee structure
- Status flow: `Pending` -> `Approved` -> `Completed`
- `PixKey` is required for payout
- `PixKeyType`: CPF | CNPJ | EMAIL | PHONE | RANDOM

## Fee Structure (default)
- Cash in: 5.00% + R$ 1.80 fixed
- Cash out: R$ 10.00 fixed (flat, no percentage)
- Acquirer: 3.00% + R$ 1.00 fixed

## Authentication
- Access token: JWT, 2 hours expiry
- Refresh token: opaque string, 30 days expiry
- JWT claims: sub (user id), company_id, email, role
