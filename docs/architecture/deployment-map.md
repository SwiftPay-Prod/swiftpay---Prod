# SWIFTPAY — Mapa de Implantação (Deployment)

> **Data de análise:** 21/05/2026

---

## 1. Topologia de Serviços
### Produção (`docker-compose.production.yaml`)

| Serviço | Container | Imagem | Porta | Health Check | Dependências |
|---------|-----------|--------|-------|-------------|-------------|
| **swiftpaydb** | swiftpaydb | `postgres:15.15-alpine3.22` | 5432:5432 | `pg_isready` (10s/5s/5) | — |
| **swiftpaylogsdb** | swiftpaylogsdb | `postgres:15.15-alpine3.22` | 5433:5432 | `pg_isready` (10s/5s/5) | — |
| **swiftpaymail** | swiftpaymail | `mailhog/mailhog:latest` | 8025:8025, 1025:1025 | — | — |
| **swiftpayrabbitmq** | swiftpayrabbitmq | `rabbitmq:3.13-management-alpine` | 5672:5672, 15672:15672 | `rabbitmq-diagnostics ping` (10s/5s/5) | — |
| **swiftpayvalkey** | swiftpayvalkey | `valkey/valkey:8-alpine` | 6379:6379 | `valkey-cli ping` (10s/5s/5) | — |
| **swiftpaystorage** | swiftpaystorage | `minio/minio:RELEASE.2025-09-07T16-13-09Z` | 9000:9000, 9001:9001 | `curl /minio/health/live` (10s/5s/5) | — |
| **swiftpaystorage-init** | swiftpaystorage-init | `minio/minio:RELEASE.2025-09-07T16-13-09Z` | — | — | swiftpaystorage (healthy) |
| **grafana** | grafana | `grafana/grafana:10.2.3` | 3001:3000 | — | — |
| **swiftpayapi** | swiftpayapi | Custom build (Dockerfile) | 5279:5279 | `curl /health/ready` (30s/10s/3) | swiftpaydb (healthy), swiftpaylogsdb (healthy), swiftpaymail (started), swiftpayvalkey (healthy), swiftpaystorage-init (completed) |
| **swiftpayapipayment** | swiftpayapipayment | Custom build (Dockerfile) | 5166:5166 | `curl /health/ready` (30s/10s/3) | swiftpaydb (healthy), swiftpaylogsdb (healthy), swiftpayapi (started) |
| **swiftpayweb** | swiftpayweb | Custom build (swiftpay-web/Dockerfile) | 3000:3000 | `curl /` (30s/10s/3) | swiftpayapi (started), swiftpayapipayment (started) |
| **swiftpaywebcheckout** | swiftpaywebcheckout | Custom build (swiftpay-web-checkout/Dockerfile) | 5002:3000 | `curl /` (30s/10s/3) | swiftpayapipayment (healthy) |

### Desenvolvimento (`docker-compose.development.yaml` — adicionais além de produção)

| Serviço | Imagem | Porta |
|---------|--------|-------|
| **swiftpayrabbitmq** | `rabbitmq:3.13-management-alpine` | 5672:5672, 15672:15672 (UI) |
| **swiftpaystorage** | `minio/minio:RELEASE.2025-09-07T16-13-09Z` | 9000:9000, 9001:9001 (Console) |
| **swiftpaystorage-init** | minio/minio (init container) | — (cria bucket) |
| **swiftpaydb** | `postgres:17-alpine` (PG 17) | 5432:5432 |
| **swiftpayweb** | Custom build | 3001:3000 |

> Nota operacional: `start.sh` é somente para desenvolvimento local. Em produção, use `docker-compose.production.yaml` e o fluxo documentado de deploy/rollback.
---

## 2. Docker — Padrões Multi-Stage Build

### swiftpay-api (Produção) — 3 estágios

```
Estágio 1: base   → mcr.microsoft.com/dotnet/aspnet:10.0
                    └─ Instala libgssapi-krb5-2 (Kerberos PostgreSQL)
                    └─ EXPOSE 5279

Estágio 2: build  → mcr.microsoft.com/dotnet/sdk:10.0
                    └─ Requer GITHUB_USER + GITHUB_TOKEN (build args)
                    └─ Adiciona NuGet source: GitHub Packages (swiftpay-api-core)
                    └─ Restaura + copia source

Estágio 3: publish → FROM build
                    └─ dotnet publish -c Release -o /app/publish

Estágio 4: final  → FROM base
                    └─ COPY --from=publish /app/publish .
                    └─ ENTRYPOINT ["dotnet", "swiftpay-api.dll"]
```

### swiftpay-api (Desenvolvimento) — 3 estágios + core local

Diferença: Copia `swiftpay-api-core/` como source local (não usa NuGet). `--ignore-failed-sources` no restore.

### swiftpay-api-payment — 3 estágios

Idêntico ao de desenvolvimento da swiftpay-api. SEMPRE usa core local.

