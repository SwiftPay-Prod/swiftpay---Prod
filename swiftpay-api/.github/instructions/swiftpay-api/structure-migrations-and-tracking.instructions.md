---
description: "Use when editing project structure conventions, migration strategy, and merchant tracking integrations."
applyTo: 'Database/Migrations/**/*.cs, Database/**/*.cs, Endpoints/**/Integrations/**/*.cs, Services/Internal/*Integration*.cs, Services/Internal/*Tracking*.cs, Interfaces/*Integration*.cs'
---

## Estrutura de Pastas

```
Endpoints/
├── Admin/                    # Endpoints administrativos
│   └── [NomeAcao]/
│       ├── [NomeAcao]Endpoint.cs
│       └── [NomeAcao]Models.cs
├── Auth/                     # Endpoints de autenticação
├── Merchants/                # Endpoints de merchants
├── Users/                    # Endpoints de usuários
├── Models/                   # Modelos compartilhados (BaseResponse, Paginated)
└── Utils/                    # Utilitários (EndpointUtils, CryptoUtils)

EndpointsGroups/              # Grupos de endpoints (prefixos e configurações)
Interfaces/                   # Interfaces de serviços
Services/Internal/            # Implementações de serviços
Filters/                      # Filtros globais (SecurityLogFilter)
Extensions/                   # Extensions methods
Attributes/                   # Atributos customizados
Validators/                   # Validadores compartilhados
```

---

## Migrations (PrimaryDbContext)

- As migrations do banco principal ficam em `Database/Migrations/Primary`
- Sempre gerar migrations com o output-dir correto:
    `dotnet ef migrations add <Nome> --context PrimaryDbContext --output-dir Database/Migrations/Primary`
- Em caso de squash/reset, mantenha apenas a migration baseline nessa pasta e alinhe a tabela `__EFMigrationsHistory` nos ambientes
- **Produção**: executar migração automática no startup da API (`Database.Migrate()` habilitado em `Production`)
- O deploy ainda pode aplicar migrations no pipeline, mas o startup da aplicação também garante sincronização automática do schema
- Não adicionar rotinas de compatibilidade de schema via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` no bootstrap (`PrimaryDbInitialize`); evolução de schema deve ocorrer exclusivamente por migrations

## Migrations (LogDbContext)

- As migrations do banco de logs ficam em `Database/Migrations/Logs` no projeto `swiftpay-api`
- O `LogDbContext` pertence ao `swiftpay-api-core`, mas o assembly de migrations deve ser `swiftpay-api`
- Sempre gerar migrations com o output-dir correto:
    `dotnet ef migrations add <Nome> --context LogDbContext --output-dir Database/Migrations/Logs --project swiftpay-api.csproj --startup-project swiftpay-api.csproj`
- Se o banco de logs ja existir sem registros em `__EFMigrationsHistory`, alinhar o baseline antes de aplicar a primeira migration em ambientes existentes

## Integrações do Merchant (Tracking)

- Endpoints do merchant para integrações:
    - `GET /v1/merchant/{merchantId}/integrations`
    - `PATCH /v1/merchant/{merchantId}/integrations/{provider}`
- Providers suportados no `type = Tracking`:
    - `Utmify`
    - `Otimizey`
- A configuração da integração deve ser persistida na tabela dedicada `MerchantIntegrations` (por `MerchantId + Provider + Environment`).
- O payload de leitura deve retornar `configFields` (schema centralizado por provider) e `configValues` (valores atuais) para permitir formulários dinâmicos.
- O payload de update deve aceitar `configValues` parcial (merge) e permitir `enabled = false` sem apagar configurações existentes nem resetar notificações.
- Para compatibilidade temporária, `apiToken` pode ser aceito no update para mapear automaticamente o primeiro campo de configuração do provider.
- Notificações suportadas para providers de tracking:
    - `waitingPayment`
    - `paid`
    - `refused`
    - `refunded`
    - `chargedback`

---



