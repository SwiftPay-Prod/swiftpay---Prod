# AkkadPag Integration + PIX-Only Mode

## Context

SwiftPay currently operates with MagicPay as the sole acquirer. The product now needs AkkadPag as the primary acquirer, with MagicPay retained as fallback. Simultaneously, credit card and boleto must be disabled platform-wide until further notice. This is a production change affecting backend acquirer routing, frontend payment methods, and checkout flows.

## Current State

- Backend acquirer architecture is multi-acquirer ready (`IAcquirerService`, `IAcquirerServiceFactory`).
- MagicPay is fully implemented: client, service, webhooks, models, status converters.
- Frontend exposes PIX, Boleto, and Credit Card across checkout, payment links, admin settings, and merchant dashboards.
- `PlatformSettings` and `MerchantSettings` already have `PixEnabled`, `BoletoEnabled`, `CreditCardEnabled` flags.
- `Acquirer` entity supports `SupportsPix`, `SupportsBoleto`, `SupportsCreditCard`.
- No AkkadPag client, models, webhook handler, or seed data exists.

## AkkadPag API Contract (confirmed)

- Base URL: `https://api.akkadpag.com/v1`
- Auth: Basic Access Authentication with `Authorization: Basic {base64(public_key:secret_key)}`
- PIX transaction:
  - `POST /v1/transactions`
  - Required: `amount` (cents), `payment_method: "PIX"`, `items`, `customer`
  - Optional: `postback_url`, `splits`, `utm`
  - Response includes `pix.copy_paste`, `pix.expires_at`, `status`, `fee`, `net_amount`
  - Statuses: `WAITING_PAYMENT`, `PENDING`, `APPROVED`, `PAID`, `REFUSED`, `CANCELLED`, `REFUNDED`, `IN_PROTEST`, `CHARGEBACK`
- Transaction query:
  - `GET /v1/transactions/:id`
- Withdrawal:
  - `POST /v1/transfers`
  - Header: `x-withdrawal-key`
  - Body: `amount`, `pix_key`, `pix_key_type`, `document` (optional), `postback_url` (optional)
  - Response: `id`, `status`, `amount`, `net_amount`, `fee`, `pix_key`, `pix_key_type`, `auto_withdraw`
  - Statuses: `PENDING_ANALYSIS`, `PROCESSING`, `COMPLETED`, `REFUSED`, `CANCELLED`
  - Query: `GET /v1/transfers/:id`
- Webhooks:
  - Configurable per transaction via `postback_url` or globally in panel
  - Transaction events: `transaction.waiting_payment`, `transaction.paid`, `transaction.refunded`
  - Withdrawal events: `withdrawal.processing`, `withdrawal.completed`, `withdrawal.failed`
  - Retry: exponential backoff on non-2xx
  - No explicit HMAC/signature header documented; validate by event structure and idempotency
- Company/balance:
  - `GET /v1/company/details`
  - `GET /v1/company/balance`
- Rate limit: `429` possible; no explicit limit documented. Use conservative retry/backoff.

## Proposed Change

Introduce AkkadPag as the primary acquirer with MagicPay as automatic fallback, and reduce the platform to PIX-only UX/behavior while keeping Boleto/Credit Card code paths intact but disabled.

### Implementation Details

#### 1. AkkadPag Backend Integration

- Add AkkadPag client under `swiftpay-api-payment/Clients/AkkadPag/`:
  - `AkkadPagClient.cs`
  - Request/response models for PIX transaction, query, withdrawal, company/balance
  - Webhook models for transaction and withdrawal events
- Add `AkkadPagService.cs` implementing `IAcquirerService`
- Add status converter `AkkadPagStatusConverter.cs`
- Add webhook endpoints:
  - `swiftpay-api-payment/Endpoints/Acquirers/AkkadPag/Webhook/AkkadPagTransactionWebhookEndpoint.cs`
  - `swiftpay-api-payment/Endpoints/Acquirers/AkkadPag/Webhook/AkkadPagWithdrawalWebhookEndpoint.cs`
- Register AkkadPag in `AcquirerServiceFactory` and DI
- Seed AkkadPag acquirer record in `AcquirerInitializer.cs` with:
  - `DisplayName = "AkkadPag"`
  - `Nominal = "AkkadPag"`
  - `SupportsPix = true`
  - `SupportsBoleto = false`
  - `SupportsCreditCard = false`
  - `SupportsWithdrawal = true`
  - API credentials configurable via environment/admin

#### 2. Primary/Fallback Routing

- Update `PaymentProcessingService`/transaction creation to prefer AkkadPag when:
  - AkkadPag is active
  - AkkadPag supports the requested method
  - AkkadPag health check succeeds
- Fallback to MagicPay if AkkadPag fails or is disabled
- Expose acquirer selection/switching in admin and merchant flows:
  - Admin can set preferred acquirer per merchant or globally
  - Merchant can view current active acquirer
  - Keep explicit override option to force MagicPay when needed

