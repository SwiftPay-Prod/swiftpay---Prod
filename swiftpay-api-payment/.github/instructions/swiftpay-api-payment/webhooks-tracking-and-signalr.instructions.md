---
description: "Use when implementing acquirer webhooks, merchant webhooks, tracking integrations, and payment status signaling."
applyTo: 'Endpoints/Internal/**/*.cs, Endpoints/Acquirers/**/*.cs, EndpointsGroups/Acquirers/*.cs, Services/Acquirers/**/*.cs, Services/Helpers/WebhookFieldResolver.cs, Services/**/*Webhook*.cs'
---

## Arquitetura de Webhooks

### 1. Webhooks das Adquirentes → swiftpay-api-payment

**IMPORTANTE**: Os endpoints de webhook das adquirentes ficam **exclusivamente** nesta API.

| Adquirente | Endpoint |
|------------|----------|
| Bankizi | `POST /v1/internal/bankizi/webhooks` |
| IHub Banking | `POST /v1/internal/ihubbanking/webhooks` |
| ActivePayments | `POST /v1/internal/activepayments/webhooks` |
| Rapdyn | `POST /v1/internal/rapdyn/webhooks` |
| Coldfy | `POST /v1/internal/coldfy/webhooks` |
| HeartPay | `POST /v1/internal/heartpay/webhooks` |
| (futuras) | `POST /v1/internal/{acquirer}/*` |

**Responsabilidades do endpoint de webhook da adquirente:**
1. Identificar o pagamento/saque pelo `TxId` ou `EndToEndId`
2. Atualizar status do `Payment` ou `Payout` no banco
3. Registrar transação no `Ledger`
4. Disparar webhook para o merchant

**Tipos de eventos suportados:**

| Evento | Descrição | Serviço |
|--------|-----------|---------|
| `PIX_IN` | Pagamento PIX recebido | `IPaymentProcessingService` |
| `PIX_OUT` | Saque PIX processado | `ICashoutService` |

**Status de PIX_IN (Cash In):**

| Status | Descrição |
|--------|-----------|
| `GENERATED` | PIX gerado, aguardando pagamento |
| `PAID` | Pagamento confirmado |
| `REQUESTED_REFUND` | Reembolso solicitado |
| `REFUNDED` | Totalmente reembolsado |
| `PARTIALLY_REFUNDED` | Parcialmente reembolsado |
| `EXPIRED` | PIX expirado |
| `CANCELLED` | PIX cancelado |

**Status de PIX_OUT (Cash Out/Saque):**

| Status | Descrição |
|--------|-----------|
| `GENERATED` | Transação iniciada |
| `DONE` | Saque concluído com sucesso |
| `FAILED` | Falha técnica no processamento |
| `REJECT` | Saque rejeitado |
| `REFUNDED` | Valor total devolvido |
| `PARTIALLY_REFUNDED` | Parte do valor devolvido |

**Regra de segurança de status (obrigatória):**
- No processamento de webhook de saque, apenas status terminais conhecidos podem movimentar saldo:
    - `Completed` -> concluir saque no ledger
    - `Failed` ou `Rejected` -> reverter saldo bloqueado no ledger
- `Cancelled` de adquirente deve ser normalizado para `PayoutStatus.Cancelled`, nunca para `Failed`, mantendo notificacao e webhook `cashout.cancelled`
- Status não terminais ou desconhecidos (`Processing`, `Pending`, `Approved`, `Unknown`, variações não mapeadas) **não podem** movimentar saldo nem alterar estado financeiro.
- Quando o payload trouxer `event` e `status`, o mapeamento deve priorizar o `status` explícito de falha/rejeição para evitar falso positivo de processamento.
- Se já existir lançamento `SettlementOut` para o `PayoutId`, webhooks tardios de `Failed`/`Rejected` devem ser ignorados para evitar downgrade indevido de status e reversão de bloqueio já liquidado.
- Deve existir no banco um único `LedgerTransaction` de `Operation = SettlementOut` por `PayoutId`.
- A deduplicação de conclusão de saque não pode depender apenas de `AnyAsync` em aplicação; a fonte final de idempotência deve ser um índice único filtrado no banco.
- Fluxos concorrentes de consumer e webhook devem compartilhar o mesmo lock terminal (`Processing -> Confirming`) e um `Confirming` ativo não deve ser rearmado imediatamente por outro fluxo.