### swiftpay-web — 3 estágios (Node.js)

```
Estágio 1: deps   → node:20-alpine
                    └─ npm ci

Estágio 2: builder → node:20-alpine
                    └─ Copia node_modules do deps
                    └─ NODE_ENV=production npm run build

Estágio 3: runner  → node:20-alpine
                    └─ Usuário não-root (nextjs, uid:gid 1001)
                    └─ Copia public/, .next/standalone/, .next/static/
                    └─ EXPOSE 3000, CMD ["node", "server.js"]
```

---

## 3. CI/CD — GitHub Actions

### Único pipeline existente: `swiftpay-api-core/.github/workflows/publish.yml`

| Gatilho | Ação |
|---------|------|
| Git tag `v*` | Build + Pack + Push NuGet |
| workflow_dispatch (manual) | Build + Pack + Push NuGet |

**Fluxo:**
```
checkout → setup-dotnet (10.0.x) → extract version from tag → dotnet restore
→ dotnet build -c Release → dotnet pack -c Release -o ./nupkg
→ dotnet nuget push → GitHub Packages (nuget.pkg.github.com/SwiftPay-Pay/)
→ Upload artifact (nupkg)
```

**Não há CI/CD para swiftpay-api, swiftpay-api-payment, swiftpay-web, ou swiftpay-web-checkout.**

---

## 4. Configuração — Hierarquia

### Ordem de carregamento (.NET)

```
1. appsettings.json                    (base defaults)
2. appsettings.{ENVIRONMENT}.json      (environment-specific)
3. Variáveis de ambiente               (override)
4. Argumentos de linha de comando       (override final)
```

### Seções de Configuração (swiftpay-api)

| Seção | Model | Defaults Notáveis |
|-------|-------|-------------------|
| `PlatformSettings` | `PlatformSettingsOptions` | BaseUrl=https://swiftpay.com.br, MaxLoginAttempts=5 |
| `PaymentApi` | `PaymentApiSettings` | BaseUrl=http://localhost:5166/, InternalApiKey="" |
| `DatabaseSettings` | `DatabaseSettingsOptions` | ConnectionString="" (obrigatório) |
| `LogsDatabaseSettings` | `LogsDatabaseSettingsOptions` | ConnectionString="" |
| `ValkeySettings` | `ValkeySettings` | localhost:6379, InstanceName=swiftpay: |
| `JWTSettings` | `JWTSettingsOptions` | Issuer/Audience=swiftpay, TokenExpiryDays=7 |
| `EmailSettings` | `EmailSettingsOptions` | Provider=Resend, EnableSend=true |
| `StorageSettings` | `StorageSettingsOptions` | Endpoint=sfo3.digitaloceanspaces.com, UseSSL=true |
| `RabbitMQSettings` | `RabbitMQSettings` | Enabled=false (!) |
| `FirebaseSettings` | `FirebaseSettings` | Enabled=false (!) |

### Salvaguardas de Produção

No ambiente `Production`:
- `ReloadOnChange` desabilitado para `JsonConfigurationSource` (evita file handles abertos)
- `BackgroundServiceExceptionBehavior = Ignore` (background service crashes não derrubam o host)

---

## 5. Middleware Pipeline

### swiftpay-api (ordem de execução)

```
[Staging]      UseStagingDocsAuth()
[!Dev]         UseHttpsRedirection()
| [Staging]      | UseStagingDocsAuth() |
| [!Dev]         | UseHttpsRedirection() |
| [!Dev]         | UseRateLimiter() |
|                | UseCors() |
|                | UseCorrelationId() |
|                | SignalRQueryStringAuthenticationMiddleware (`/hubs` only: `access_token` → `Authorization`) |
|                | UseAuthentication() |
|                | UseSessionValidation() |
|                | UseAuthorization() |
|                | UseSecurityLogContext() |
|                | UseApiLogContext() |
|                | UseMiniProfiler() *(apenas Development/Staging)* |
|                | UseFastEndpoints() |
                /health/ready (readiness — checks completos)
                /health       (full health)

SignalR Hub:    /hubs/notifications (MainHub)
```

### swiftpay-api-payment

```
               UseStaticFiles()
[Production]   UseHttpsRedirection()
               EnableBuffering (apenas POST /v1/internal/*)
               UseCors()
               UseCorrelationId()
               UseAuthentication()
               UseAuthorization()
               UseCredentialValidation()
               UseCheckoutEnvironment()
               UseApiLogContext()
               UseMiniProfiler()
               UseFastEndpoints()

Health Checks:  /health/live, /health/ready, /health
SignalR Hub:    /hubs/payment-status (PaymentStatusHub, CORS: CheckoutCorsPolicy)
```

---

:**Produção:** Apenas origens HTTPS `swiftpay.com.br` e `*.swiftpay.com.br`

### swiftpay-api-payment

