---
description: "Use when implementing payment link start and lifecycle rules, checkout coupling, and cashout processing architecture."
applyTo: 'Endpoints/PaymentLinks/**/*.cs, Endpoints/Cashouts/**/*.cs, Services/**/*PaymentLink*.cs, Services/**/*Cashout*.cs'
---

## Payment Links - Fluxo Publico com Start

- O endpoint interno de criacao de `Payment Link` deve persistir apenas a configuracao do link (sem criar `Payment`).
- A configuracao inclui `EnabledMethods`, valor, descricao e parametros por metodo (PIX/BOLETO).
- O endpoint publico de leitura do link deve funcionar mesmo sem transacao iniciada.
- Deve existir leitura publica por `paymentId` para fluxos de dominio por id: `GET /v1/payment-links/payments/{paymentId}`.
- A criacao da transacao ocorre no endpoint publico de start (`POST /v1/payment-links/{token}/start`) quando o pagador escolhe o metodo.
- Governanca de dominio do link publico:
    - A base do link deve ser configurada no `PlatformSettings` persistido no banco (via endpoint admin), nunca em env.
    - A resolucao deve considerar o metodo de pagamento da cobranca (`Pix`, `Boleto`, `CreditCard`).
    - Configuracao principal no banco:
        - `PlatformSettings.PaymentLinkDomainOptionsJson` (opcoes por metodo com `id`, `name`, `baseUrl`, `isDefault` e `showSafefyBranding`)
    - Override por organizacao:
        - `MerchantSettings.PaymentLinkDomainSelectionJson` (selecao por `id` da opcao por metodo)
    - Campos legados (`PixPaymentLinkBaseUrl`, `BoletoPaymentLinkBaseUrl`, `CreditCardPaymentLinkBaseUrl`) ficam como fallback de compatibilidade.
    - Sem dominio configurado para o metodo, retornar URL por token (sem compor host via env).
    - `BoletoBaseUrl` em env foi descontinuado; `PdfUrl` da adquirente deve ser priorizado em leitura de boleto.
- Ao iniciar:
    - Validar se o metodo escolhido esta em `EnabledMethods`.
    - Criar `Payment` via `ITransactionService`.
    - Marcar a transacao como fluxo de checkout (`IsCheckoutPayment = true`) para aplicar taxas `PixCheckout`/`BoletoCheckout` (nunca `PixApi`/`BoletoApi`).
    - Vincular `PaymentLink.PaymentId` ao pagamento criado.

### Payment Link - Cartao de credito no Start

- O start publico (`POST /v1/payment-links/{token}/start`) deve aceitar `method = CreditCard` quando habilitado no link.
- Para `CreditCard`, o request deve exigir e validar:
    - `cardNumber`
    - `cardHolderName`
    - `cardExpirationMonth`
    - `cardExpirationYear`
    - `cardCvv`
    - `installments` (1 a 12)
- O endpoint deve mapear esses campos para `CreateTransactionInput` no fluxo de criacao da transacao.

### Payment Link - Privacidade de organizacao na visualizacao publica

- Endpoints publicos de `Payment Link` (`GET /v1/payment-links/{token}`, `GET /v1/payment-links/payments/{paymentId}` e resposta de `POST /v1/payment-links/{token}/start`) nao devem expor nome da organizacao/merchant no payload.
- A visualizacao publica deve receber apenas dados da cobranca e do metodo de pagamento.

### Boleto com opcao PIX (hibrido)

- A entidade `PaymentBoleto` deve persistir, quando disponivel, os campos de pagamento PIX vinculados ao boleto:
    - `PixCopyAndPaste`
    - `PixExpiresAt`
- A entidade `PaymentBoleto` deve persistir tambem dados do destinatario/beneficiario do boleto:
    - `RecipientName`
    - `RecipientDocument`
- Nao persistir imagens de boleto/PIX no banco (`PixQrCode`, `BarcodeImageUrl` ou equivalentes).
- Nos payloads publicos de `Payment Link`, quando a transacao for `Boleto` e houver dados de PIX hibrido no `PaymentBoleto`, a resposta deve expor `pix` com base no copia e cola para renderizacao no client.

### Payment Link sem expiracao (permanente)

- Quando `PaymentLink.ExpiresAt` for `null`, o link deve permanecer ativo por tempo indeterminado.
- O start deve permitir multiplas cobrancas no mesmo token ao longo do tempo.
- Se existir cobranca ativa no link permanente, o start deve reutilizar essa cobranca.
- Se a cobranca atual estiver terminal (`Completed`, `Expired`, `Failed`, `Cancelled`, `Refunded`, `PartiallyRefunded`), o start deve criar uma nova cobranca no mesmo token.
- O endpoint `GET /v1/payment-links/{token}` deve expor status de lifetime do link (`isUnlimitedLink`) separado do status da cobranca.
- Em links permanentes, o checkout deve operar por sessao do cliente:
    - abrir o link em nova aba/dispositivo deve iniciar fluxo do zero (sem reaproveitar PIX/BOLETO de outra sessao)
    - o status da cobranca iniciada deve ser consultado por `paymentId` da sessao (`GET /v1/payment-links/{token}/payments/{paymentId}/status`)

### Payment Link ilimitado (sem expiração)

- Quando `PaymentLink.ExpiresAt` for `null`, o link é considerado ilimitado/reutilizável.
- Links ilimitados **não** devem herdar expiração do pagamento gerado (`Payment.ExpiresAt`) nem do vencimento de boleto.
- No start de link ilimitado, o sistema deve permitir gerar múltiplas cobranças no mesmo token.
- Links ilimitados não devem ser finalizados por status da primeira cobrança.

---

## Arquitetura de Saques

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE SAQUES                                      │
└──────────────────────────────────────────────────────────────────────────────┘

          VIA API (safefy-api-payment)         VIA PAINEL (safefy-api)
          ┌─────────────────────────┐         ┌─────────────────────────┐
          │ POST /v1/cashouts       │         │ POST /v1/internal/      │
          │ (autenticação JWT API)  │         │     cashouts            │
          └───────────┬─────────────┘         │ (X-Internal-Api-Key)    │
                      │                       └───────────┬─────────────┘
                      │                                   │
                      └─────────────┬─────────────────────┘
                                    ▼
                      ┌─────────────────────────┐
                      │    CashoutService       │
                      │    (safefy-api-payment) │
                      └───────────┬─────────────┘
                                  │
                                  ▼
                      ┌─────────────────────────┐
                      │    LedgerService        │
                      │    WithdrawService      │
                      │    NotificationService  │
                      └─────────────────────────┘
```

### Conclusão de saque - vínculo obrigatório de adquirente

- A conclusão financeira de saque de organização (`SettlementOut`) exige `AcquirerId` válido.
- Nunca usar `Guid.Empty` como fallback para registrar saída em `AcquirerPayoutsOut`.
- Em webhook/sandbox/reprocess, quando o vínculo da adquirente não puder ser resolvido, o fluxo deve falhar sem escrituração financeira para evitar desvio de saldo entre adquirentes.

---