**Regra de idempotência para itens de saque da plataforma:**
- A conclusão financeira de `PlatformPayoutItem` deve ser deduplicada por `PlatformPayoutItemId` no ledger.
- Todo fluxo que concluir item de saque da plataforma deve propagar `platformPayoutItemId` para `RecordPlatformWithdrawalCompletedAsync`, inclusive:
    - consumer principal
    - webhook da adquirente
    - reprocessamento DEV
    - saque simulado/admin
- A fonte final de idempotência para conclusão de item deve incluir índice único filtrado em `LedgerTransactions` para `PlatformPayoutItemId + Operation = PlatformPayOut`.
- Em fluxos de conclusão de item, se o registro de conclusão no ledger falhar, o item deve retornar para `Processing` (com `CompletedAt = null`) para evitar estado `Completed` sem escrituração financeira.
- Em fluxos de falha/cancelamento de item, se o estorno no ledger falhar, o item deve retornar para `Processing` para evitar estado terminal sem reversão financeira.

**Autenticação do webhook (centralizada no middleware):**

O `AcquirerWebhookAuthMiddleware` cuida da autenticação automaticamente para todas as rotas `v1/internal/{acquirer}/*`.

**Códigos por variante da mesma adquirente (obrigatório):**
- Quando existirem múltiplos cadastros ativos do mesmo provedor (ex.: `heartpay`, `heartpay_1`, `heartpay_2`), a autenticação do webhook deve resolver candidatos por família de código da rota (`{acquirer}` e prefixo `{acquirer}_`).
- A seleção final da adquirente deve ser determinada pela validação de autenticação (`Token`, `Ip`, `TokenAndIp` ou `HmacSha256`) e não por igualdade exata de código.
- Para provedores com validação específica por código (ex.: HeartPay), a regra deve aceitar também variantes com sufixo (`heartpay_*`).

**Modos de autenticação (`WebhookAuthMode`):**

| Modo | Descrição |
|------|-----------|
| `Token` | Autenticação via token no header (padrão) |
| `Ip` | Autenticação via IP de origem |
| `TokenAndIp` | Ambos obrigatórios |
| `HmacSha256` | Assinatura HMAC SHA256 no header `X-Webhook-Signature` |

**Auditoria dedicada de webhook (obrigatória):**
- Todo webhook autenticado de adquirente deve ser registrado na tabela dedicada `AcquirerWebhookLogs` no banco de logs.
- O registro deve incluir payload bruto (`RequestBody`), headers (`RequestHeaders` com mascaramento de segredo), adquirente (`AcquirerId`, `AcquirerType`, `AcquirerCode`) e metadados de rede (`IpAddress`, `UserAgent`, `Location`, `CorrelationId`, etc.).
- Esse log é independente de `ApiLogs` e deve permitir rastreabilidade completa da entrada recebida.

### 2. Webhooks SwiftPay → Merchants

Após processar o webhook da adquirente, a API envia um webhook **padronizado** para o `CallbackUrl` do pagamento.

**Headers enviados no webhook:**

| Header | Descrição |
|--------|-----------|
| `X-SwiftPay-Signature` | Assinatura HMAC-SHA256 do payload |
| `X-SwiftPay-Event` | Tipo do evento |
| `X-SwiftPay-Delivery` | ID único da entrega |
| `X-SwiftPay-Attempt` | Número da tentativa (1, 2, 3) |
| `User-Agent` | SwiftPay-Webhook/1.0 |

