using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Constants;
using safefy_api_core.Models.Acquirer;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Acquirers.CreateAcquirer;

public sealed class CreateAcquirerEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<CreateAcquirerRequest, CreateAcquirerResponse>
{
    public override void Configure()
    {
        Post("acquirers");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CreateAcquirerRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateAcquirerResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var userRole = EndpointUtils.GetUserRole(User);
        if (userRole != "God")
        {
            await Send.ResponseAsync(new CreateAcquirerResponse
            {
                Error = new("Apenas usuários com cargo God podem criar adquirentes.")
            }, 403, ct);
            return;
        }

        var existingDisplayName = await dbContext.Acquirers
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Type == req.AcquirerType && a.DisplayName == req.DisplayName, ct);

        if (existingDisplayName != null)
        {
            await Send.ResponseAsync(new CreateAcquirerResponse
            {
                Error = new($"Já existe uma adquirente do tipo {req.AcquirerType} com o nome de exibição '{req.DisplayName}'.")
            }, 409, ct);
            return;
        }

        var defaults = BuildDefaults(req.AcquirerType);

        if (req.PixEnabled == true && !defaults.SupportsPix)
        {
            await Send.ResponseAsync(new CreateAcquirerResponse
            {
                Error = new("Não é possível habilitar PIX pois a adquirente não suporta esta operação.")
            }, 400, ct);
            return;
        }

        if (req.BoletoEnabled == true && !defaults.SupportsBoleto)
        {
            await Send.ResponseAsync(new CreateAcquirerResponse
            {
                Error = new("Não é possível habilitar Boleto pois a adquirente não suporta esta operação.")
            }, 400, ct);
            return;
        }

        if (req.CreditCardEnabled == true && !defaults.SupportsCreditCard)
        {
            await Send.ResponseAsync(new CreateAcquirerResponse
            {
                Error = new("Não é possível habilitar Cartão de Crédito pois a adquirente não suporta esta operação.")
            }, 400, ct);
            return;
        }

        var newCode = GetCodePrefix(req.AcquirerType);

