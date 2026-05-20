---
description: "Use when editing application services, notifications, hubs, token handling, and storage or file access behavior."
applyTo: 'Services/Internal/**/*.cs, Interfaces/**/*.cs, Endpoints/**/Notifications/**/*.cs, Endpoints/Users/**/*.cs, Endpoints/Files/**/*.cs, Hubs/**/*.cs'
---

## Serviços Disponíveis

### ISecurityLogService
Registra logs de segurança no banco de dados.

```csharp
public sealed class MyEndpoint(
    ISecurityLogService securityLog
) : Endpoint<...>
{
    // Uso básico
    await securityLog.LogAsync(
        SecurityLogAction.UserSignIn,
        SecurityLogStatus.Success,
        userId,
        "Detalhes opcionais"
    );
}
```

### IEmailService
Envia emails usando templates.

```csharp
public sealed class MyEndpoint(
    IEmailService emailService
) : Endpoint<...>
{
    await emailService.SendAsync(
        "email@exemplo.com",
        "Assunto do Email",
        EmailTemplate.WelcomeEmail,
        new Dictionary<string, string>
        {
            { "name", "João" },
            { "link", "https://..." }
        }
    );
}
```

### INotificationService
Cria notificações para merchants (organização) ou usuários (pessoais).

O sistema de notificações possui dois escopos:

| Escopo | Alvo | Uso | SignalR Method |
|--------|------|-----|----------------|
| `Merchant` | Organização | Pagamentos, transações, saques | `NotificationReceived` |
| `User` | Usuário pessoal | Login, segurança, alteração de senha | `UserNotificationReceived` |

```csharp
public sealed class MyEndpoint(
    INotificationService notificationService
) : Endpoint<...>
{
    // ===== NOTIFICAÇÕES DE MERCHANT (organização) =====

    // Notificação genérica para merchant
    await notificationService.CreateAsync(
        merchantId,
        NotificationType.Info,
        "Título",
        "Mensagem"
    );

    // Notificação de sucesso para merchant
    await notificationService.CreateSuccessNotificationAsync(
        merchantId,
        "Pagamento Confirmado",
        "O pagamento #123 foi confirmado.",
        actionUrl: "/payments/123",
        actionLabel: "Ver Pagamento"
    );

    // Notificação de segurança para merchant
    await notificationService.CreateSecurityNotificationAsync(
        merchantId,
        "Novo Login Detectado",
        "Um novo dispositivo acessou sua conta."
    );

    // ===== NOTIFICAÇÕES DE USUÁRIO (pessoal) =====

    // Notificação genérica para usuário
    await notificationService.CreateUserNotificationAsync(
        userId,
        NotificationType.Info,
        "Título",
        "Mensagem"
    );

    // Notificação de segurança para usuário
    await notificationService.CreateUserSecurityNotificationAsync(
        userId,
        "Novo Dispositivo Confiável",
        "Um novo dispositivo foi adicionado à sua conta."
    );

    // Notificação informativa para usuário
    await notificationService.CreateUserInfoNotificationAsync(
        userId,
        "Bem-vindo!",
        "Sua conta foi criada com sucesso."
    );
}
```

**Endpoints de Notificações:**

| Endpoint | Método | Escopo | Descrição |
|----------|--------|--------|-----------|
| `GET /v1/merchant/{id}/notifications` | GET | Merchant | Listar notificações da organização |
| `GET /v1/merchant/{id}/notifications/count` | GET | Merchant | Contar não lidas da organização |
| `PATCH /v1/merchant/{id}/notifications/{nId}/read` | PATCH | Merchant | Marcar como lida |
| `PATCH /v1/merchant/{id}/notifications/read-all` | PATCH | Merchant | Marcar todas como lidas |
| `DELETE /v1/merchant/{id}/notifications/{nId}` | DELETE | Merchant | Deletar notificação |
| `GET /v1/users/notifications` | GET | User | Listar notificações pessoais |
| `GET /v1/users/notifications/count` | GET | User | Contar não lidas pessoais |
| `PATCH /v1/users/notifications/{id}/read` | PATCH | User | Marcar como lida |
| `PATCH /v1/users/notifications/read-all` | PATCH | User | Marcar todas como lidas |
| `DELETE /v1/users/notifications/{id}` | DELETE | User | Deletar notificação |

