using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Integrations;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.Integrations.UpdateIntegration;

public sealed class UpdateIntegrationEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider
) : Endpoint<UpdateIntegrationRequest, UpdateIntegrationResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/integrations/{provider}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateIntegrationRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateIntegrationResponse
            {
                Error = new("Token invalido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantAcquirers)
                .ThenInclude(ma => ma.Acquirer)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new UpdateIntegrationResponse
            {
                Error = new("Organizacao nao encontrada.")
            }, 404, ct);
            return;
        }

        var activeMerchantAcquirer = merchant.MerchantAcquirers
            .Where(ma => ma.IsActive && ma.Acquirer.IsActive)
            .OrderByDescending(ma => ma.ActivatedAt ?? DateTime.MinValue)
            .ThenBy(ma => ma.Id)
            .FirstOrDefault();

        if (activeMerchantAcquirer == null)
        {
            await Send.ResponseAsync(new UpdateIntegrationResponse
            {
                Error = new("A organizacao nao possui uma adquirente ativa para configurar integracoes.")
            }, 400, ct);
            return;
        }

        if (!Enum.TryParse<MerchantIntegrationProvider>(req.Provider, true, out var provider))
        {
            await Send.ResponseAsync(new UpdateIntegrationResponse
            {
                Error = new("Provider de integracao invalido.")
            }, 400, ct);
            return;
        }

        MerchantIntegrationDefinition definition;
        try
        {
            definition = MerchantIntegrationCatalog.GetDefinition(provider);
        }
        catch (ArgumentOutOfRangeException)
        {
            await Send.ResponseAsync(new UpdateIntegrationResponse
            {
                Error = new("Provider de integracao invalido.")
            }, 400, ct);
            return;
        }

        var merchantIntegration = await dbContext.MerchantIntegrations
            .OrderBy(mi => mi.Id)
            .FirstOrDefaultAsync(mi => mi.MerchantId == merchant.Id && mi.Provider == provider, ct);

        if (merchantIntegration == null)
        {
            merchantIntegration = new MerchantIntegration
            {
                MerchantId = merchant.Id,
                Provider = provider,
                Type = definition.Type,
                Environment = environmentProvider.CurrentEnvironment,
                IsEnabled = false,
                ConfigValues = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                WaitingPaymentEnabled = true,
                PaidEnabled = true,
                RefusedEnabled = true,
                RefundedEnabled = true,
                ChargedbackEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            dbContext.MerchantIntegrations.Add(merchantIntegration);
        }

        if (req.Enabled.HasValue)
            merchantIntegration.IsEnabled = req.Enabled.Value;

        var currentConfigValues = merchantIntegration.ConfigValues ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var nextConfigValues = new Dictionary<string, string>(currentConfigValues, StringComparer.OrdinalIgnoreCase);

        if (req.ConfigValues != null)
        {
            foreach (var (key, value) in req.ConfigValues)
            {
                var normalizedValue = value?.Trim() ?? string.Empty;

                if (string.IsNullOrWhiteSpace(normalizedValue))
                    nextConfigValues.Remove(key);
                else
                    nextConfigValues[key] = normalizedValue;
            }
        }

        if (req.ApiToken != null)
        {
            var primaryFieldKey = definition.ConfigFields.FirstOrDefault()?.Key;
            if (!string.IsNullOrWhiteSpace(primaryFieldKey))
            {
                var sanitizedToken = req.ApiToken.Trim();

                if (string.IsNullOrWhiteSpace(sanitizedToken))
                    nextConfigValues.Remove(primaryFieldKey);
                else
                    nextConfigValues[primaryFieldKey] = sanitizedToken;
            }
        }

        var missingRequiredFields = definition.ConfigFields
            .Where(f => f.IsRequired)
            .Where(f => !nextConfigValues.TryGetValue(f.Key, out var value) || string.IsNullOrWhiteSpace(value))
            .Select(f => f.Label)
            .ToList();

        if (merchantIntegration.IsEnabled && req.Enabled != false && missingRequiredFields.Count > 0)
        {
            await Send.ResponseAsync(new UpdateIntegrationResponse
            {
                Error = new($"Preencha os campos obrigatorios antes de ativar a integracao: {string.Join(", ", missingRequiredFields)}.")
            }, 400, ct);
            return;
        }

        merchantIntegration.ConfigValues = nextConfigValues;

        if (req.WaitingPaymentEnabled.HasValue)
            merchantIntegration.WaitingPaymentEnabled = req.WaitingPaymentEnabled.Value;

        if (req.PaidEnabled.HasValue)
            merchantIntegration.PaidEnabled = req.PaidEnabled.Value;

        if (req.RefusedEnabled.HasValue)
            merchantIntegration.RefusedEnabled = req.RefusedEnabled.Value;

        if (req.RefundedEnabled.HasValue)
            merchantIntegration.RefundedEnabled = req.RefundedEnabled.Value;

        if (req.ChargedbackEnabled.HasValue)
            merchantIntegration.ChargedbackEnabled = req.ChargedbackEnabled.Value;

        merchantIntegration.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        var isConfigured = definition.ConfigFields
            .Where(f => f.IsRequired)
            .All(f => merchantIntegration.ConfigValues.TryGetValue(f.Key, out var value) && !string.IsNullOrWhiteSpace(value));

        await Send.OkAsync(new UpdateIntegrationResponse
        {
            Data = new UpdateIntegrationData
            {
                Provider = provider.ToString(),
                IsEnabled = merchantIntegration.IsEnabled,
                IsConfigured = isConfigured,
                ConfigValues = merchantIntegration.ConfigValues,
                ConfigFields = definition.ConfigFields.Select(field => new UpdateIntegrationConfigFieldData
                {
                    Key = field.Key,
                    Label = field.Label,
                    Type = field.Type,
                    IsRequired = field.IsRequired,
                    Placeholder = field.Placeholder,
                    Description = field.Description,
                }).ToList(),
                WaitingPaymentEnabled = merchantIntegration.WaitingPaymentEnabled,
                PaidEnabled = merchantIntegration.PaidEnabled,
                RefusedEnabled = merchantIntegration.RefusedEnabled,
                RefundedEnabled = merchantIntegration.RefundedEnabled,
                ChargedbackEnabled = merchantIntegration.ChargedbackEnabled,
            },
            Message = "Integracao atualizada com sucesso."
        }, ct);
    }
}
