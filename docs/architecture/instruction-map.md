# SWIFTPAY — Mapa de Instruções (Copilot Instructions e Convenções)

> **Data de análise:** 21/05/2026

## 0. Entrada universal para agentes

Antes dos arquivos temáticos descritos neste mapa, todo agente deve ler:

1. [`../../AGENTS.md`](../../AGENTS.md);
2. [`../../CLAUDE.md`](../../CLAUDE.md);
3. [`../../TODOS.md`](../../TODOS.md);
4. [`../agent-context-governance.md`](../agent-context-governance.md);
5. decisões aplicáveis em [`../decisions/`](../decisions/).

Esses artefatos tornam obrigatório registrar em Git toda tarefa, decisão, tentativa, risco, bloqueio e evidência. Instruções locais complementam a governança universal; não a substituem.

---

## 1. Visão Geral

O repositório contém **44 arquivos de instruções/configuração** distribuídos entre 5 módulos. As instruções são usadas pelo GitHub Copilot para guiar a geração de código com as convenções do projeto.

### Distribuição por módulo:

| Módulo | Arquivos | Tipos |
|--------|----------|-------|
| swiftpay-api | 14 | 1 índice + 11 instruções + 2 agentes |
| swiftpay-api-payment | 11 | 1 índice + 9 instruções + 1 standalone |
| swiftpay-web | 12 | 1 índice + 8 instruções + 2 gerais + 1 skill |
| swiftpay-web-checkout | 7 | 1 índice + 6 instruções |
| **TOTAL** | **44** | |

---

## 2. swiftpay-api — 11 Arquivos de Instrução

### Índice: `copilot-instructions.md`
- Função: Navegação entre os 11 arquivos temáticos
- Regra: Atualizar arquivos temáticos e manter índice sincronizado

### 2.1 `foundations-auth-merchant.instructions.md`

**Regras CRÍTICAS:**

**Environment Filter em Consumers:**
> `PrimaryDbContext` aplica filtro global de `Environment` via `IEnvironmentProvider` lendo header `X-Environment`. Em Consumers (MassTransit), Background Jobs, ou qualquer contexto não-HTTP, o provider não terá o header → queries retornam dados do ambiente errado.
> 
> **Solução obrigatória:** Usar `IgnoreQueryFilters()` + filtro manual de `Environment` em TODOS os Consumers, `LedgerRepository`, `LedgerService` (quando chamado de Consumer), Background Jobs e Scheduled Tasks.
> 
> **Em endpoints HTTP:** NUNCA usar `IgnoreQueryFilters()`.

**Arquitetura de Mensageria:**
- 7 filas documentadas: `swiftpay.notification.created`, `swiftpay.ledger.pending`, `swiftpay.payment.completed`, `swiftpay.cashout.process`, `swiftpay.webhook.send`, `swiftpay.dashboard.merchant`, `swiftpay.dashboard.admin`

**Merchant Onboarding (V2):**
- Persistência incremental por step, submissão final separada
- Rotas canônicas: `PATCH /v1/merchant/{id}/onboarding` + `POST /v1/merchant/{id}/onboarding/submit`
- Documentos: CPF requer `ProofOfAddressFileId`, CNPJ requer `CnpjCardFileId`, CNPJ+CreditCard requer `CompanyContractFileId`

**Trusted Devices:**
- Identificação por Device ID + User-Agent
- Primeiro dispositivo auto-confia, conhecidos login normal, desconhecidos requerem código 6 dígitos
- Máx 5 tentativas, código expira em 15 minutos
- Sessão validada por User-Agent por request
- Revogação em cascata: revogar dispositivo → revoga todos refresh tokens

### 2.2 `business-rules.instructions.md`

**Regras de Negócio Centrais:**

**Achievements & Dynasties:**
- Apenas billing de Production conta. Sandbox NUNCA desbloqueia conquistas.
- Thresholds de `UserProgressionConstants.cs` como fonte única.

