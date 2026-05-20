---
description: "Use when editing auth, merchant onboarding flow, environment filtering, trusted devices, and core architecture foundations."
applyTo: 'Program.cs, Extensions/**/*.cs, Endpoints/Auth/**/*.cs, Endpoints/Merchants/**/*.cs, EndpointsGroups/**/*.cs, Middlewares/**/*.cs, Services/Internal/**/*.cs, Consumers/**/*.cs'
---

# Safefy API - Copilot Instructions

Este documento descreve os padrões e convenções utilizados no projeto Safefy API para criação de endpoints, uso de serviços, middlewares, filtros e modelos de resposta.

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

**Locais que DEVEM usar `IgnoreQueryFilters()` + filtro manual:**
- Todos os Consumers do MassTransit (`ProcessPlatformBalanceConsumer`, etc.)
- `LedgerRepository` (todas as queries)
- `LedgerService` (quando chamado de Consumer)
- Background Jobs e Scheduled Tasks

---

## Visão Geral da Plataforma

A plataforma Safefy é um gateway de pagamentos PIX composta por duas APIs:

### Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PLATAFORMA SAFEFY                               │
├─────────────────────────────────┬───────────────────────────────────────────┤
│          safefy-api             │           safefy-api-payment              │
│      (API Principal)            │         (API de Pagamentos)               │
├─────────────────────────────────┼───────────────────────────────────────────┤
│ • Gestão de usuários            │ • Processamento de cobranças PIX          │
│ • Gestão de merchants           │ • Integração com adquirentes              │
│ • Painel administrativo         │ • Recebimento de webhooks (adquirentes)   │
│ • Configurações e settings      │ • Envio de webhooks (merchants)           │
│ • Credenciais de API            │ • Consulta de pagamentos                  │
│ • Notificações                  │ • Processamento de saques                 │
│ • Estrutura do banco de dados   │                                           │
└─────────────────────────────────┴───────────────────────────────────────────┘
```

### safefy-api (Este Projeto)
API principal responsável por:
- **Autenticação**: Sign up, sign in, recuperação de senha, confirmação de email
- **Gestão de Usuários**: Perfil, alteração de senha, preferências
- **Gestão de Merchants**: Criação, onboarding, KYC, configurações
- **Painel Admin**: Aprovação de merchants, configuração de adquirentes, gestão de usuários
- **Credenciais de API**: Geração de publicKey/secretKey para integração
- **Notificações**: Sistema de notificações in-app para merchants (via SignalR)
- **Banco de Dados**: Mantém toda a estrutura e migrations do PostgreSQL
- **Consumer MassTransit**: Consome mensagens do RabbitMQ e envia via SignalR

### safefy-api-payment (Projeto Separado)
> Para detalhes específicos, consulte o arquivo `.github/copilot-instructions.md` no projeto safefy-api-payment.

---

## Message Broker (MassTransit/RabbitMQ)

A comunicação assíncrona entre as APIs utiliza MassTransit com RabbitMQ:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE MENSAGERIA                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐  MassTransit    ┌─────────────┐    SignalR    ┌──────────┐
│ safefy-api-     │ ──────────────► │  safefy-api │ ────────────► │ Frontend │
│ payment         │   (RabbitMQ)    │  (consumer) │               │          │
│ (publisher)     │                 │             │               │          │
└─────────────────┘                 └─────────────┘               └──────────┘
         │                                 │
         │                                 │
    IMessagePublisher             NotificationCreatedConsumer
    (MassTransit)                 consome e envia via SignalR
```

**Configuração de infraestrutura local:**
- Detalhes operacionais de `docker-compose` (imagens, portas, variáveis e credenciais) não devem ficar em instructions, pois mudam com frequência.
- A fonte de verdade para execução local deve ser os arquivos de infraestrutura versionados (`docker-compose*.yaml`, `Dockerfile*`) e documentação operacional do repositório.

**Filas implementadas:**

| Fila | Publisher | Consumer | Descrição |
|------|-----------|----------|-----------|
| `safefy.notification.created` | safefy-api-payment | safefy-api | Notificação criada (Merchant ou User scope), enviar via SignalR |
| `safefy.ledger.pending` | safefy-api-payment | safefy-api-payment | Registrar transação pendente no ledger |
| `safefy.payment.completed` | safefy-api-payment | safefy-api-payment | Processar pagamento confirmado (ledger, notificações, webhook) |
| `safefy.cashout.process` | safefy-api-payment | safefy-api-payment | Processar saque na adquirente |
| `safefy.webhook.send` | safefy-api-payment | safefy-api-payment | Enviar webhook para merchant |
| `safefy.dashboard.merchant` | safefy-api | safefy-api | Processar dashboard do merchant assincronamente |
| `safefy.dashboard.admin` | safefy-api | safefy-api | Processar dashboard admin assincronamente |

**Componentes:**

