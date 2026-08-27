## Problem Statement

Merchants need a **reusable Pix QR without expiration** for receiving payments any number of times on the same QR (e.g., trade stand, printed copy, door-to-door). Currently, all fixed PaymentLinks still generate a dynamic PaymentPix with an `ExpiresAt` (default 30 minutes) via an acquirer and expire, and there is no **static Pix** printable that can be pasted outside the `swiftpayment.info` domain.

## Solution

Add **Static Pix** to `/panel/merchant/pix-estatico` with three modes, all **without expiration** and **reusable**:

- **a) Fixed Value**: merchant chooses a value → EMV BR Code with value in field 54
- **b) Open Value**: no value → payer picks amount in their bank → BR Code without field 54
- **c) Pure Portable BR Code**: same EMV as (a)/(b) but **without depending on `checkout/pay_*`**, just a plain EMV with `PIX key + value (or not) + merchant name`, ready for printing and pasting elsewhere

Reuses the existing `PaymentLink fixed` (no `ExpiresAt`, `PaymentId null`) and generates a BR Code **offline** via a `PixStaticBrCodeGenerator` (CRC16, field 54 conditional) using the `MerchantPayoutAccount.PixKey`, without calling `TransactionService`/`PixService`/acquirer. Existing polling (`5s`) for `isUnlimitedLink` is reused; for (c) without `PaymentId`, there is no polling.

## User Stories

1. As a merchant, I want to create a Static Pix with a fixed amount, so that I can print a QR and receive unlimited payments of that amount without generating a new link
2. As a merchant, I want to create a Static Pix without an amount, so that the payer can choose the amount in their bank (tips, open‑ended donations)
3. As a merchant, I want a pure portable BR Code (no `pay_*`), so that I can paste/print it anywhere (e.g., commerce counter)
4. As a merchant, I want a list of my Static Pixes, so that I can re‑print/share the same QR
5. As a merchant, I want each Static Pix payment to still generate a `Notification` (Pending) and update my Ledger
6. As a payer, I want to scan a fixed‑value QR and pay exactly that amount, without typing
7. As a payer, I want to scan a no‑value QR and choose the amount in my bank app

## Implementation Decisions

- **Seam**: Extend `PaymentLink` entity (`swiftpay-api-core/Models/Database/Primary/PaymentLink.cs`) with `PixMode: StaticFixed | StaticOpen | StaticPortable` (or `isStatic` + `Amount nullable`), `ExpiresAt = null` for permanence. This is the single truth, no changes to `Payment/PaymentPix`.
- **Branch**: In `StartPaymentLinkEndpoint.cs`, if `IsStatic` → bypass `TransactionService`/`PixService` and generate a BR Code via `PixStaticBrCodeGenerator` (EMV CRC16, field 54 conditional) using `MerchantPayoutAccount.PixKey`. Return `PaymentLinkData.Pix` without `PaymentId/ExpiresAt`.
- **Re‑use**: `GetPaymentLinkEndpoint` already treats `ExpiresAt == null` as `IsUnlimitedLink=true` and hides `Payment`. For static mode without `PaymentId`, there is no countdown.
- **UI**: `payment-link-client.tsx` already has a 5s polling branch for `isUnlimitedLink && paymentId`. For static mode, hide countdown and “Generate new transaction” button.
- **Offline generator**: Create `PixStaticBrCodeGenerator` outside of `IAcquirerService` (no `Bankizi`/`Pluggou` calls).
- **Affected modules**:
  * PaymentLink entity
  * CreatePaymentLinkInternalEndpoint (accept `IsStatic/Amount=null`, relax `PixExpirationMinutes` validation)
  * CreatePaymentLinkEndpoint (merchant HTTP layer)
  * StartPaymentLinkEndpoint
  * payment-link-client.tsx

## Testing Decisions

- Test only external behaviour, not implementation:
  * `POST /v1/payment-links/{token}/start` with `StaticFixed` → must return `Pix.QrCode/CopyAndPaste` without `ExpiresAt` and without creating a `Payment`
  * With `StaticOpen` → same but without field 54
  * With `StaticPortable` → the `CopyAndPaste` must be a plain EMV decodable outside the checkout site
- Use existing `Testcontainers.PostgreSql` for integration; reuse `payment-link-client.tsx` for UI behaviour.
- Test modules: `StartPaymentLinkEndpoint`, `PixStaticBrCodeGenerator`, `GetPaymentLinkEndpoint`

## Out of Scope

- Magic Pay (Stone/Pagar.me) and Eagle Pay, Rusk/Versell — separate spec
- Google Authenticator TOTP — separate spec
- Telegram bot hot and "Depositar na SwiftPay" — backlog ideas
- Static Pix does not create an Order or charge a CheckoutTemplateFee

## Further Notes

Phase 1 = `a + b` together (fixed + open) reusing `PaymentLink fixed`. Phase 2 = `c` (portable BR Code) that does not depend on any `pay_*` flow.