**Wayne Protocol (Interno):**
- Sistema de retenção total de taxas por amostragem cíclica
- Selecionados: `PlatformFee = Amount`, `NetAmount = 0`, `IsWayneProtocol = true`
- NUNCA expor campos Wayne em endpoints de merchant
- Admin endpoints internos: `GET/PATCH /v1/admin/internal/wayne-protocol`

**Invisible Acquirer:**
- Merchant NUNCA sabe qual adquirente processa. Configuração exclusiva do Admin.

**Nominal Management:**
- Swap apenas para compatível (`Black`/`White`), A/B testing máx 7 dias ou contagem
- Apenas 1 A/B test ativo por `MerchantId + Environment`

**Fees Architecture:**
- Hierárquico: `MerchantSettings` → `PlatformSettings` (fallback)
- 3 modos: `FixedOnly`, `PercentageOnly`, `FixedAndPercentage`
- Por método + canal: PIX/Boleto/CreditCard × Api/Checkout/PaymentLink
- `FeeCalculator` apenas no backend (nunca frontend — diferenças de precisão JS/.NET)

**Reserve/Settlement:**
- Reserva por método: `PixReservePercentage`, `BoletoReservePercentage`, `CreditCardReservePercentage`
- D+0 → sem reserva retida
- Centralizado em `CalculationService`

### 2.3 `orders-and-ledger.instructions.md`

**Arquitetura Order vs Payment:**
- `Order` = contexto de negócio (produtos, cupons, cliente, shipping)
- `Payment` = contexto financeiro apenas (valor, método, status, taxas)
- Gateway (API Direct): cria Payment apenas (OrderId = null)
- E-commerce (Checkout): sempre cria Order → auto-cria Payment

**Ledger:**
- Imutável (nunca update/delete, apenas reversal entries)
- Atomicidade via SQL transactions com `ExecuteSqlRawAsync`
- Unique index garante único `SettlementOut` por `PayoutId`
- Platform withdrawals: `PlatformPayoutId` (nunca `PayoutId`)

### 2.4 `dashboard-infra-and-stack.instructions.md`

**Logging (CRÍTICO):**
- `ILogger`: APENAS `LogError` para erros técnicos. NUNCA `LogInformation`, `LogDebug`, `LogWarning`
- `IApiLogService`: Operações financeiras críticas
- `ISecurityLogService`: Eventos de segurança
- Acquirer webhooks → `AcquirerWebhookLogs` (Log DB), NÃO `ApiLogs`

**Dependencies:**
- NUNCA pacotes beta/preview/rc. Apenas versões estáveis/GA.

### 2.5 `structure-migrations-and-tracking.instructions.md`

**Estrutura de Pastas:**
```
Endpoints/{Admin|Auth|Merchants|Users}/[NomeAcao]/
EndpointsGroups/
Interfaces/
Services/Internal/
Filters/
```

**Migrations:**
- Primary: `Database/Migrations/Primary`
- Logs: `Database/Migrations/Logs` (no projeto swiftpay-api, entity no swiftpay-api-core)
- NUNCA `ALTER TABLE ADD COLUMN IF NOT EXISTS` — schema evolution via migrations

### 2.6 `endpoint-authoring-and-utils.instructions.md`

**Endpoint Structure:**
- Cada endpoint = 1 pasta com 2 arquivos: `[Action]Endpoint.cs` + `[Action]Models.cs`
- Request: `sealed class`, Response: herda `BaseResponse<T>`
- Respostas SEMPRE usam `BaseResponse<T>` com `Data`, `Message`, `Error`

**HTTP Verbs:** GET=Read/List, POST=Create/Submit, PATCH=Partial update, PUT=Full update, DELETE=Remove

**HTTP Status:** 200, 201, 400, 401, 403, 404, 500

### 2.7 `payment-links-and-checkout-rules.instructions.md`

**Payment Links:**
- Criação NÃO cria Payment imediatamente (lazy)
- Transaction criada apenas no acesso público
- `requestSource = PaymentLink` para transações deste fluxo
- Links ilimitados (`ExpiresAt = null`): permanente, reutilizável