        var newAcquirer = new Acquirer
        {
            Id = Guid.CreateVersion7(),
            ClonedFromId = null,
            Name = defaults.Name,
            Code = newCode,
            DisplayName = req.DisplayName,
            Description = req.Description ?? defaults.Description,
            LogoUrl = defaults.LogoUrl,
            Type = req.AcquirerType,
            ProviderCategory = defaults.ProviderCategory,
            OperationTypes = defaults.OperationTypes,
            IsActive = true,
            SupportsPix = defaults.SupportsPix,
            SupportsCreditCard = defaults.SupportsCreditCard,
            SupportsBoleto = defaults.SupportsBoleto,
            SupportsWithdrawal = defaults.SupportsWithdrawal,
            SupportsRefund = defaults.SupportsRefund,
            PixEnabled = req.PixEnabled ?? defaults.PixEnabled,
            BoletoEnabled = req.BoletoEnabled ?? defaults.BoletoEnabled,
            CreditCardEnabled = req.CreditCardEnabled ?? defaults.CreditCardEnabled,
            ApiBaseUrl = defaults.ApiBaseUrl,
            ApiBaseUrlProduction = defaults.ApiBaseUrlProduction,
            ApiBaseUrlSandbox = defaults.ApiBaseUrlSandbox,
            AuthType = defaults.AuthType,
            CredentialSchema = defaults.CredentialSchema,
            DocumentationUrl = defaults.DocumentationUrl,
            WebhookDocumentationUrl = defaults.WebhookDocumentationUrl,
            WebhookAuthMode = defaults.WebhookAuthMode,
            WebhookAllowedIps = defaults.WebhookAllowedIps,
            WebhookToken = null,
            DefaultCredentials = null,
            DefaultCredentialsSandbox = null,
            AccessAccounts = NormalizeAccessAccounts(req.AccessAccounts),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.Acquirers.Add(newAcquirer);
        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new CreateAcquirerResponse
        {
            Data = new CreateAcquirerData
            {
                Id = newAcquirer.Id,
                Name = newAcquirer.Name,
                Code = newAcquirer.Code,
                DisplayName = newAcquirer.DisplayName,
                Description = newAcquirer.Description,
                Type = newAcquirer.Type.ToString(),
                OperationTypes = newAcquirer.OperationTypes.Select(t => t.ToString()).ToList(),
                IsActive = newAcquirer.IsActive,
                SupportsPix = newAcquirer.SupportsPix,
                SupportsBoleto = newAcquirer.SupportsBoleto,
                SupportsCreditCard = newAcquirer.SupportsCreditCard,
                PixEnabled = newAcquirer.PixEnabled,
                BoletoEnabled = newAcquirer.BoletoEnabled,
                CreditCardEnabled = newAcquirer.CreditCardEnabled,
                AccessAccounts = newAcquirer.AccessAccounts,
                CreatedAt = newAcquirer.CreatedAt
            },
            Message = $"Adquirente '{req.DisplayName}' criada com sucesso."
        }, 201, ct);
    }

    private static List<AcquirerPortalAccessAccount> NormalizeAccessAccounts(List<AcquirerPortalAccessAccountInput>? accounts)
    {
        if (accounts == null || accounts.Count == 0)
            return [];

        return accounts
            .Where(a => !string.IsNullOrWhiteSpace(a.Login))
            .Select(a => new AcquirerPortalAccessAccount
            {
                Login = a.Login.Trim(),
                Password = string.IsNullOrWhiteSpace(a.Password) ? string.Empty : a.Password.Trim(),
                Description = string.IsNullOrWhiteSpace(a.Description) ? null : a.Description.Trim()
            })
            .Where(a => !string.IsNullOrWhiteSpace(a.Password))
            .ToList();
    }

    private static string GetCodePrefix(AcquirerType type) => type switch
    {
        AcquirerType.Bankizi => "bankizi",
        AcquirerType.IHubBanking => "ihubbanking",
        AcquirerType.ActivePayments => "activepayments",
        AcquirerType.Rapdyn => "rapdyn",
        AcquirerType.Coldfy => "coldfy",
        AcquirerType.Pluggou => "pluggou",
        AcquirerType.HunterPay => "hunterpay",
        AcquirerType.Accithus => "accithus",
        _ => type.ToString().ToLowerInvariant()
    };

    private static AcquirerCreationDefaults BuildDefaults(AcquirerType type)
    {
        var requiredFields = AcquirerRequiredFieldsDefaults.GetDefaultConfig(type);

        var supportsPix = requiredFields.Pix?.Supported == true;
        var supportsBoleto = requiredFields.Boleto?.Supported == true;
        var supportsCreditCard = requiredFields.CreditCard?.Supported == true;
        var supportsWithdrawal = requiredFields.Withdrawal?.Supported == true;

        var metadata = AcquirerDefaultsConstants.GetMetadata(type);

        return new AcquirerCreationDefaults
        {
            Name = type.ToString(),
            Description = metadata.Description,
            LogoUrl = null,
            ProviderCategory = type == AcquirerType.Accithus ? ProviderCategory.PaymentInstitution : ProviderCategory.Acquirer,
            OperationTypes = type == AcquirerType.ActivePayments
                ? [AcquirerOperationType.White, AcquirerOperationType.Black]
                : [AcquirerOperationType.White],
            SupportsPix = supportsPix,
            SupportsBoleto = supportsBoleto,
            SupportsCreditCard = supportsCreditCard,
            SupportsWithdrawal = supportsWithdrawal,
            SupportsRefund = true,
            PixEnabled = supportsPix,
            BoletoEnabled = supportsBoleto,
            CreditCardEnabled = supportsCreditCard,
            ApiBaseUrl = metadata.ApiBaseUrlProduction,
            ApiBaseUrlProduction = metadata.ApiBaseUrlProduction,
            ApiBaseUrlSandbox = metadata.ApiBaseUrlSandbox,
            AuthType = MapAuthMethod(requiredFields.Auth.Method),
            CredentialSchema = BuildCredentialSchema(requiredFields),
            DocumentationUrl = metadata.DocumentationUrl,
            WebhookDocumentationUrl = metadata.WebhookDocumentationUrl,
            WebhookAuthMode = metadata.WebhookAuthMode,
            WebhookAllowedIps = string.Empty
        };
    }

    private static string MapAuthMethod(string? method)
    {
        return method?.Trim().ToLowerInvariant() switch
        {
            "oauth2" => "client_credentials",
            "basicauth" => "basic_auth",
            "apikey" => "api_key",
            "bearer" => "bearer",
            "apiheaders" => "api_headers",
            _ => "basic_auth"
        };
    }

    private static string? BuildCredentialSchema(AcquirerRequiredFieldsConfig config)
    {
        if (config.Auth.Fields.Count == 0)
            return null;

        var fields = config.Auth.Fields.Select(field =>
        {
            var isPassword = IsSensitiveField(field.Name, field.Label);

            return (
                key: field.Name,
                label: string.IsNullOrWhiteSpace(field.Label) ? field.Name : field.Label,
                type: isPassword ? CredentialFieldType.Password : CredentialFieldType.Text,
                required: field.Required,
                placeholder: field.Example,
                description: field.Description
            );
        }).ToArray();

        return CredentialUtils.BuildSchema(fields);
    }

    private static bool IsSensitiveField(string? name, string? label)
    {
        var candidate = $"{name} {label}".ToLowerInvariant();

        return candidate.Contains("secret")
               || candidate.Contains("token")
               || candidate.Contains("password")
               || candidate.Contains("apikey")
               || candidate.Contains("api key");
    }

    private sealed class AcquirerCreationDefaults
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
        public ProviderCategory ProviderCategory { get; set; }
        public List<AcquirerOperationType> OperationTypes { get; set; } = [];
        public bool SupportsPix { get; set; }
        public bool SupportsBoleto { get; set; }
        public bool SupportsCreditCard { get; set; }
        public bool SupportsWithdrawal { get; set; }
        public bool SupportsRefund { get; set; }
        public bool PixEnabled { get; set; }
        public bool BoletoEnabled { get; set; }
        public bool CreditCardEnabled { get; set; }
        public string? ApiBaseUrl { get; set; }
        public string? ApiBaseUrlProduction { get; set; }
        public string? ApiBaseUrlSandbox { get; set; }
        public string AuthType { get; set; } = string.Empty;
        public string? CredentialSchema { get; set; }
        public string? DocumentationUrl { get; set; }
        public string? WebhookDocumentationUrl { get; set; }
        public WebhookAuthMode WebhookAuthMode { get; set; }
        public string? WebhookAllowedIps { get; set; }
    }
}