| Componente | Projeto | Descrição |
|------------|---------|-----------|
| `RabbitMQSettings` | safefy-api-core | Model de configuração |
| `IMessagePublisher` | safefy-api-core | Interface do publisher |
| `MassTransitMessagePublisher` | safefy-api-core | Implementação do publisher (MassTransit) |
| `NotificationCreatedConsumer` | safefy-api-core | Consumer MassTransit para notificações (SignalR) |
| `ProcessMerchantDashboardConsumer` | safefy-api-core | Consumer para processar dashboard do merchant |
| `ProcessAdminDashboardConsumer` | safefy-api-core | Consumer para processar dashboard admin |
| `RecordLedgerPendingConsumer` | safefy-api-payment | Consumer para registrar ledger pendente |
| `PaymentCompletedConsumer` | safefy-api-payment | Consumer para processar pagamento confirmado |
| `ProcessCashoutConsumer` | safefy-api-payment | Consumer para processar saques |
| `SendWebhookConsumer` | safefy-api-payment | Consumer para enviar webhooks |

**Mensagens (Models):**

| Mensagem | Namespace | Descrição |
|----------|-----------|-----------|
| `NotificationCreatedMessage` | safefy-api-core | Notificação para envio via SignalR |
| `RecordLedgerPendingMessage` | safefy-api-core | Dados para registro no ledger |
| `PaymentCompletedMessage` | safefy-api-core | Dados do pagamento confirmado |
| `ProcessCashoutMessage` | safefy-api-core | Dados do saque a processar |
| `SendWebhookMessage` | safefy-api-core | Dados do webhook a enviar |
| `ProcessMerchantDashboardMessage` | safefy-api-core | Dados para processar dashboard do merchant |
| `ProcessAdminDashboardMessage` | safefy-api-core | Trigger para processar dashboard admin |

**Uso no código:**

```csharp
// Publicar mensagem para fila
await messagePublisher.PublishAsync(
    RabbitMQQueues.PaymentCompleted,
    new PaymentCompletedMessage { ... });

// NotificationService.cs - publica automaticamente quando não há INotificationHubService
// Se estiver na safefy-api: envia direto via SignalR (INotificationHubService)
// Se estiver na safefy-api-payment: publica no RabbitMQ (IMessagePublisher)
```

---

## Fluxo do Merchant

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           JORNADA DO MERCHANT                                 │
└──────────────────────────────────────────────────────────────────────────────┘

1. CADASTRO
   ├── Usuário cria conta (email/senha)
   ├── Confirma email
   └── Faz login

2. CRIAÇÃO DA ORGANIZAÇÃO (MERCHANT)
   ├── Cria merchant (nome fantasia)
   ├── Preenche dados cadastrais (endereço, contato)
   ├── Envia documentos KYC (CNPJ, documentos do sócio)
   └── Submete para análise

3. APROVAÇÃO (ADMIN)
   ├── Admin revisa documentação
   ├── Aprova ou rejeita o merchant
   └── Configura a adquirente (INVISÍVEL para o merchant)
       ⚠️ O merchant NUNCA sabe qual adquirente está processando

4. INTEGRAÇÃO
   ├── Merchant gera credenciais de API (secretKey + client_secret)
   └── Integra no sistema dele usando a safefy-api-payment

5. OPERAÇÃO
   ├── Cria cobranças via API (com callbackUrl opcional)
   ├── Recebe notificações de pagamento via webhook no callbackUrl
   ├── Consulta status de pagamentos
   └── Solicita saques do saldo disponível