**Checkout:**
- `BackgroundColor` removido. Apenas `ColorMode` (Single/Gradient)
- Unified update: `PATCH` com `productOperations` (add/update/remove)
- Transfer Sandbox→Production: novo checkout com `Draft`

### 2.8 `services-and-storage.instructions.md`

**SignalR Hubs:**
- `AuthHub` (`/hubs/auth`), `NotificationHub` (`/hubs/notifications`), `DashboardHub` (`/hubs/dashboard`)
- Todos herdam de `BaseHub`
- Grupos: `user:{userId}`, `merchant:{merchantId}`, `admin:dashboard:{environment}`

**Storage:**
- Arquivos públicos: URL permanente (`public-read` ACL)
- Arquivos privados: presigned URL com 12h cache
- KYC para adquirente externa: signed URL com 1 ANO TTL (31536000 segundos)

### 2.9 `images-security-and-validation.instructions.md`

- Products: até 6 imagens (JSONB), Variants: 1 imagem
- FluentValidation: validators básicos, pagination validators

### 2.10 `modeling-mappers-and-code-standards.instructions.md`

**Naming (CRÍTICO):**
- Admin responses: SEMPRE prefixo `Admin` — `Admin{Entity}Minimal` (list), `Admin{Entity}Details` (detail), `Admin{Entity}Data` (action)
- NUNCA: `CashoutData`, `TransactionListItem`
- SEMPRE: `AdminMinimalCashout`, `AdminCashoutDetails`

**Mappers (CRÍTICO):**
- NUNCA criar Response objects manualmente nos Endpoints. SEMPRE usar Mappers.
- Mappers em `Mappers/`, naming: `[Context][Entity]Mapper`
- Métodos: `ToData()`, `ToMinimalData()`, `ToDetailsData()`
- Classes sempre `static`

### 2.11 `referrals-and-checklist.instructions.md`

**Referral Program:**
- SignUp: `refCode` opcional, requer `whatsApp` com DDI internacional
- Binding apenas no signup
- `ReferralCode` gerado on demand, nunca expira
- Commission = report only (não é crédito financeiro real)
- Base: `PlatformFee - AcquirerFee` em operações `Completed`
- Calculado em basis points, sempre floor (nunca round up)

---

## 3. swiftpay-api-payment — 10 Arquivos de Instrução

### 3.1 `foundations-transactions-and-cashouts.instructions.md`

**Transaction Architecture:**
- Unified endpoint: `POST /v1/transactions` com `method: pix|credit_card|boleto`
- `TransactionService` → delega para `PixService`, `CreditCardTransactionService`, `BoletoService`
- Cartão: dados diretos (sem tokenização)
- `RequestOrigin` (técnico) ≠ `RequestSource` (funcional: Api/Checkout/PaymentLink)

**Cashout:**
- Sandbox cashout BLOQUEADO
- Internal auth: `X-Internal-Api-Key`

### 3.2 `webhooks-tracking-and-signalr.instructions.md`

**Status Security Rule (CRÍTICO):**
- Apenas status terminais movem saldo: `Completed`, `Failed`, `Rejected`
- `Cancelled` normalizado para `PayoutStatus.Cancelled` (nunca `Failed`)
- Status não-terminal/desconhecido NUNCA move saldo
- Se `SettlementOut` já existe, webhooks negativos IGNORADOS
- Deduplicação via unique filtered index

**Merchant Webhooks:**
- Headers: `X-SwiftPay-Signature` (HMAC-SHA256), `X-SwiftPay-Event`, `X-SwiftPay-Delivery`, `X-SwiftPay-Attempt`
- Retry: exponential backoff 2s/4s/8s, max 3 tentativas

### 3.3 `clients-auth-rate-limit-and-resilience.instructions.md`

