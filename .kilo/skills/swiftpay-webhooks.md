# Swiftpay Webhook System

## Sub-skills
- **swiftpay-messaging** — SendWebhook consumer
- **swiftpay-payment-processing** — which events trigger webhooks
- **swiftpay-signalr** — real-time vs webhook delivery

## Architecture
Dual webhook system: **outgoing** (merchant receives) and **incoming** (acquirer sends).

## Outgoing Webhooks (Merchant-facing)

Sent to merchant-configured callback URLs on payment/cashout events.

### Delivery Flow
1. `PaymentCompletedConsumer` publishes `SendWebhook` message
2. `SendWebhookConsumer` resolves `IWebhookService` and calls `SendWebhookAsync(paymentId, eventType)`
3. WebhookService sends HTTP POST with HMAC-SHA256 signature

### HTTP Request Format
```
POST {merchant_callback_url}
Headers:
  X-Swiftpay-Signature: sha256={HMACSHA256(body, payment.Id)}
  X-Swiftpay-Event: payment.completed
  X-Swiftpay-Delivery: {unique_delivery_id}
  X-Swiftpay-Attempt: {retry_count}

Body: JSON com dados do pagamento
```

### Retry Policy
- 3 retries with exponential backoff (2s, 4s, 8s)
- Uses named HttpClient `"webhooks"` with resilience handlers
- After final failure: creates high-priority warning notification for merchant
- Webhook is marked as `CallbackStatus.Pending` before first attempt

### Suppression Rules
- Skip if `SuppressWebhookAndNotification` flag is set on payment
- Skip if `IsWayneProtocol` (internal sampling)

## Incoming Webhooks (Acquirer-facing)

Recebidos dos adquirentes quando há mudança de status no pagamento.

### Auth Middleware
- Route pattern: `/v1/internal/{acquirerCode}/webhook`
- Auth mode determined by `Acquirer.WebhookAuthMode`:
  - **Token**: Compare `Authorization: Bearer` or header tokens (constant-time)
  - **IP**: Check against `WebhookAllowedIps` (CIDR support)
  - **TokenAndIp**: Both required
  - **HmacSha256**: Verify HMAC-SHA256 signature with body + timestamp

### Processing Flow
1. `AcquirerWebhookAuthMiddleware` authenticates + logs
2. Route matches acquirer-specific endpoint (e.g., `BankiziWebhookEndpoint`)
3. Endpoint dispatches by event type: `PIX_IN` → `PaymentProcessingService`, `PIX_OUT` → `CashoutService`
4. `PaymentProcessingService.ProcessAcquirerWebhookAsync` handles status transition

### Webhook Logging
- All incoming webhooks logged to `AcquirerWebhookLogs` table (separate Logs database)
- Sensitive headers redacted before logging
- Geo-location from IP address

## Webhook Event Types
```
payment.completed
payment.expired
payment.failed
payment.refunded
cashout.completed
cashout.failed
```

## Key Rules
- **Never skip webhook auth** for incoming acquirer webhooks
- **Idempotency**: PaymentProcessingService handles duplicate webhooks via optimistic locking
- **Signature verification**: Constant-time comparison for HMAC and token auth
- **Timeouts**: Use resilient HttpClient with 30s timeout for outgoing webhooks
- **No retry for incoming**: Acquirer re-sends on failure (we just ack fast)
