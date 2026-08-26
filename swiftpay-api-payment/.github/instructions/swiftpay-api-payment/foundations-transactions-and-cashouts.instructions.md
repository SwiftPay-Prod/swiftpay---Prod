---
description: "Use when editing environment filtering, platform overview, transaction architecture, and cashout entry flows in swiftpay-api-payment."
applyTo: 'Program.cs, Endpoints/Transactions/**/*.cs, Endpoints/Cashouts/**/*.cs, Endpoints/Internal/Cashouts/**/*.cs, Services/**/*.cs, Middlewares/**/*.cs'
---

# SwiftPay API Payment - Copilot Instructions

Este documento descreve os padrões e convenções utilizados no projeto SwiftPay API Payment para criação de endpoints de pagamento, integração com adquirentes e processamento de transações.

> **⚠️ IMPORTANTE PARA O COPILOT**: Sempre que houver alterações na arquitetura do sistema, estrutura de dados, fluxos de negócio ou padrões de código, **ATUALIZE ESTE ARQUIVO** para manter a documentação sincronizada com o código.

---

## ⚠️ REGRA PRIORITÁRIA: Filtro de Environment no PrimaryDbContext

> **CRÍTICO**: O `PrimaryDbContext` aplica automaticamente um filtro global de `Environment` (Sandbox/Production) em todas as queries. Esse filtro é configurado pelo `IEnvironmentProvider` que lê o header `X-Environment` da requisição HTTP.

### Problema em Contextos sem HTTP Request

**Em Consumers (MassTransit), Background Jobs ou qualquer contexto sem HTTP request, o `IEnvironmentProvider` não terá o header configurado.** Isso pode causar:

1. Queries retornando dados do ambiente errado
2. Contas (Account) sendo criadas ou acessadas no ambiente incorreto
3. Inconsistências no Ledger entre Sandbox e Production

### Solução Obrigatória

**Em Consumers/Jobs que recebem `Environment` na mensagem:**

```csharp
// ✅ CORRETO - Usar IgnoreQueryFilters() e filtrar manualmente
var accounts = await dbContext.Accounts
    .IgnoreQueryFilters()  // Ignora filtro global
    .Where(a => a.MerchantId == merchantId 
             && a.Environment == environment  // Filtro manual explícito
             && a.Type == AccountType.MerchantAvailable)
    .ToListAsync();

// ❌ ERRADO - Depender do filtro global em Consumer
var accounts = await dbContext.Accounts
    .Where(a => a.MerchantId == merchantId 
             && a.Type == AccountType.MerchantAvailable)
    .ToListAsync();
```

**Em Endpoints HTTP (com request):**
- O filtro global funciona automaticamente
- **Não use** `IgnoreQueryFilters()` a menos que tenha certeza do que está fazendo
- Em endpoints autenticados por credencial na `swiftpay-api-payment`, o ambiente do token (`claim environment`) é propagado no `CredentialValidationMiddleware` via `HybridEnvironmentProvider.SetEnvironment(...)` para manter o `DbContext` consistente com o ambiente da credencial

**Locais que DEVEM usar `IgnoreQueryFilters()` + filtro manual:**
- Todos os Consumers do MassTransit (`PaymentCompletedConsumer`, `ProcessCashoutConsumer`, etc.)
- `LedgerRepository` (todas as queries)
- `LedgerService` (quando chamado de Consumer)
- Background Jobs e Scheduled Tasks

---

## Visão Geral

A **swiftpay-api-payment** é a API de pagamentos da plataforma SwiftPay, responsável por:

- **Transações Unificadas**: API unificada `/v1/transactions` para PIX, Cartão e Boleto
- **Processamento de Cobranças**: Criação de cobranças via API
- **Integração com Adquirentes**: Comunicação com Bankizi, IHubBanking, ActivePayments, Rapdyn, Coldfy, HunterPay, HeartPay e futuras adquirentes
- **Webhooks de Adquirentes**: Recebe notificações de pagamento confirmado
- **Webhooks para Merchants**: Envia notificações para o sistema do merchant
- **Consultas**: Status de pagamentos, extratos, relatórios
- **Saques**: Processamento de saques do saldo do merchant

---

## Arquitetura de Transações

A API utiliza uma arquitetura unificada de transações:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE TRANSAÇÕES                                  │
└──────────────────────────────────────────────────────────────────────────────┘

           ┌─────────────────────────────────────────┐
           │      POST /v1/transactions              │
           │      { method: "pix|credit_card|boleto" }
           └───────────────────┬─────────────────────┘
                               │
                               ▼
                    ┌───────────────────────┐
                    │  TransactionService   │  ◄── Wrapper unificado
                    │ (ITransactionService) |
                    └──────────┬────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  PixService   │    │ CreditCard    │    │ BoletoService │