**External API:**
- SEMPRE usar `[JsonPropertyName]` (APIs externas usam camelCase)
- Enums via `[JsonConverter(typeof(JsonStringEnumConverter))]`

**HTTP Resilience (Polly):**
- Adquirentes: Circuit Breaker (50% em 5+ requests, 30s), Retry (3x 500ms/1s/2s + jitter), Timeout (15s)
- Webhooks: Circuit Breaker (80% em 10+, 1min), Retry (3x 2s/4s/8s), Timeout (10s)

### 3.4 `core-business-rules.instructions.md`

**Fail-Fast:** Quando ledger falha registrando transição de pagamento, consumer DEVE parar (sem continuação para side effects)

**Payment method enablement:** Validação em 3 camadas (capacidades da adquirente, platform settings, merchant override)

**Credit card installment fee:** `effectivePercentage = base + (installments - 1) * installmentFee`, max 10000 bps

### 3.5 `checkout-practices-dependencies-and-logging.instructions.md`

**Coding Practices:**
- SEMPRE logar requests/responses de integrações (mascarando dados sensíveis)
- Traduzir erros externos para português
- Usar `sealed` para classes não herdáveis
- Nullable (`?`) para propriedades opcionais
- Options Pattern: nunca chamar configs diretamente, sempre `IOptions<T>`

### 3.6 `acquirer-integration.instructions.md` — Padrão Canônico

**Estrutura Mandatória por Adquirente:**
1. `Clients/{Acquirer}/` — Client.cs (HTTP apenas) + ResponseParser.cs + Models/
2. `Services/Acquirers/` — Service.cs + Utils/StatusConverter.cs
3. `Endpoints/Acquirers/{Acquirer}/Webhook/` — endpoint
4. `EndpointsGroups/Acquirers/{Acquirer}Group.cs` — grupo

**Client.cs:** APENAS HTTP (montagem, envio, status, delegação ao parser). NUNCA parsing de negócio.

**ResponseParser.cs:** `Parse*` methods, `ExtractErrorMessage`, alias normalization. Reusa `AcquirerJsonReader.cs`.

**StatusConverter:** Cada adquirente DEVE ter conversor dedicado. NUNCA inline.

**Referência canônica:** HeartPay

---

## 4. swiftpay-web — 10 Arquivos de Instrução

### 4.1 `react19-performance-and-data-flow.instructions.md`

**React 19 + React Compiler (CRÍTICO):**

**FAZER:**
- `use(promise)` para desempacotar dados
- `<Suspense key={...}>` para skeleton instantâneo
- Funções fora do componente (React Compiler otimiza)
- `useTransition` para navegação

**NÃO FAZER:**
- `useEffect` para fetch
- `useState` para dados de API
- `useMemo`/`useCallback` manual (React Compiler faz)
- `await` na promise do Server Component (perde streaming)
- `isLoading` com `useState` (usar `isPending` de `useTransition`)

### 4.2 `react19-modal-architecture.instructions.md`

**Modal vs Página Dedicada:**
- Formulários longos/complexos (6+ inputs, múltiplas imagens) → páginas dedicadas
- Products, Clients, Coupons, Orders, Templates → OBRIGATÓRIO usar páginas dedicadas
- Confirmação simples, detalhes read-only → pode usar modal

**Modal Rules:**
1. Promise criada no event handler (nunca no render)
2. `use(promise)` para consumo de dados
3. `Suspense` com skeleton fallback
4. `useActionState` para formulários
5. `scroll="outside"` no Modal.Container (NUNCA `overflow-y-auto`)

### 4.3 `forms-headless-and-table-actions.instructions.md`

**Headless Pattern (OBRIGATÓRIO quando):**
- 5+ useStates, 2+ useEffects complexos, múltiplos modais, filtros com debounce/async, componente > 200 linhas

**Estrutura:** `page.tsx` + `component-table.tsx` (DUMB) + `use-component-table.ts` (SMART) + `skeleton.tsx` + `modals/`