**Arquitetura SignalR:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE NOTIFICAÇÕES SIGNALR                        │
└──────────────────────────────────────────────────────────────────────────────┘

    NotificationService.CreateAsync()           NotificationService.CreateUserNotificationAsync()
           │                                                    │
           ▼                                                    ▼
    ┌─────────────────────┐                      ┌─────────────────────────────┐
    │ Scope = Merchant    │                      │ Scope = User                │
    │ MerchantId = X      │                      │ UserId = Y                  │
    │ UserId = null       │                      │ MerchantId = null           │
    └──────────┬──────────┘                      └──────────────┬──────────────┘
               │                                                │
               ▼                                                ▼
    ┌─────────────────────┐                      ┌─────────────────────────────┐
    │ MassTransit Publish │                      │ MassTransit Publish         │
    │ safefy.notification │                      │ safefy.notification.created │
    └──────────┬──────────┘                      └──────────────┬──────────────┘
               │                                                │
               └───────────────────┬────────────────────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ NotificationCreatedConsumer  │
                    │ (verifica Scope)             │
                    └──────────────┬───────────────┘
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
    ┌─────────────────────┐                 ┌─────────────────────────┐
    │ SendToMerchantAsync │                 │ SendToUserAsync         │
    │ Group: merchant:X   │                 │ Group: user:Y           │
    │ Method: Notification│                 │ Method: UserNotification│
    │         Received    │                 │         Received        │
    └─────────────────────┘                 └─────────────────────────┘
```

### SignalR Hubs - Arquitetura Padronizada

Todos os hubs herdam de `BaseHub` que centraliza autenticação e gerenciamento de grupos.

**Hubs disponíveis:**

| Hub | Path | Descrição |
|-----|------|-----------|
| `AuthHub` | `/hubs/auth` | Eventos de autenticação (email verificado, status do usuário, revogação de dispositivo) |
| `NotificationHub` | `/hubs/notifications` | Notificações in-app para merchants e usuários |
| `DashboardHub` | `/hubs/dashboard` | Atualizações de dashboard (merchant e admin) |

**Grupos padronizados (`SignalRGroups`):**

| Grupo | Formato | Uso |
|-------|---------|-----|
| User | `user:{userId}` | Eventos do usuário (status, notificações pessoais) |
| Device | `device:{deviceId}` | Revogação de dispositivo específico |
| Merchant | `merchant:{merchantId}` | Notificações do merchant |
| MerchantDashboard | `merchant:{merchantId}:dashboard` | Atualizações do dashboard do merchant |
| AdminDashboard | `admin:dashboard:{environment}` | Atualizações do dashboard admin por ambiente |

**BaseHub - Métodos utilitários:**

```csharp
public abstract class BaseHub(ISessionService sessionService) : Hub
{
    // Obter dados da sessão do Valkey
    protected string? GetSessionId();
    protected async Task<UserSession?> GetSessionAsync();
    protected async Task<Guid?> GetUserIdAsync();
    protected async Task<bool> IsAdminAsync();

    // Gerenciamento de grupos
    protected async Task JoinUserGroupAsync(Guid userId);
    protected async Task LeaveUserGroupAsync(Guid userId);
    protected async Task JoinDeviceGroupAsync(string deviceId);
    protected async Task LeaveDeviceGroupAsync(string deviceId);
    protected async Task JoinMerchantGroupAsync(Guid merchantId);
    protected async Task LeaveMerchantGroupAsync(Guid merchantId);
    protected async Task JoinMerchantDashboardGroupAsync(Guid merchantId);
    protected async Task LeaveMerchantDashboardGroupAsync(Guid merchantId);
    protected async Task JoinAdminDashboardGroupAsync(string environment);
    protected async Task LeaveAdminDashboardGroupAsync(string environment);
}
```

**Enviar mensagens para grupos (services):**

```csharp
// Use SignalRGroups para os nomes dos grupos
await hubContext.Clients
    .Group(SignalRGroups.User(userId))
    .SendAsync(SignalRMethods.UserStatusChanged, data);

