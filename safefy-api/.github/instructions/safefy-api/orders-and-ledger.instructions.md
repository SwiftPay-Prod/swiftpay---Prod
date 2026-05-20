---
description: "Use when working with orders, transactions, cashouts, ledger flows, reconciliation, and financial consistency rules."
applyTo: 'Endpoints/**/Orders/**/*.cs, Endpoints/**/Transactions/**/*.cs, Endpoints/**/Cashouts/**/*.cs, Services/Internal/*Order*.cs, Services/Internal/*Ledger*.cs, Interfaces/*Ledger*.cs, Database/**/*Order*.cs'
---

## Arquitetura de Pedidos (Orders)

O sistema possui duas formas de receber pagamentos: **Gateway (API Direta)** e **E-commerce (Checkout com Orders)**.

### Separação de Responsabilidades

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA ORDER vs PAYMENT                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐    ┌─────────────────────────────────────┐
│            ORDER                │    │            PAYMENT                  │
│    (Contexto de Negócio)        │    │    (Contexto Financeiro)            │
├─────────────────────────────────┤    ├─────────────────────────────────────┤
│ • Produtos e quantidades        │    │ • Valor a pagar (Amount)            │
│ • Cupom de desconto             │    │ • Método de pagamento (PIX)         │
│ • Cliente (obrigatório)         │    │ • Status do pagamento               │
│ • Endereço de entrega           │    │ • QR Code / TxId                    │
│ • Status do pedido              │    │ • Taxas (PlatformFee, AcquirerFee)  │
│ • Status de fulfillment         │    │ • Conciliação bancária              │
│ • Cálculos (subtotal, desc,     │    │ • Cliente (opcional - gateway)      │
│   frete, total)                 │    │                                     │
└─────────────────────────────────┘    └─────────────────────────────────────┘
                │                                         │
                │           1:1 (quando e-commerce)       │
                └─────────────────────────────────────────┘
```

### Fluxos de Pagamento

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           FLUXOS DE PAGAMENTO                                 │
└──────────────────────────────────────────────────────────────────────────────┘

                    E-COMMERCE (Checkout → Order → Payment)
                    
    Cliente acessa Checkout → Seleciona produtos → Preenche dados
                                    │
                                    ▼
                    Cria Order com items, cupom, cliente, endereço
                                    │
                                    ▼
                    Order calcula totais (subtotal, desconto, frete)
                                    │
                                    ▼
                    Order cria Payment automaticamente
                    └── Payment.Amount = Order.TotalAmount
                    └── Payment.OrderId = Order.Id
                    └── Payment.CustomerId = Order.CustomerId


                    GATEWAY (API Direta → Payment apenas)
                    
    Merchant integra via API → POST /v1/transactions
    { amount, customerId?, method: "pix" }
                                    │
                                    ▼
                    Cria Payment direto (OrderId = null)
                    └── Payment puramente financeiro
                    └── Sem produtos, sem cupons, sem frete
```

### Cartão de crédito - integração sem card token

- A integração interna com `safefy-api-payment` para criação de transação não deve enviar `cardToken`.
- Para fluxo de cartão, enviar campos diretos no payload interno:
    - `cardNumber`
    - `cardHolderName`
    - `cardExpirationMonth`
    - `cardExpirationYear`
    - `cardCvv`
    - `installments`
- Respostas de transação para frontend/painel não devem expor dados sensíveis de cartão.

### Entidades

**Order (Pedido)**

```csharp
Order
├── Id (PK)
├── MerchantId (FK)
├── CustomerId (FK) - Obrigatório
├── CheckoutId (FK) - Opcional (origem do checkout)
├── CouponId (FK) - Opcional
├── Environment (Sandbox/Production)
├── Status (OrderStatus enum)
├── FulfillmentStatus (OrderFulfillmentStatus enum)
├── SubtotalAmount (soma dos itens)
├── DiscountAmount (desconto do cupom)
├── ShippingAmount (frete)
├── TotalAmount (subtotal - desconto + frete)
├── CouponCode (snapshot do código usado)
├── Notes (observações)
├── ShippingAddress (JSONB)
├── OrderNumber (ex: "ORD-20260125-0001")
├── Items (1:N → OrderItem)
└── Payment (1:1 → Payment)
```

**OrderItem (Item do Pedido)**

```csharp
OrderItem
├── Id (PK)
├── OrderId (FK)
├── ProductId (FK)
├── VariantId (FK) - Opcional
├── ProductName (snapshot)
├── VariantName (snapshot)
├── Sku (snapshot)
├── ImageUrl (snapshot)
├── Quantity
├── UnitPrice (preço unitário no momento)
├── TotalPrice (quantity * unitPrice)
└── CreatedAt
```

**Payment (Pagamento) - Simplificado**

```csharp
Payment
├── Id (PK)
├── MerchantId (FK)
├── OrderId (FK) - Opcional (null = gateway)
├── CustomerId (FK) - Opcional (gateway pode ter cliente)
├── Environment
├── Amount (valor final a pagar)
├── Method, Status
├── PlatformFee, AcquirerFee
├── NetAmount, AcquirerNetAmount
├── PIX data (TxId, QrCode, etc)
└── Timestamps
```