**Spacing Convention (MANDATÓRIO):**
- Apenas valores pares (`gap-2`, `gap-4`, `p-2`, `p-4`)
- Dentro de blocos: `gap-2`
- Entre blocos: `gap-4` ou `pb-4`

### 4.4 `design-system-and-code-quality.instructions.md`

**Color System (OKLCH Semantic):**
- `accent`, `success`, `warning`, `danger`, `secondary`
- Surfaces: `background`, `surface`, `overlay`, `content1/2/3`
- NUNCA: `bg-primary` (não existe), cores hardcoded (`bg-blue-500`)

**Tailwind v4 Syntax:**
- `shrink-0` (não `flex-shrink-0`), `grow` (não `flex-grow`)
- Classes semânticas sobre valores arbitrários

**Import Conventions:**
- NUNCA criar `index.ts` (importar direto da source)
- `@/utils/` para utilitários reutilizáveis
- NENHUM comentário no código (self-documenting)

### 4.5 `project-structure-and-api-types.instructions.md`

**Type System (CRÍTICO):**
- NUNCA criar type aliases para Response types. Usar `ApiResponse<T>` diretamente.
- Naming: `AdminMinimal{Entity}`, `Admin{Entity}Details`, `{Entity}Data`, `{Action}{Entity}Request`
- Server Actions retornam `Promise<ApiResponse<T>>` diretamente

### 4.6 `parse-and-authentication-system.instructions.md`

**Parse System:**
- `Record<EnumType, TParse>` convertendo enums para UI
- NUNCA hardcodar traduções/labels na UI — sempre usar parse system

---

## 5. swiftpay-web-checkout — 6 Arquivos de Instrução

### 5.1 `runtime-and-payment-link-foundations.instructions.md`

**Template Runtime Architecture:**
- Templates isolados em `templates/{name}/`
- Contrato: `CheckoutTemplateModule { code, aliases?, render() }`
- Registro global em `core/checkout/runtime/templates/registry.ts`
- Resolução por código: `resolveCheckoutTemplate()` com fallback ao primeiro template

### 5.2 `template-authoring-and-shared-types.instructions.md`

**Como criar novo template:**
1. Criar `templates/{name}/module.tsx` + `index.tsx`
2. Implementar UI/fluxo APENAS dentro do template
3. Registrar no registry
4. Nenhuma alteração nas rotas necessária

---

## 6. Agentes e Skills

### Agentes Definidos

**`expert-nextjs-developer.agent.md`** (swiftpay-web)
- Especialista em: Next.js 16, App Router, Server Components, Cache Components, Turbopack

**`expert-react-frontend-engineer.agent.md`** (swiftpay-web)
- Especialista em: React 19.2, hooks modernos, Server Components, Actions

### Skills

**`refactor-to-react19`** (swiftpay-web)
- Migração de código React legado para React 19

---

## 7. Convenções Cross-Cutting (Todos os Módulos)

### Naming
- C#: PascalCase para tudo público, camelCase para privado
- TypeScript: PascalCase componentes/funções, camelCase variáveis/hooks
- Admin responses: prefixo `Admin` obrigatório
- Endpoints: `[Action][Resource]Endpoint`
- Mappers: `[Context][Entity]Mapper`

### Respostas
- Backend: SEMPRE `BaseResponse<T>` com `Data`, `Message`, `Error`
- Frontend: SEMPRE `ApiResponse<T>` diretamente (sem aliases)

### Erros
- C#: Exceções com mensagens em português
- TypeScript: Tratamento no interceptor Axios
- Logging: `ILogger` apenas `LogError`. Operações financeiras → `IApiLogService`

### Segurança
- Nunca expor dados de adquirente ao merchant (invisible acquirer)
- Credenciais sensíveis sempre criptografadas
- Tokens JWT com sliding renewal
- Rate limiting em endpoints sensíveis

### Performance
- React 19: `use(promise)`, não `useEffect`+`useState`
- .NET: Server GC, thread pool pre-alocado
- Banco: SplitQuery global, pool pre-warming