Duas políticas:
1. **Default:** `AllowAnyOrigin() + AllowAnyHeader() + AllowAnyMethod()` (sem credentials)
2. **CheckoutCorsPolicy (SignalR):** Origem do checkout (`PlatformSettings:CheckoutBaseUrl`) OR `*.swiftpay.com.br` HTTPS + Credentials

---

## 7. Rate Limiting

### swiftpay-api (somente Produção)

Implementação: ASP.NET Core `SlidingWindowRateLimiter`

| Política | Limite | Janela | Segmentos | Chave de Partição |
|----------|--------|--------|-----------|-------------------|
| **Global** | 600 req/min | 1 min | 6 | email → IP → "anonymous" |
| **auth** | 20 req/min | 1 min | 6 | email → IP → "anonymous" |
| **users** | 20 req/min | 1 min | 6 | email → IP → "anonymous" |
| **files** | 20 req/min | 1 min | 6 | email → IP → "anonymous" |

### swiftpay-api-payment

Rate limiting por merchant via `MerchantRateLimitPreProcessor` (configurável, default: 60/min, 1000/hora, 10000/dia). Rate limiting por IP via `IpRateLimitPreProcessor` no endpoint de token.

---

## 8. Banco de Dados

### Pool de Conexões

- `NpgsqlDataSource` singleton com `EnableDynamicJson()`
- `QuerySplittingBehavior.SplitQuery` global
- Pre-warming no startup: `MinPoolSize` conexões abertas (ou 1 se não configurado)
- Ambos os bancos (primary + logs) pre-aquecidos

### Migrações

- Primary DB: `context.Database.MigrateAsync()` + `PrimaryDbInitialize.Initialize()` (seed)
- Log DB: `context.Database.MigrateAsync()` (schema apenas)
- Log DB no swiftpay-api-payment: loop de retry (30 tentativas, 1s delay) — não cria schema, só valida conectividade

### GC Configuration

Ambos `swiftpay-api.csproj` e `swiftpay-api-payment.csproj`:
```xml
<ServerGarbageCollection>true</ServerGarbageCollection>
<ConcurrentGarbageCollection>true</ConcurrentGarbageCollection>
```

---

## 9. Valkey (Cache/Sessão)

**Tecnologia:** StackExchange.Redis via `Microsoft.Extensions.Caching.StackExchangeRedis`

**Configuração do Container:**
```
valkey-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
```

**Data Protection:** Chaves persistidas no Primary DB via `PersistKeysToDbContext<PrimaryDbContext>()`

---

## 10. Hangfire (Background Jobs)

**Storage:** Valkey/Redis (`Hangfire.Redis.StackExchange`)
**Prefix:** `swiftpay:hangfire:`
**DB:** 0

**Server:** 2 workers, filas: `["automatic-cashout", "ranking"]`, nome: `swiftpay-api-{MachineName}`

**Jobs Recorrentes:**

| Job | Fila | Frequência | Timezone |
|-----|------|-----------|----------|
| `automatic-merchant-cashout-hourly` | automatic-cashout | A cada minuto | America/Sao_Paulo |
| `automatic-platform-cashout-hourly` | automatic-cashout | A cada minuto | America/Sao_Paulo |
| `ranking-process-production` | ranking | `*/5 * * * *` | America/Sao_Paulo |

**Dashboard:** NÃO mapeado (sem `UseHangfireDashboard()`)

---

## 11. Kestrel

Ambas APIs:
```csharp
options.Limits.MaxConcurrentConnections = 2000;
options.Limits.MaxConcurrentUpgradedConnections = 2000;
options.Limits.MinRequestBodyDataRate = null;  // sem timeout para uploads lentos
```

---

## 12. Thread Pool

```csharp
ThreadPool.SetMinThreads(100, 100);  // executado no topo do Program.cs de ambas APIs
```

---

## 13. Premissas de Infraestrutura

| Componente | Versão | Nota |
|-----------|--------|------|
| .NET Runtime | 10.0 | mcr.microsoft.com/dotnet/aspnet:10.0 |
| Node.js | 20 LTS | node:20-alpine |
| PostgreSQL (dev) | 17 | alpine |
| PostgreSQL (prod) | 15.15 | alpine3.22 |
| Valkey | 8 | alpine, 256MB max |
| RabbitMQ | 3.13 | management-alpine (dev only) |
| Grafana | 10.2.3 | dashboards provisionados |
| DigitalOcean Spaces | SFO3/NYC3 | storage de produção |

### ⚠️ Discrepâncias identificadas:
1. **PostgreSQL:** Dev usa PG 17, Prod compose usa PG 15.15
2. **DO Spaces:** appsettings.json referencia `sfo3` mas next.config.ts referencia `nyc3` — ambientes ou regiões diferentes
3. **RabbitMQ:** Desabilitado por padrão (`Enabled = false`), mas docker-compose dev provê e consumers estão registrados