│  (disponível) │    │ (em breve)    │    │ (disponível)  │
└───────────────┘    └───────────────┘    └───────────────┘
```

### Métodos de Pagamento

| Método | Valor na API | Status |
|--------|--------------|--------|
| PIX | `pix` | ✅ Disponível |
| Cartão de Crédito | `credit_card` | 🔜 Em breve |
| Boleto | `boleto` | ✅ Disponível |

### Cartão de crédito - contrato direto (sem tokenização)

- O endpoint `POST /v1/transactions` deve receber dados diretos do cartão quando `method = credit_card`:
    - `cardNumber`
    - `cardHolderName`
    - `cardExpirationMonth`
    - `cardExpirationYear`
    - `cardCvv`
    - `installments`
- O campo `cardToken` não deve mais ser aceito nos contratos públicos ou internos de transação.
- Os dados de cartão devem ser persistidos na transação para rastreabilidade operacional.
- Dados sensíveis de cartão não devem ser retornados em payloads para frontend/merchant.

### Origem da Transação (requestOrigin + requestSource)

- O campo `Payment.RequestOrigin` deve registrar a origem técnica da requisição no client, priorizando header HTTP `Origin` e fallback em `Referer`.
- A origem funcional do fluxo da transação deve ser persistida em `Payment.RequestSource` no momento da criação e exposta como `requestSource` em leitura/listagem.
- Valores canônicos de `requestSource`:
    - `Api`: transação criada pelo endpoint público `/v1/transactions`
    - `Checkout`: transação criada por fluxo de checkout baseado em `Order`
    - `PaymentLink`: transação iniciada via `POST /v1/payment-links/{token}/start`
- Endpoints de listagem de transações do merchant devem expor apenas `requestSource` para a coluna de origem funcional.
- A URL técnica (`requestOrigin`) deve ser restrita aos endpoints administrativos de leitura/detalhe.

### Taxa de template no checkout (persistência)

- Em pagamentos criados por checkout com template tarifado, a parcela da taxa do template deve ser persistida em `Payment.CheckoutTemplateFee` (centavos).
- `Payment.PlatformFee` deve representar apenas a taxa base da plataforma (sem somar taxa de template).
- O débito total de taxa no cálculo líquido deve considerar `Payment.PlatformFee + Payment.CheckoutTemplateFee`.
- `Payment.NetAmount` deve sempre ser calculado por `Amount - (PlatformFee + CheckoutTemplateFee)`.
- Leituras de detalhe (merchant/admin) devem usar o valor persistido em `Payment.CheckoutTemplateFee`, sem recalcular pela configuração atual do template.

### Endpoints de Transações

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/v1/transactions` | POST | Criar transação |
| `/v1/transactions` | GET | Listar transações |
| `/v1/transactions/{id}` | GET | Obter transação |
| `/v1/transactions/{id}/simulate` | POST | Simular transação (Sandbox) |

### Ações de Simulação (Sandbox)

| Ação | Descrição |
|------|-----------|
| `complete` | Confirma pagamento |
| `expire` | Expira transação |
| `fail` | Falha transação |
| `refund` | Estorna transação (apenas completed) |

---

## Endpoints de Saques (Cashouts)

**Endpoints Públicos (Merchant via API Token):**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/v1/cashouts` | POST | Solicitar saque |
| `/v1/cashouts` | GET | Listar saques |
| `/v1/cashouts/{id}` | GET | Obter detalhes do saque |

**Endpoints Internos (swiftpay-api → swiftpay-api-payment):**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/v1/internal/cashouts` | POST | Criar saque (via painel) |
| `/v1/internal/cashouts/{id}/evaluate` | POST | Aprovar/Rejeitar saque |

## Checkout de Template - Sem Reserva Prévia de Produto

- No fluxo de checkout publico por template, nao deve existir reserva previa de produto/estoque.
- O pedido deve ser criado apenas na confirmacao do checkout (acao de pagamento).
- A validacao de estoque deve ocorrer nesse momento:
    - Itens com estoque controlado devem ser validados antes de criar pagamento.
    - Em estoque insuficiente, retornar erro de negocio para o checkout exibir ao usuario.

### Notificação PaymentPending no Checkout

- O endpoint público de Checkout deve entrar por `OrderService.CreateFromCheckoutAsync`; endpoints de Order que chamam `CreateAsync` diretamente não herdam esse efeito colateral.
- Após o `Payment` ser criado e o vínculo `Payment.OrderId` ser persistido, `CreateFromCheckoutAsync` deve aguardar uma única chamada a `INotificationService.CreatePaymentNotificationAsync` com `PaymentPending` e `NotificationTemplates.Routes.Transactions`.
- O Checkout usa `IPaymentMethodService` diretamente e não passa por `TransactionService`; portanto, não deve adicionar uma segunda notificação ao seam já usado pela API de transações.
- Preferências governam somente o push (`PushNotificationsEnabled` e `NotifyPaymentPending`); a notificação in-app continua sendo persistida.

**Autenticação Interna:**
- Header: `X-Internal-Api-Key`
- Configuração: `PlatformSettings:InternalApiKey` no appsettings

### Endpoints Internos de Avaliação

```
POST /v1/internal/cashouts/{id}/evaluate
{
  "action": "Approve" | "Reject",
  "reason": "Motivo da rejeição (obrigatório se Reject)"
}
```

### Fluxo de Processamento

| Modo | Ao Criar | Ao Aprovar |
|------|----------|------------|
| **Automático** | Registra no Ledger + Processa | N/A |
| **Manual** | Apenas cria (status=Pending, SEM ledger) | Registra no Ledger + Processa |

### Saque em Sandbox (bloqueado)

- O ambiente `Sandbox` não permite criação de saque.
- Toda tentativa de `POST /v1/cashouts` ou `POST /v1/internal/cashouts` em `Sandbox` deve retornar erro de negócio.
- A validação deve acontecer no `CashoutService` antes de qualquer registro de `Payout` ou movimentação no ledger.

---