await hubContext.Clients
    .Group(SignalRGroups.MerchantDashboard(merchantId))
    .SendAsync(SignalRMethods.MerchantDashboardUpdated, data);

await hubContext.Clients
    .Group(SignalRGroups.AdminDashboard(environment.ToString()))
    .SendAsync(SignalRMethods.AdminDashboardUpdated, data);
```

**Grupos automáticos ao conectar:**

- **AuthHub**: `user:{userId}`, `device:{deviceId}` (se fornecido via query)
- **NotificationHub**: `user:{userId}`, `merchant:{merchantId}` (se fornecido via query)
- **DashboardHub**: Grupos são gerenciados via métodos `JoinMerchantDashboard()` e `JoinAdminDashboard()`

### IPushNotificationService
Gerencia Push Notifications via Firebase Cloud Messaging (FCM).

```csharp
public sealed class MyEndpoint(
    IPushNotificationService pushService
) : Endpoint<...>
{
    // Enviar push notification para um usuário
    await pushService.SendPushNotificationAsync(
        userId,
        "Título da Notificação",
        "Corpo da mensagem",
        new Dictionary<string, string>
        {
            { "notificationId", "123" },
            { "actionUrl", "/payments/123" }
        }
    );

    // Enviar para todos os usuários de um merchant
    await pushService.SendPushNotificationToMerchantUsersAsync(
        merchantId,
        "Pagamento Recebido",
        "Você recebeu um novo pagamento."
    );

    // Registrar token FCM do dispositivo
    await pushService.RegisterTokenAsync(
        userId,
        "fcm_token_here",
        PushTokenPlatform.Web,
        "Chrome on Windows"
    );

    // Remover token do dispositivo
    await pushService.UnregisterTokenAsync(userId, "fcm_token_here");
}
```

**Integração automática**: O `NotificationService.CreateAsync` automaticamente envia push notifications em background quando uma notificação in-app é criada.

**Endpoints:**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /v1/users/push-tokens` | POST | Registrar token FCM do dispositivo |
| `DELETE /v1/users/push-tokens` | DELETE | Remover token FCM do dispositivo |

### ITokenService
Gerencia tokens JWT e refresh tokens.

```csharp
public sealed class MyEndpoint(
    ITokenService tokenService
) : Endpoint<...>
{
    // Gerar token JWT
    var jwt = tokenService.GenerateToken(new UserSubject { ... });

    // Gerar refresh token
    var refreshToken = await tokenService.GenerateRefreshToken(userId);

    // Rotacionar refresh token
    var newToken = await tokenService.RotateRefreshToken(oldToken);

    // Revogar refresh token
    await tokenService.RevokeRefreshToken(token, "Logout manual");

    // Revogar todos os tokens do usuário
    await tokenService.RevokeAllUserRefreshTokens(userId, "Alteração de senha");
}
```


### IStorageService
Gerencia upload e acesso a arquivos em Object Storage S3-compatible (ex.: DigitalOcean Spaces).

**IMPORTANTE**: Os arquivos são persistidos na tabela `StoredFiles` do banco de dados, permitindo consultas por ID, acesso via URL pré-assinada com cache, e armazenamento de metadados (nome, tamanho, tipo).