**Eventos enviados para o merchant:**

| Evento | Descrição |
|--------|-----------|
| `payment.completed` | Pagamento confirmado |
| `payment.expired` | Cobrança expirou |
| `payment.failed` | Pagamento falhou |
| `cashout.completed` | Saque concluído |
| `cashout.failed` | Saque falhou |
| `cashout.rejected` | Saque rejeitado |
| `cashout.cancelled` | Saque cancelado |

**Retry automático:**
- Exponential backoff: 2s, 4s, 8s
- Máximo de 3 tentativas

## Integracao Utmify (Tracking de Vendas)

- O disparo para Utmify deve passar por um wrapper de integracoes (`ITransactionTrackingIntegrationService`) antes de qualquer envio HTTP.
- O wrapper deve validar por merchant/acquirer:
    - integracao habilitada (`enabled`)
    - token configurado (`apiToken`)
    - notificacao do evento habilitada
- A configuracao deve ser lida da tabela dedicada `MerchantIntegrations` por `MerchantId + Provider + Environment`, usando `ConfigValues` por chave de schema (`apiToken` para Utmify).
- Endpoint de envio:
    - `POST https://api.utmify.com.br/api-credentials/orders`
    - header `x-api-token`
- O campo `platform` no body deve ser fixo como `SwiftPayPay`.
- Mapeamento de eventos de pagamento para notificacoes Utmify:
    - `Pending` -> `waiting_payment` (flag `waitingPayment`)
    - `Completed` -> `paid` (flag `paid`)
    - `Failed|Cancelled|Expired` -> `refused` (flag `refused`)
    - `Refunded|PartiallyRefunded` -> `refunded` (flag `refunded`)
    - `Disputed` -> `chargedback` (flag `chargedback`)
- Falha no envio para Utmify nao deve quebrar o fluxo financeiro principal; registrar apenas `LogError`.

## Integracao Otimizey (Tracking de Vendas)

- O disparo para Otimizey deve passar pelo wrapper de integracoes (`ITransactionTrackingIntegrationService`).
- A configuracao deve ser lida da tabela `MerchantIntegrations` por `MerchantId + Provider + Environment`, usando `ConfigValues` por chave de schema (`credentialId` para Otimizey).
- Endpoint de envio:
    - `POST https://api.otimizey.com.br/webhooks/credential/{credentialId}`
- O `credentialId` deve ser lido do campo `ApiToken` da configuracao da integracao.
- Mapeamento de status de pagamento para Otimizey:
    - `Pending` -> `waiting_payment`
    - `Processing` -> `in_process`
    - `Completed` -> `paid`
    - `Failed|Cancelled` -> `refused`
    - `Expired` -> `expired`
    - `Refunded|PartiallyRefunded` -> `refunded`
    - `Disputed` -> `in_dispute`
- Falha no envio para Otimizey nao deve quebrar o fluxo financeiro principal; registrar apenas `LogError`.

---

## Padrao de Integracao de Adquirentes

As regras completas de integracao de adquirentes foram centralizadas em:

- `.github/instructions/acquirer-integration.instructions.md`

Ao criar ou manter adquirente, siga esse arquivo dedicado como fonte de verdade.

---

## SignalR - Status de Pagamento (Checkout)

O checkout consome atualizações em tempo real do status de um pagamento específico via SignalR:

**Hub:**
- `/hubs/payment-status`

**CORS:**
- Permitido somente para `PlatformSettings:CheckoutBaseUrl` (CheckoutCorsPolicy)

**Conexão:**
- Query string obrigatória: `paymentId`

**Evento emitido:**
- `PaymentStatusChanged`

**Contrato do evento (campos mínimos):**
- `paymentId`
- `status` (enum de status de pagamento vigente no domínio)

**Origem das notificações:**
- `PaymentCompletedConsumer` publica o evento sempre que o status do pagamento muda

---
