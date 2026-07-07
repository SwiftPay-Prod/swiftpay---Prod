# SwiftPay Ledger System - Documentação Técnica

Este documento descreve a arquitetura completa do sistema de Ledger (Livro Razão), Accounts (Contas), Payments (Pagamentos) e a integração com Adquirentes na plataforma SwiftPay.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Contas (Accounts)](#arquitetura-de-contas-accounts)
3. [Sistema de Ledger](#sistema-de-ledger)
4. [Fluxo de Pagamentos (Payments)](#fluxo-de-pagamentos-payments)
5. [Fluxo de Saques (Payouts)](#fluxo-de-saques-payouts)
6. [Integração com Adquirentes](#integração-com-adquirentes)
7. [Sistema de Taxas e KPIs](#sistema-de-taxas-e-kpis)
8. [Reconciliação e Settlement](#reconciliação-e-settlement)
9. [Exemplos Práticos](#exemplos-práticos)

---

## Visão Geral

O sistema financeiro da SwiftPay é baseado em uma **arquitetura de Ledger (Livro Razão)**, o mesmo padrão utilizado por bancos e instituições financeiras. Esta arquitetura garante:

- **Imutabilidade**: Transações nunca são alteradas ou deletadas
- **Rastreabilidade**: Toda movimentação tem referência à operação original
- **Consistência**: Saldo sempre igual à soma de créditos menos débitos
- **Atomicidade**: Operações financeiras são atômicas (tudo ou nada)
- **Auditoria**: Timestamps e referências em todas as operações

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         ARQUITETURA SAFEFY                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CAMADA 1: TRANSAÇÕES                                                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                       │
│  │   Payment   │    │   Payout    │    │   Refund    │                       │
│  │  (PIX In)   │    │  (PIX Out)  │    │  (Estorno)  │                       │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                       │
│         │                  │                  │                              │
│         └──────────────────┼──────────────────┘                              │
│                            ▼                                                 │
│  CAMADA 2: LEDGER SERVICE                                                    │
│  ┌────────────────────────────────────────────────────────┐                  │
│  │               LedgerService                            │                  │
│  │  - RecordPaymentPendingAsync()                        │                  │
│  │  - RecordPaymentReceivedAsync()                       │                  │
│  │  - RecordPaymentCancelledAsync()                      │                  │
│  │  - RecordPaymentRefundedAsync()                       │                  │
│  │  - RecordWithdrawalRequestedAsync()                   │                  │
│  │  - RecordWithdrawalCompletedAsync()                   │                  │
│  │  - RecordWithdrawalFailedAsync()                      │                  │
│  │  - RecordPlatformWithdrawalRequestedAsync()           │                  │
│  │  - RecordPlatformWithdrawalCompletedAsync()           │                  │
│  │  - RecordPlatformWithdrawalFailedAsync()              │                  │
│  └────────────────────────┬───────────────────────────────┘                  │
│                           ▼                                                  │
│  CAMADA 3: ACCOUNTS & LEDGER ENTRIES                                         │
│  ┌────────────────────────────────────────────────────────┐                  │
│  │  Accounts (Saldo Real)  │  LedgerEntries               │                  │
│  │  ├── Merchant           │  ├── Credit                  │                  │
│  │  ├── Platform           │  └── Debit                   │                  │
│  │  └── Acquirer           │                              │                  │
│  └────────────────────────────────────────────────────────┘                  │
│                                                                              │
│  CAMADA 4: DASHBOARD CACHES (KPIs)                                           │
│  ┌────────────────────────────────────────────────────────┐                  │
│  │  AdminDashboardCache     │  MerchantDashboardCache     │                  │
│  │  AcquirerDashboardCache  │  MerchantBalance            │                  │
│  └────────────────────────────────────────────────────────┘                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Arquitetura de Contas (Accounts)

### Princípio Fundamental

> **REGRA**: O Ledger registra apenas **saldos reais** (dinheiro físico).
> **KPIs** (taxas cobradas, volume, etc.) são armazenados nos **Dashboard Caches**.

### Tipos de Conta (AccountType)

O sistema possui três categorias de contas, todas representando **saldo real**:

#### 1. Contas do Merchant (Por Merchant + Environment)

| Tipo | Descrição | Representa |
|------|-----------|------------|
| `MerchantAvailable` | Saldo disponível para saque | Dinheiro que o merchant pode sacar |
| `MerchantPending` | Pagamentos não confirmados | PIX criados aguardando pagamento |
| `MerchantBlocked` | Reservado em processamento | Saques em processamento |
| `MerchantPayoutsOut` | Total de saques concluídos | Histórico acumulado de saques |

#### 2. Contas da Plataforma (Fixas por Environment)

| Tipo | Descrição | Representa |
|------|-----------|------------|
| `PlatformBlocked` | Saques em processamento | Lucro reservado para saques pendentes |
| `PlatformPayoutsOut` | Total de saques concluídos | Histórico acumulado de saques da plataforma |

> **Nota**: As contas sistêmicas reais da plataforma são `PlatformBlocked` e `PlatformPayoutsOut`. A disponibilidade operacional deve ser lida por `TotalAvailableForWithdrawal`, derivada da composição das adquirentes.

#### 3. Contas das Adquirentes (Por Adquirente + Environment)

| Tipo | Descrição | Representa |
|------|-----------|------------|
| `AcquirerSettlement` | Recebimentos PIX | Valor LÍQUIDO recebido (já descontada taxa da adquirente) |
| `AcquirerPayoutsOut` | Saques processados | Valor transferido (merchants + settlements SwiftPay) |

### O que NÃO está no Ledger (ficam nos Dashboard Caches)

| Dado | Localização |
|------|-------------|
| Volume total processado | `AdminDashboardCache.TotalVolume`, `MerchantDashboardCache.TotalVolume` |
| Taxas cobradas (histórico) | `AdminDashboardCache.TotalFees`, `MerchantDashboardCache.TotalFees` |
| Taxas pagas às adquirentes | `AcquirerDashboardCache.TotalAcquirerFees` |

> **Nota**: As contas `PlatformBlocked/PayoutsOut` registram parte do **saldo real** da plataforma,
> enquanto os Dashboard Caches guardam **estatísticas históricas** para relatórios.

### Estrutura da Entidade Account

```csharp
public class Account : BaseEntity
{
    public Guid Id { get; set; }
    public AccountType Type { get; set; }
    public Guid? MerchantId { get; set; }      // Para contas de merchant
    public Guid? AcquirerId { get; set; }      // Para contas de adquirente
    public CurrencyType Currency { get; set; }
    public long Balance { get; set; } = 0;
    public ApiEnvironment Environment { get; set; } // Sandbox ou Production
}
```

### Segregação por Ambiente

As contas de **merchants** e **adquirentes** são segregadas por ambiente (`Sandbox` ou `Production`):

```
Merchant "Loja ABC"
├── Sandbox
│   ├── MerchantAvailable (saldo: R$ 1.000,00)
│   ├── MerchantPending (saldo: R$ 500,00)
│   └── MerchantBlocked (saldo: R$ 0,00)
└── Production
    ├── MerchantAvailable (saldo: R$ 50.000,00)
    ├── MerchantPending (saldo: R$ 5.000,00)
    └── MerchantBlocked (saldo: R$ 2.000,00)
```

> **Importante**: As contas sistêmicas da **plataforma** (`PlatformBlocked`, `PlatformPayoutsOut`) devem respeitar o `Environment`. A disponibilidade operacional deve ser lida por `TotalAvailableForWithdrawal`.

---

## Sistema de Ledger

### Princípios Fundamentais

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         REGRAS DO LEDGER                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. APENAS SALDO REAL: O Ledger não registra KPIs (taxas, volume)            │
│     → KPIs ficam nos Dashboard Caches e MerchantBalance                      │
│                                                                              │
│  2. IMUTABILIDADE: Nunca alteramos ou deletamos transações                   │
│     → Para corrigir, criamos lançamentos de reversão                         │
│                                                                              │
│  3. ATOMICIDADE: Transações são atômicas (tudo ou nada)                      │
│     → Usamos SQL transactions para garantir consistência                     │
│                                                                              │
│  4. BALANCE ATÔMICO: Saldos são atualizados via UPDATE atômico               │
│     → UPDATE SET Balance = Balance + @delta WHERE Id = @accountId            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Estrutura de LedgerEntry

```csharp
public class LedgerEntry : BaseEntity
{
    public Guid Id { get; set; }
    public string LedgerTransactionId { get; set; }  // tx-{guid} - agrupa entries da mesma operação
    public Guid AccountId { get; set; }
    public LedgerEntryType Type { get; set; }        // Credit ou Debit
    public long Amount { get; set; }                  // Sempre positivo
    public DateTime Timestamp { get; set; }
    public string Description { get; set; }
}

public enum LedgerEntryType
{
    Credit,  // Entrada de valor (aumenta saldo)
    Debit    // Saída de valor (diminui saldo)
}
```

---

## Fluxo de Pagamentos (Payments)

### Fluxo Completo de um Pagamento PIX

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ FLUXO: PAGAMENTO PIX DE R$ 100,00 (Taxa SwiftPay: 2%, Taxa Adquirente: 0.5%)   │
└──────────────────────────────────────────────────────────────────────────────┘

1. CRIAÇÃO DA COBRANÇA (Merchant cria via API)
   ┌────────────────────────────────────────────────────────────────────────┐
   │ Payment                                                                │
   │ ├── Amount: 10000 (R$ 100,00)                                          │
   │ ├── PlatformFee: 200 (R$ 2,00 - 2%)                                    │
   │ ├── AcquirerFee: 50 (R$ 0,50 - 0.5%)                                   │
   │ ├── NetAmount: 9800 (R$ 98,00 - merchant recebe)                       │
   │ └── Status: Pending                                                    │
   └────────────────────────────────────────────────────────────────────────┘
   
   Ledger: RecordPaymentPendingAsync()
   ┌────────────────────────────────────────────────────────────────────────┐
   │ LedgerEntry #1                                                         │
   │ ├── Account: MerchantPending                                           │
   │ ├── Type: Credit                                                       │
   │ ├── Amount: 9800 (valor líquido)                                       │
   │ └── Description: "Pagamento pendente"                                  │
   └────────────────────────────────────────────────────────────────────────┘

2. CLIENTE PAGA (Adquirente envia webhook)
   
   Ledger: RecordPaymentReceivedAsync()
   ┌────────────────────────────────────────────────────────────────────────┐
   │ LedgerEntry #1: Debita Pending                                         │
   │ ├── Account: MerchantPending                                           │
   │ ├── Type: Debit                                                        │
   │ ├── Amount: 9800                                                       │
   │ └── Description: "Pagamento confirmado (saída do pendente)"            │
   ├────────────────────────────────────────────────────────────────────────┤
   │ LedgerEntry #2: Credita Available                                      │
   │ ├── Account: MerchantAvailable                                         │
   │ ├── Type: Credit                                                       │
   │ ├── Amount: 9800                                                       │
   │ └── Description: "PIX recebido (líquido)"                              │
   ├────────────────────────────────────────────────────────────────────────┤
   │ LedgerEntry #3: Credita Adquirente (valor líquido)                     │
   │ ├── Account: AcquirerSettlement                                        │
   │ ├── Type: Credit                                                       │
   │ ├── Amount: 9950 (R$ 100,00 - R$ 0,50 taxa adquirente)                 │
   │ └── Description: "PIX recebido (líquido)"                              │
   └────────────────────────────────────────────────────────────────────────┘
   
   KPIs atualizados (NÃO no Ledger):
   ┌────────────────────────────────────────────────────────────────────────┐
   │ MerchantBalance                                                        │
   │ ├── LifetimeVolume: +10000                                             │
   │ ├── LifetimeFeesPaid: +200                                             │
   │ ├── VolumeToday: +10000                                                │
   │ └── ...                                                                │
   └────────────────────────────────────────────────────────────────────────┘

3. RESULTADO FINAL
   ┌────────────────────────────────────────────────────────────────────────┐
   │ SALDOS NO LEDGER (dinheiro real):                                      │
   │                                                                        │
   │ MerchantPending:       R$ 0,00 (zerado)                                │
   │ MerchantAvailable:     +R$ 98,00 (líquido para o merchant)             │
   │ AcquirerSettlement:    +R$ 99,50 (líquido na adquirente)               │
   │                                                                        │
   │ KPIs NOS DASHBOARD CACHES:                                             │
   │                                                                        │
   │ MerchantBalance.LifetimeFeesPaid: +R$ 2,00                             │
   │ AcquirerDashboardCache.TotalPlatformFees: +R$ 2,00                     │
   │ AcquirerDashboardCache.TotalAcquirerFees: +R$ 0,50                     │
   │ AcquirerDashboardCache.TotalProfit: +R$ 1,50 (lucro SwiftPay)            │
   │                                                                        │
   └────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Estorno (Refund)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ FLUXO: ESTORNO DE PAGAMENTO DE R$ 100,00 (Taxa: 2%, Taxa Adquirente: 0.5%)   │
└──────────────────────────────────────────────────────────────────────────────┘

Ledger: RecordPaymentRefundedAsync()
┌────────────────────────────────────────────────────────────────────────┐
│ LedgerEntry #1: Debita MerchantAvailable (valor líquido)              │
│ ├── Account: MerchantAvailable                                        │
│ ├── Type: Debit                                                       │
│ ├── Amount: 9800 (R$ 100,00 - R$ 2,00 taxa)                           │
│ └── Description: "Estorno PIX"                                        │
├────────────────────────────────────────────────────────────────────────┤
│ LedgerEntry #2: Debita AcquirerSettlement (valor líquido adquirente)  │
│ ├── Account: AcquirerSettlement                                       │
│ ├── Type: Debit                                                       │
│ ├── Amount: 9950 (R$ 100,00 - R$ 0,50 taxa adquirente)                │
│ └── Description: "Estorno PIX"                                        │
└────────────────────────────────────────────────────────────────────────┘

KPIs REVERTIDOS:
┌────────────────────────────────────────────────────────────────────────┐
│ MerchantBalance.LifetimeRefunds: +10000 (valor bruto)                  │
│ MerchantBalance.LifetimeVolume: -10000 (reverte o volume)              │
│ MerchantBalance.VolumeToday: -10000                                    │
│ MerchantBalance.VolumeThisWeek: -10000                                 │
│ MerchantBalance.VolumeThisMonth: -10000                                │
│ MerchantBalance.LifetimeFeesPaid: -200 (devolve a taxa)                │
└────────────────────────────────────────────────────────────────────────┘

IMPORTANTE: O estorno debita valores LÍQUIDOS das contas, pois é o que
foi creditado originalmente. As taxas são revertidas nos KPIs.
```

---

## Fluxo de Saques (Payouts)

### Fluxo Completo de um Saque

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ FLUXO: SAQUE DE R$ 500,00 (Taxa SwiftPay: R$ 3,00, Taxa Adquirente: R$ 1,00)   │
└──────────────────────────────────────────────────────────────────────────────┘

1. SOLICITAÇÃO DE SAQUE (Merchant solicita)
   
   Ledger: RecordWithdrawalRequestedAsync()
   ┌────────────────────────────────────────────────────────────────────────┐
   │ LedgerEntry #1: Debita Available (valor + taxa)                        │
   │ ├── Account: MerchantAvailable                                         │
   │ ├── Type: Debit                                                        │
   │ ├── Amount: 50300 (R$ 500,00 + R$ 3,00)                                │
   │ └── Description: "Saque solicitado (valor + taxa)"                     │
   ├────────────────────────────────────────────────────────────────────────┤
   │ LedgerEntry #2: Credita Blocked (apenas valor)                         │
   │ ├── Account: MerchantBlocked                                           │
   │ ├── Type: Credit                                                       │
   │ ├── Amount: 50000 (apenas o valor do saque)                            │
   │ └── Description: "Saque em processamento"                              │
   └────────────────────────────────────────────────────────────────────────┘
   
   KPIs atualizados:
   ┌────────────────────────────────────────────────────────────────────────┐
   │ MerchantBalance.LifetimeFeesPaid: +300                                 │
   └────────────────────────────────────────────────────────────────────────┘

2. SAQUE APROVADO E PROCESSADO
   
   Ledger: RecordWithdrawalCompletedAsync()
   ┌────────────────────────────────────────────────────────────────────────┐
   │ LedgerEntry #1: Debita Blocked                                         │
   │ ├── Account: MerchantBlocked                                           │
   │ ├── Type: Debit                                                        │
   │ ├── Amount: 50000                                                      │
   │ └── Description: "Saque concluído"                                     │
   ├────────────────────────────────────────────────────────────────────────┤
   │ LedgerEntry #2: Credita PayoutsOut (Merchant)                          │
   │ ├── Account: MerchantPayoutsOut                                        │
   │ ├── Type: Credit                                                       │
   │ ├── Amount: 50000                                                      │
   │ └── Description: "Saque enviado"                                       │
   ├────────────────────────────────────────────────────────────────────────┤
   │ LedgerEntry #3: Credita PayoutsOut (Adquirente - inclui taxa)          │
   │ ├── Account: AcquirerPayoutsOut                                        │
   │ ├── Type: Credit                                                       │
   │ ├── Amount: 50100 (R$ 500,00 + R$ 1,00 taxa adquirente)                │
   │ └── Description: "Saque processado (valor + taxa adquirente)"          │
   └────────────────────────────────────────────────────────────────────────┘
   
   IMPORTANTE: AcquirerPayoutsOut registra o valor TOTAL que sai da adquirente,
   incluindo a taxa que ela cobra. Isso garante que a reconciliação bancária
   fique correta: SaldoNaAdquirente = AcquirerSettlement - AcquirerPayoutsOut
   
   KPIs atualizados:
   ┌────────────────────────────────────────────────────────────────────────┐
   │ MerchantBalance.LifetimePayouts: +50000                                │
   └────────────────────────────────────────────────────────────────────────┘

3. SE O SAQUE FALHAR
   
   Ledger: RecordWithdrawalFailedAsync()
   - Devolve o valor do blocked para o available
   - Devolve a taxa para o available
   - Reverte MerchantBalance.LifetimeFeesPaid
```

---

## Sistema de Taxas e KPIs

### Separação Clara: Saldo Real vs KPIs

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ONDE CADA INFORMAÇÃO É ARMAZENADA                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ LEDGER (Accounts) - SALDO REAL                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │ MerchantAvailable      → Quanto o merchant pode sacar                   │  │
│ │ MerchantPending        → PIX aguardando pagamento                       │  │
│ │ MerchantBlocked        → Saques em processamento                        │  │
│ │ MerchantPayoutsOut     → Histórico de saques concluídos                 │  │
│ │ PlatformBlocked        → Saques em processamento (SwiftPay)               │  │
│ │ PlatformPayoutsOut     → Histórico de saques concluídos (SwiftPay)        │  │
│ │ AcquirerSettlement     → Valor líquido na adquirente                    │  │
│ │ AcquirerPayoutsOut     → Valor transferido pela adquirente              │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│ │ TotalAvailableForWithdrawal → Disponibilidade derivada por adquirente    │  │
│                                                                              │
│ DASHBOARD CACHES - KPIs (calculados/agregados)                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │ MerchantBalance                                                         │  │
│ │ ├── LifetimeVolume      → Total de volume processado                    │  │
│ │ ├── LifetimePayouts     → Total de saques                               │  │
│ │ ├── LifetimeRefunds     → Total de estornos                             │  │
│ │ ├── LifetimeFeesPaid    → Total de taxas pagas à SwiftPay                 │  │
│ │ ├── VolumeToday/Week/Month → Volume por período                         │  │
│ │                                                                         │  │
│ │ MerchantDashboardCache                                                  │  │
│ │ ├── TotalVolume, TotalFees, ApprovalRate, etc.                          │  │
│ │                                                                         │  │
│ │ AcquirerDashboardCache                                                  │  │
│ │ ├── TotalVolume         → Volume total processado                       │  │
│ │ ├── TotalPlatformFees   → Taxas cobradas dos merchants                  │  │
│ │ ├── TotalAcquirerFees   → Taxas pagas à adquirente                      │  │
│ │ ├── TotalProfit         → Lucro SwiftPay (Platform - Acquirer)            │  │
│ │ ├── TotalPayoutVolume   → Volume de saques                              │  │
│ │ └── TotalPayoutAcquirerFees → Taxas de saque da adquirente              │  │
│ │                                                                         │  │
│ │ AdminDashboardCache                                                     │  │
│ │ ├── TotalVolume, TotalFees, etc.                                        │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Por que essa separação?

| Aspecto | Ledger (Saldo Real) | Dashboard Cache (KPIs) |
|---------|---------------------|------------------------|
| **Propósito** | Reconciliação, movimentação de dinheiro | Relatórios, dashboards |
| **Atualização** | A cada transação (tempo real) | Refresh periódico ou sob demanda |
| **Criticidade** | Alta (erros afetam dinheiro) | Média (erros afetam relatórios) |
| **Performance** | Otimizado para escrita | Otimizado para leitura |

---

## Reconciliação e Settlement

### Fórmulas de Reconciliação

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    FÓRMULAS DE RECONCILIAÇÃO                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ SALDO FÍSICO NA ADQUIRENTE:                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │ SaldoNaAdquirente = AcquirerSettlement - AcquirerPayoutsOut             │  │
│ │                                                                         │  │
│ │ Este é o dinheiro físico que está na conta da adquirente.               │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ SALDO QUE PERTENCE AOS MERCHANTS (já na adquirente):                         │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │ SaldoMerchants = Σ(MerchantAvailable + MerchantBlocked)                 │  │
│ │                  (por adquirente, usando MerchantAcquirer.AcquirerId)   │  │
│ │                                                                         │  │
│ │ IMPORTANTE: MerchantPending NÃO é incluído!                             │  │
│ │ → MerchantPending representa PIX aguardando pagamento                   │  │
│ │ → Esse dinheiro AINDA NÃO ENTROU na adquirente                          │  │
│ │ → Só entra no cálculo quando o PIX for confirmado                       │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ LUCRO SAFEFY DISPONÍVEL NA ADQUIRENTE:                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │ LucroDisponível = SaldoNaAdquirente - SaldoMerchants                    │  │
│ │                 = (Settlement - PayoutsOut) - (Available + Blocked)     │  │
│ │                                                                         │  │
│ │ Este é o valor que a SwiftPay pode sacar para sua conta bancária.         │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ LUCRO LÍQUIDO (KPI):                                                         │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │ LucroLiquido = AcquirerDashboardCache.TotalProfit                       │  │
│ │              = TotalPlatformFees - TotalAcquirerFees                    │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Cache de Platform Balance

O cálculo do lucro disponível é feito de forma assíncrona via cache para garantir performance com muitos merchants:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA PLATFORM BALANCE CACHE                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Endpoint GET /admin/balance                                                 │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────┐                                     │
│  │ 1. Buscar PlatformBalanceCache      │                                     │
│  │ 2. Se expirado ou não existe:       │                                     │
│  │    → Publicar ProcessPlatformBalance│                                     │
│  │ 3. Retornar dados do cache          │                                     │
│  └───────────────────┬─────────────────┘                                     │
│                      │                                                       │
│                      ▼ (assíncrono via RabbitMQ)                             │
│  ┌─────────────────────────────────────┐                                     │
│  │ ProcessPlatformBalanceConsumer      │                                     │
│  │ - Busca AcquirerSettlement          │                                     │
│  │ - Busca AcquirerPayoutsOut          │                                     │
│  │ - Busca merchants via MerchantAcquirer│                                   │
│  │ - Soma MerchantAvailable + Blocked  │                                     │
│  │ - Calcula PlatformProfit            │                                     │
│  │ - Atualiza cache                    │                                     │
│  └─────────────────────────────────────┘                                     │
│                                                                              │
│  PlatformBalanceCache (por Acquirer + Environment)                           │
│  ├── AcquirerSettlement: saldo de recebimentos                               │
│  ├── AcquirerPayoutsOut: saldo de saques                                     │
│  ├── MerchantTotalAvailable: Σ MerchantAvailable                             │
│  ├── MerchantTotalBlocked: Σ MerchantBlocked                                 │
│  └── PlatformProfit: lucro disponível para saque                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Settlement da SwiftPay

Quando a SwiftPay quiser sacar seu lucro da adquirente:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ FLUXO: SAQUE DA PLATAFORMA (sacar lucro da adquirente)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. Solicitar saque:                                                          │
│    - Credita PlatformBlocked para reservar o valor do saque                  │
│    - Cria PlatformPayout com status Processing                               │
│                                                                              │
│ 2. Saque concluído com sucesso:                                              │
│    ┌────────────────────────────────────────────────────────────────────┐    │
│    │ LedgerEntry #1: Debita PlatformBlocked                            │    │
│    │ ├── Account: PlatformBlocked                                      │    │
│    │ ├── Type: Debit                                                   │    │
│    │ └── Amount: {valor do saque}                                      │    │
│    ├────────────────────────────────────────────────────────────────────┤    │
│    │ LedgerEntry #2: Credita PlatformPayoutsOut                        │    │
│    │ ├── Account: PlatformPayoutsOut                                   │    │
│    │ ├── Type: Credit                                                  │    │
│    │ └── Amount: {valor do saque}                                      │    │
│    ├────────────────────────────────────────────────────────────────────┤    │
│    │ LedgerEntry #3: Credita AcquirerPayoutsOut                        │    │
│    │ ├── Account: AcquirerPayoutsOut                                   │    │
│    │ ├── Type: Credit                                                  │    │
│    │ └── Amount: {valor do saque}                                      │    │
│    └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│ 3. Resultado:                                                                │
│    - PlatformBlocked diminui (saque concluído)                               │
│    - PlatformPayoutsOut aumenta (histórico de saques)                        │
│    - AcquirerPayoutsOut aumenta (saiu da adquirente)                         │
│                                                                              │
│ 4. Saque falhou:                                                             │
│    - Debita PlatformBlocked, liberando novamente a disponibilidade derivada  │
│    - Atualiza PlatformPayout com status Failed                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Exemplos Práticos

### Exemplo 1: Dia Completo de Operações

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ CENÁRIO: 3 pagamentos + 1 saque + 1 settlement                                │
├──────────────────────────────────────────────────────────────────────────────┤

PAGAMENTO 1: R$ 100,00 (Taxa SwiftPay: 2%, Taxa Adquirente: 0.5%)
  Ledger:
    MerchantAvailable: +R$ 98,00
    AcquirerSettlement: +R$ 99,50 (líquido)
  KPIs:
    MerchantBalance.LifetimeFeesPaid: +R$ 2,00

PAGAMENTO 2: R$ 200,00
  Ledger:
    MerchantAvailable: +R$ 196,00 (total: R$ 294,00)
    AcquirerSettlement: +R$ 199,00 (total: R$ 298,50)
  KPIs:
    MerchantBalance.LifetimeFeesPaid: +R$ 4,00 (total: R$ 6,00)

PAGAMENTO 3: R$ 50,00
  Ledger:
    MerchantAvailable: +R$ 49,00 (total: R$ 343,00)
    AcquirerSettlement: +R$ 49,75 (total: R$ 348,25)
  KPIs:
    MerchantBalance.LifetimeFeesPaid: +R$ 1,00 (total: R$ 7,00)

SAQUE: R$ 100,00 (Taxa SwiftPay: R$ 2,00, Taxa Adquirente: R$ 0,50)
  Ledger:
    MerchantAvailable: -R$ 102,00 (total: R$ 241,00)
    MerchantBlocked: +R$ 100,00 → depois -R$ 100,00
    MerchantPayoutsOut: +R$ 100,00
    AcquirerPayoutsOut: +R$ 100,50 (valor + taxa adquirente)
  KPIs:
    MerchantBalance.LifetimeFeesPaid: +R$ 2,00 (total: R$ 9,00)
    MerchantBalance.LifetimePayouts: +R$ 100,00

SALDOS FINAIS:
  Ledger:
    AcquirerSettlement:    R$ 348,25
    AcquirerPayoutsOut:    R$ 100,50
    ────────────────────────────────
    Saldo na Adquirente:   R$ 247,75

    MerchantAvailable:     R$ 241,00
    ────────────────────────────────
    Lucro SwiftPay Disponível: R$ 6,75 (pode sacar)

  KPIs:
    TotalPlatformFees: R$ 9,00 (R$ 7,00 PIX + R$ 2,00 saque)
    TotalAcquirerFees: R$ 1,75 (R$ 1,25 PIX + R$ 0,50 saque)
    TotalProfit: R$ 7,25

└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Considerações de Segurança

1. **Merchant nunca vê dados da adquirente**: Campos como `AcquirerId`, `AcquirerFee` são invisíveis

2. **Taxas configuradas apenas por Admin**: Merchants não podem alterar suas próprias taxas

3. **Ledger imutável**: Nunca alteramos ou deletamos transações

4. **Atomicidade**: Todas as operações de saldo usam `UPDATE SET Balance = Balance + @delta` em transactions SQL

5. **Segregação por ambiente**: Sandbox e Production são completamente isolados

---

## Conclusão

O sistema de Ledger da SwiftPay foi projetado seguindo as melhores práticas:

- **Ledger apenas para saldo real** - Não mistura KPIs com movimentação financeira
- **KPIs nos Dashboard Caches** - Otimizados para leitura e relatórios
- **Imutabilidade** - Auditoria completa
- **Atomicidade** - Consistência garantida
- **Separação clara** - Fácil reconciliação e entendimento