#### 3. PIX-Only Enforcement

- Set platform default:
  - `PlatformSettings.BoletoEnabled = false`
  - `PlatformSettings.CreditCardEnabled = false`
  - `PlatformSettings.PixEnabled = true`
- Frontend changes:
  - Hide/disable Boleto and Credit Card tabs, routes, and selection UI
  - Remove Boleto/Credit Card options from checkout, payment links, and onboarding
  - Keep backend validation rejecting Boleto/Credit Card requests with clear error
- Admin UI:
  - Disable Boleto/Credit Card accordions
  - Show banner that only PIX is enabled

#### 4. Frontend Acquirer Selection

- Admin acquirer page:
  - Add AkkadPag to acquirer table with status/health
  - Add primary/fallback selector and manual override toggle
- Merchant checkout/payment-link creation:
  - Show only PIX as available method
  - Show active acquirer branding when applicable

#### 5. Observability

- Add AkkadPag health check via `GET /v1/company/balance` or `GET /v1/company/details`
- Log acquirer selection and fallback events in security/api logs
- Add AkkadPag webhook validation failure tracking with idempotency by transaction/withdrawal ID

## Acceptance Criteria

1. AkkadPag PIX transaction flow works end-to-end against AkkadPag API
2. AkkadPag withdrawal flow works end-to-end
3. AkkadPag webhook is accepted and updates order/payment status correctly
4. When AkkadPag is unavailable, system falls back to MagicPay automatically for PIX
5. Admin can manually override acquirer selection per merchant or globally
6. Boleto and Credit Card are not selectable in checkout, payment links, or admin settings
7. API rejects Boleto/Credit Card creation attempts with HTTP 400 and clear message
8. Existing MagicPay orders/webhooks continue to work without migration
9. Production deployment succeeds via GitHub Actions
10. No regression in current PIX/MagicPay flows

## Testing Plan

| Layer | What | Count |
|-------|------|-------|
| Unit | AkkadPag client, status converter, factory selection logic | +6 |
| Integration | AkkadPag PIX create/query/webhook | +3 |
| Integration | AkkadPag withdrawal create/query/webhook | +2 |
| Integration | Fallback from AkkadPag to MagicPay on failure | +2 |
| E2E | Admin sets primary acquirer, merchant checkout uses AkkadPag | +2 |
| Regression | MagicPay webhook/order flow still works | +2 |

## Rollback Plan

- Disable AkkadPag via admin toggle or feature flag
- Re-enable Boleto/Credit Card via `PlatformSettings` booleans
- Revert to MagicPay-only by setting AkkadPag `IsActive = false`
- Rollback deploy via GitHub Actions revert PR

## Effort Estimate

- Backend AkkadPag client/service/webhook: ~10-14h
- Routing/fallback/primary logic: ~3-5h
- PIX-only backend enforcement: ~2-3h
- Frontend PIX-only hide/disable: ~3-4h
- Frontend acquirer selection UI: ~3-4h
- Tests and validation: ~3-4h
- Production deploy verification: ~2h

## Files Reference

| File | Change |
|------|--------|
| `swiftpay-api-payment/Clients/AkkadPag/AkkadPagClient.cs` | New |
| `swiftpay-api-payment/Clients/AkkadPag/Models/*.cs` | New |
| `swiftpay-api-payment/Services/Acquirers/AkkadPagService.cs` | New |
| `swiftpay-api-payment/Services/Acquirers/Utils/AkkadPagStatusConverter.cs` | New |
| `swiftpay-api-payment/Endpoints/Acquirers/AkkadPag/Webhook/AkkadPagTransactionWebhookEndpoint.cs` | New |
| `swiftpay-api-payment/Endpoints/Acquirers/AkkadPag/Webhook/AkkadPagWithdrawalWebhookEndpoint.cs` | New |
| `swiftpay-api-payment/Services/Acquirers/AcquirerServiceFactory.cs` | Update |
| `swiftpay-api-payment/Services/PaymentProcessingService.cs` | Update |
| `swiftpay-api/Database/AcquirerInitializer.cs` | Update |
| `swiftpay-web/src/app/panel/(main)/admin/platform-settings/components/*` | Update |
| `swiftpay-web/src/app/panel/(main)/merchant/checkouts/**` | Update |
| `swiftpay-web/src/app/panel/(main)/merchant/payment-links/**` | Update |

## Open Questions

- None. Documentation provided covers transactions, withdrawals, webhooks, retry policy, and query endpoints.

## Out of Scope

- Multi-acquirer simultaneous split routing within a single transaction
- Boleto/Credit Card re-enablement planning
- AkkadPag sandbox mode separate from MagicPay sandbox
- Email verification/resend setup
- Subscription/recurring billing via AkkadPag

## Related

- Phase 9 — MagicPay integration complete
- Phase 10 — Testing and stabilization pending