```

### Onboarding da organização (V2)

- O onboarding da organização deve operar com persistência incremental por etapa e submissão final separada.
- Rotas canônicas do onboarding:
    - `PATCH /v1/merchant/{id}/onboarding` (update incremental)
    - `POST /v1/merchant/{id}/onboarding/submit` (submissão final)
- Rotas legadas continuam como alias de compatibilidade:
    - `PATCH /v1/merchant/{id}`
    - `POST /v1/merchant/{id}/submit`
- O campo `ExpectedMonthlyVolume` não deve mais ser usado no fluxo de onboarding da organização.
- O onboarding deve exigir ao menos um método de pagamento:
    - `UsesPix`
    - `UsesBoleto`
    - `UsesCreditCard`
- Regras de documento por tipo:
    - `CPF`: exige comprovante de endereço (`ProofOfAddressFileId`)
    - `CNPJ`: exige cartão CNPJ (`CnpjCardFileId`)
    - `CNPJ + UsesCreditCard = true`: exige contrato social (`CompanyContractFileId`)

### Complemento de KYC por campo (admin -> merchant)

- No fluxo de avaliação admin (`EvaluateMerchantKyc`), quando `status = Complement`, cada item pendente deve incluir metadados estruturados:
    - `fieldKey` (campo alvo do ajuste)
- A entidade `MerchantKycPendingItem` deve persistir também:
    - `FieldKey`
    - `EvaluatedAt`
- Endpoints de leitura (`admin/merchant` e `merchant/read`) devem retornar esses metadados para UX orientada por campo.
- O `issueType` foi removido do contrato de complemento. A análise orientada por campo deve usar apenas `fieldKey`, `title` e `description`.
- A `description` do item pendente é opcional no create de complemento e pode ficar vazia quando o título já for suficiente.
- No update de onboarding do merchant (`PATCH /v1/merchant/{id}` e rota canônica de onboarding), quando `KycStatus = Complement` e existirem pendências abertas com `fieldKey`, o backend deve aceitar alteração apenas desses campos solicitados.

---

## Sistema de Dispositivos Confiáveis (Trusted Devices)

A plataforma utiliza um sistema de dispositivos confiáveis para segurança de login, substituindo a detecção baseada em IP por identificação baseada em dispositivo.

### Arquitetura

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE TRUSTED DEVICES                                 │
└──────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │           IDENTIFICAÇÃO             │
                    ├─────────────────────────────────────┤
                    │      Device ID + User-Agent         │
                    │  (localStorage)   (validação SSR)   │
                    └───────────────────┬─────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼                           ▼                           ▼
    ┌───────────────┐         ┌───────────────────┐       ┌───────────────┐
    │ Primeiro      │         │ Dispositivo       │       │ Dispositivo   │
    │ Login         │         │ Conhecido         │       │ Desconhecido  │
    ├───────────────┤         ├───────────────────┤       ├───────────────┤
    │ Auto-trust    │         │ Login normal      │       │ Código 2FA    │
    │ sem verificar │         │ atualiza lastUsed │       │ via email     │
    └───────────────┘         └───────────────────┘       └───────────────┘
```

### Componentes

| Componente | Descrição |
|------------|-----------|
| **Device ID** | UUID gerado no frontend, persistido em `localStorage` |
| **User-Agent Signature** | Hash SHA256 do User-Agent validado no middleware de sessão |
| **TrustedDevice** | Entidade que armazena dispositivos confiáveis |
| **DeviceVerificationCode** | Código temporário para verificar novos dispositivos |

### Fluxo de Login

Fluxo funcional esperado:
1. Validar credenciais.
2. Validar `deviceId` informado pelo cliente.
3. Se não houver dispositivo confiável prévio para o usuário, confiar automaticamente o primeiro dispositivo.
4. Se o dispositivo for conhecido, concluir login e emissão de tokens.
5. Se o dispositivo for desconhecido, exigir verificação adicional (código temporário) antes de emitir sessão final.

### Endpoints

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /v1/auth/signin` | POST | Login com deviceId |
| `POST /v1/auth/verify-device` | POST | Verificar código e adicionar dispositivo |
| `POST /v1/auth/refresh` | POST | Renovar token (valida dispositivo) |
| `GET /v1/users/devices` | GET | Listar dispositivos confiáveis |
| `DELETE /v1/users/devices/{deviceId}` | DELETE | Revogar dispositivo |
| `DELETE /v1/users/devices` | DELETE | Revogar todos os dispositivos |

### Contratos de Request/Response

- Contratos de cada endpoint devem ficar em `[NomeAcao]Models.cs` (Request/Response/Validator) no próprio módulo.
- O padrão de resposta da API deve permanecer consistente via `BaseResponse` / `BaseResponse<T>`.

### Modelagem de Banco e Fonte de Verdade

- Não manter DDL (`CREATE TABLE`, índices e colunas) em instructions, pois o schema evolui com frequência.
- Fonte de verdade da modelagem:
  - Entidades no `safefy-api-core/Models/Database`.
  - Configuração EF no `PrimaryDbContext`.
  - Evolução de schema nas migrations (`Database/Migrations/*`).

### Regras de Negócio

1. **Primeiro Login**: Se o usuário não tem dispositivos cadastrados, o primeiro é automaticamente confiável
2. **Dispositivo Conhecido**: DeviceId corresponde → login normal
3. **Dispositivo Desconhecido**: Código de 6 dígitos enviado por email, expira em 15 minutos
4. **Máximo de Tentativas**: 5 tentativas erradas bloqueiam o código (gerar novo)
5. **Sessão Validada por User-Agent**: O middleware de sessão valida o User-Agent a cada requisição
6. **Revogação em Cascata**: Revogar dispositivo → revogar todos os refresh tokens do dispositivo

### Integração com Frontend

- O frontend deve sempre enviar um `deviceId` persistente por dispositivo para login e refresh.
- O cliente deve suportar ramificação explícita de fluxo quando a API exigir verificação adicional de dispositivo.
- Contratos exatos de payload e campos retornados devem ser lidos dos modelos e endpoints atuais da API, sem replicar JSON fixo nas instructions.

---