```csharp
public sealed class MyEndpoint(
    IStorageService storageService,
    PrimaryDbContext dbContext
) : Endpoint<...>
{
    // Upload de arquivo privado (padrão)
    var result = await storageService.UploadFileAsync(
        stream,
        fileName,
        contentType,
        UploadFolder.Kyc,
        ownerId: merchantId,      // Dono do recurso (merchant)
        uploaderId: userId,        // Quem fez o upload
        isPublic: false           // Privado por padrão
    );
    // result.ObjectName = "private/kyc/{merchantId}/{uuid}.pdf"
    // result.Url = URL presigned (12 horas)
    // result.Size = tamanho em bytes
    // result.ContentType = tipo MIME

    // Salvar no banco de dados
    var storedFile = new StoredFile
    {
        ObjectName = result.ObjectName,
        OriginalFileName = result.OriginalFileName,
        ContentType = result.ContentType,
        Size = result.Size,
        IsPublic = result.IsPublic,
        Folder = result.Folder,
        OwnerId = result.OwnerId,
        UploaderId = result.UploaderId,
        CachedUrl = result.Url,
        CachedUrlExpiresAt = result.IsPublic ? null : DateTime.UtcNow.AddHours(12)
    };
    dbContext.StoredFiles.Add(storedFile);
    await dbContext.SaveChangesAsync(ct);
    // storedFile.Id = GUID do arquivo no banco

    // Obter ou atualizar URL (usa cache, renova se expirada)
    var url = await storageService.GetOrRefreshUrlAsync(storedFile);
    await dbContext.SaveChangesAsync(ct); // Salva URL atualizada no cache

    // Deletar arquivo
    await storageService.DeleteFileAsync(objectName);

    // Verificar se arquivo existe
    var exists = await storageService.FileExistsAsync(objectName);
}
```

#### Tabela StoredFiles

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `Id` | GUID | Identificador único do arquivo |
| `ObjectName` | string | Path no bucket (unique) |
| `OriginalFileName` | string | Nome original do arquivo |
| `ContentType` | string | Tipo MIME |
| `Size` | long | Tamanho em bytes |
| `IsPublic` | bool | Se é público ou privado |
| `Folder` | enum | Pasta (Kyc, Products, etc) |
| `OwnerId` | GUID | ID do merchant dono |
| `UploaderId` | GUID | ID do usuário que fez upload |
| `CachedUrl` | string? | URL pré-assinada em cache |
| `CachedUrlExpiresAt` | DateTime? | Data de expiração da URL (null para públicos) |
| `CreatedAt` | DateTime | Data de criação |

#### Endpoints de Arquivos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /v1/merchant/upload` | POST | Upload de arquivo (retorna FileId) |
| `GET /v1/files/{id}` | GET | Obter metadados e URL do arquivo |

#### Sistema de Cache de URLs Pré-Assinadas

O sistema utiliza URLs pré-assinadas com cache no banco de dados para otimizar performance:

**Para arquivos públicos:**
- URL permanente gerada uma vez e salva em `CachedUrl`
- `CachedUrlExpiresAt` é `null` (nunca expira)

**Para arquivos privados:**
- URL pré-assinada com validade de 12 horas
- `CachedUrl` armazena a URL atual
- `CachedUrlExpiresAt` armazena quando expira
- Método `GetOrRefreshUrlAsync` renova automaticamente se expirada

```csharp
// Verificar se URL expirou
if (storedFile.IsUrlExpired())
{
    // GetOrRefreshUrlAsync atualiza automaticamente
    var url = await storageService.GetOrRefreshUrlAsync(storedFile);
    await dbContext.SaveChangesAsync(ct);
}
```

#### Estrutura de Pastas no Storage

```
bucket/
├── public/                    # Arquivos públicos (acesso livre)
│   ├── products/{merchantId}/
│   ├── checkouts/{merchantId}/
│   └── merchants/{merchantId}/
└── private/                   # Arquivos privados (URL pré-assinada)
    ├── kyc/{merchantId}/
    ├── avatars/{userId}/
    └── merchants/{merchantId}/
```

#### Controle de Visibilidade (S3/Spaces)

- Em providers S3-compatíveis como **DigitalOcean Spaces**, a visibilidade deve ser definida por **objeto no upload**.
- O `StorageService` define ACL por arquivo via header `x-amz-acl`:
    - `public-read` para uploads com `isPublic = true`
    - `private` para uploads com `isPublic = false`
- Não depender de policy global de bucket para separar público/privado.

#### Controle de Acesso (Arquivos Privados)

Arquivos privados só podem ser acessados por:
1. **Uploader**: O usuário que fez o upload (`uploaderId`)
2. **Owner**: O dono do merchant vinculado ao arquivo (`ownerId`)
3. **Admin/God**: Usuários com role `Admin` ou `God`

---