### Enums de Status

**OrderStatus:**

| Status | Descrição |
|--------|-----------|
| `Pending` | Pedido criado, aguardando pagamento |
| `Processing` | Pagamento confirmado, em processamento |
| `Completed` | Pedido finalizado |
| `Cancelled` | Pedido cancelado |
| `Refunded` | Pedido estornado |

**OrderFulfillmentStatus:**

| Status | Descrição |
|--------|-----------|
| `Unfulfilled` | Não preparado |
| `PartiallyFulfilled` | Parcialmente preparado |
| `Fulfilled` | Preparado para envio |
| `Shipped` | Enviado |
| `Delivered` | Entregue |

### Regras Importantes

1. **Order é DONO do contexto de negócio** - produtos, cupom, cliente, endereço, cálculos
2. **Payment é APENAS financeiro** - valor, método, status, taxas, conciliação
3. **Gateway NÃO cria Order** - Payment direto com OrderId = null
4. **E-commerce SEMPRE cria Order** - Order cria Payment automaticamente
5. **Customer pode estar em ambos** - Payment.CustomerId (gateway) ou Order.CustomerId (e-commerce)
6. **Order.TotalAmount = Payment.Amount** - Valores sincronizados
7. **Snapshots em OrderItem** - ProductName, VariantName, Sku, ImageUrl são copiados no momento da criação (histórico)

### KPIs no detalhe do Checkout (merchant)

- O endpoint `GET /v1/merchant/{merchantId}/checkouts/{checkoutId}` deve retornar `kpis` no `CheckoutData` com:
    - `accessCount`: quantidade de sessões distintas (`Order.SessionId`) originadas no checkout
    - `revenueAmount`: soma de `Order.TotalAmount` apenas para pedidos com `Payment.Status = Completed`
    - `orderCount`: total de pedidos criados para o checkout
    - `transactionCount`: total de pedidos que possuem transação (`Order.Payment != null`)
    - `completedTransactions`: total de transações com `Payment.Status = Completed`
    - `approvalRate`: percentual de aprovação calculado por `completedTransactions / transactionCount`
    - `customerCount`: total de clientes únicos (`Order.CustomerId`) no checkout
- Para cálculo de KPIs no read de checkout, incluir `Orders` com `Payment` no carregamento da entidade antes do mapeamento.

### Detalhe de transação do merchant (checkout e reserva)

- O endpoint `GET /v1/merchant/{merchantId}/payments/{paymentId}` deve retornar metadados de origem do checkout no `PaymentDetails`:
    - `requestSource`
    - `isCheckoutPayment`
    - `checkoutId`
    - `checkoutName`
- O campo `checkoutFeeAmount` deve refletir o valor persistido em `Payment.CheckoutTemplateFee` (centavos), sem recalcular pela configuração atual do `CheckoutTemplate`.
- O mesmo endpoint deve retornar `reserveDeductedAmount` (em centavos), calculado como a diferença positiva entre `NetAmount` e o valor efetivamente liquidado ao merchant (`MerchantSettlementAmount` exibido como `NetAmount` no payload).
- Quando não houver retenção por reserva financeira, `reserveDeductedAmount` deve ser `0`.

---

## Arquitetura Financeira - Ledger (Livro Razão)

A plataforma utiliza a **arquitetura de Ledger (Livro Razão)**, o mesmo padrão utilizado por bancos e instituições financeiras para garantir integridade e rastreabilidade das transações.

### Princípios do Ledger

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         ARQUITETURA LEDGER                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  REGRA FUNDAMENTAL: Toda movimentação financeira é IMUTÁVEL                  │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                       │
│  │   CRÉDITO   │    │   DÉBITO    │    │   SALDO     │                       │
│  │  (Entrada)  │ +  │   (Saída)   │ =  │  (Balance)  │                       │
│  └─────────────┘    └─────────────┘    └─────────────┘                       │
│                                                                              │
│  • Nunca deletamos transações - apenas criamos lançamentos de estorno        │
│  • Cada transação tem: amount, type (credit/debit), balance_after            │
│  • O saldo é calculado pela soma de todas as transações                      │
│  • Auditoria completa: quem, quando, quanto, por quê                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Tipos de Transações no Ledger

| Tipo | Operação | Descrição |
|------|----------|-----------|
| `PaymentReceived` | Crédito | Pagamento PIX recebido |
| `PaymentRefunded` | Débito | Estorno de pagamento |
| `FeeCharged` | Débito | Taxa cobrada pela plataforma |
| `WithdrawalRequested` | Débito | Saque solicitado |
| `WithdrawalCompleted` | - | Saque confirmado (já debitado) |
| `WithdrawalFailed` | Crédito | Saque falhou, valor devolvido |
| `Adjustment` | Crédito/Débito | Ajuste manual (admin) |

### Fluxo de Pagamento no Ledger

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO: PAGAMENTO PIX RECEBIDO                              │
└──────────────────────────────────────────────────────────────────────────────┘

1. Cliente paga R$ 100,00 via PIX
   └── Adquirente notifica via webhook

2. Sistema registra no Ledger:
   ┌────────────────────────────────────────────────────────────────┐
   │ Transaction #1: PaymentReceived                                │
   │ ├── Amount: +R$ 100,00 (crédito)                               │
   │ ├── Balance After: R$ 100,00                                   │
   │ └── Reference: payment_id                                      │
   ├────────────────────────────────────────────────────────────────┤
   │ Transaction #2: FeeCharged                                     │
   │ ├── Amount: -R$ 2,00 (débito - taxa 2%)                        │
   │ ├── Balance After: R$ 98,00                                    │
   │ └── Reference: payment_id                                      │
   └────────────────────────────────────────────────────────────────┘

3. Saldo disponível do merchant: R$ 98,00
```

### Fluxo de Saque no Ledger

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO: SAQUE SOLICITADO                                    │
└──────────────────────────────────────────────────────────────────────────────┘

1. Merchant solicita saque de R$ 50,00
   ┌────────────────────────────────────────────────────────────────┐
   │ Transaction: WithdrawalRequested                               │
   │ ├── Amount: -R$ 50,00 (débito)                                 │
   │ ├── Balance After: R$ 48,00                                    │
   │ ├── Status: Pending                                            │
   │ └── Reference: withdrawal_id                                   │
   └────────────────────────────────────────────────────────────────┘

2a. Se saque APROVADO:
    └── Status atualizado para Completed (sem nova transação)

2b. Se saque FALHAR:
   ┌────────────────────────────────────────────────────────────────┐
   │ Transaction: WithdrawalFailed                                  │
   │ ├── Amount: +R$ 50,00 (crédito - devolução)                    │
   │ ├── Balance After: R$ 98,00                                    │
   │ └── Reference: withdrawal_id                                   │
   └────────────────────────────────────────────────────────────────┘
```

### Regras do Ledger

1. **Imutabilidade**: Transações nunca são alteradas ou deletadas
2. **Rastreabilidade**: Toda transação tem referência à operação original
3. **Consistência**: Saldo sempre igual à soma de créditos - débitos
4. **Atomicidade**: Operações financeiras são atômicas (tudo ou nada) - usa SQL transactions com `ExecuteSqlRawAsync`
5. **Auditoria**: Timestamps, user_id, ip_address em todas as operações
6. **Saques da plataforma**: Registrar `LedgerTransactions` com `PlatformPayoutId` (nunca usar `PayoutId` para saque da plataforma)
7. **Idempotência de saque do merchant**: Deve existir no banco um único `LedgerTransaction` de `Operation = SettlementOut` por `PayoutId`; proteções em aplicação são complementares, não substituem o índice único filtrado.

### Reconciliação Bancária (Merchant) - Regras Atualizadas

- A reconciliação do merchant deve comparar **impacto esperado por conta** vs **impacto real no ledger** para as contas:
    - `MerchantAvailable`
    - `MerchantPending`
    - `MerchantBlocked`
    - `MerchantPayoutsOut`
- O cálculo deve considerar o fluxo completo:
    - Pagamento pendente → `Pending`
    - Pagamento confirmado → `Available`
    - Estorno total/parcial → débito proporcional em `Available`
    - Saque solicitado → `Available` → `Blocked`
    - Saque concluído → `Blocked` → `PayoutsOut` (líquido)
    - Saque falho/rejeitado/cancelado → impacto líquido final deve ser zero
- **Não usar** validação simplista por operação única (`PixIn`, `PayOut`) para detectar duplicidade, pois o mesmo pagamento/saque pode gerar múltiplas transações legítimas no ledger.
- A aplicação de correções da reconciliação deve ser **idempotente** e ajustar saldos das contas para o valor calculado.
- A aplicação das correções deve ocorrer por lançamentos automáticos no ledger com atualização atômica de saldo, e nunca por alteração direta de `Account.Balance`.
- Em processamento assíncrono (consumer/job), a reconciliação deve executar com escopo explícito de ambiente (`HybridEnvironmentProvider.SetEnvironment(message.Environment)`) para respeitar os query filters globais.
- Para corrigir impactos por pagamento/saque sem violar imutabilidade, criar **lançamentos de ajuste** no ledger (operação `Reversal`) vinculados ao `PaymentId`/`PayoutId` afetado.
- Saldo `MerchantAvailable` negativo deve gerar discrepância crítica explícita (`NegativeAvailableBalance`) com investigação manual obrigatória.
- Quando o total de saques (`Pending/Processing/Confirming/Completed`) exceder a entrada líquida suportada (pagamentos líquidos + ajustes manuais), registrar discrepância crítica explícita (`WithdrawalExceedsInflow`) com `ExpectedAmount`, `ActualAmount` e `Difference`.
- Quando existirem discrepâncias críticas não auto-corrigíveis (ex.: `NegativeAvailableBalance`), a reconciliação deve permanecer `CompletedWithDiscrepancies` após aplicar ajustes parciais, sem marcar sucesso total.
- **Nunca remover** lançamentos históricos do ledger para corrigir reconciliação.
- Divergências devem registrar claramente `ExpectedAmount`, `ActualAmount` e `Difference`, além de severidade e sugestão de ação.

---



