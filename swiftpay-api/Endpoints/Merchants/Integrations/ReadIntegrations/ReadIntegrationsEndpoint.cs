using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Integrations;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.Integrations.ReadIntegrations;

public sealed class ReadIntegrationsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadIntegrationsRequest, ReadIntegrationsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/integrations");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadIntegrationsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadIntegrationsResponse
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
            await Send.ResponseAsync(new ReadIntegrationsResponse
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

        var integrations = await dbContext.MerchantIntegrations
            .Where(mi => mi.MerchantId == merchant.Id && mi.Type == MerchantIntegrationType.Tracking)
            .OrderBy(mi => mi.Provider)
            .ThenBy(mi => mi.Id)
            .ToListAsync(ct);

        var integrationByProvider = integrations
            .GroupBy(i => i.Provider)
            .ToDictionary(g => g.Key, g => g.First());

        var items = MerchantIntegrationCatalog
            .GetTrackingProviders()
            .Select(provider => BuildItem(
                MerchantIntegrationCatalog.GetDefinition(provider),
                activeMerchantAcquirer != null,
                integrationByProvider.GetValueOrDefault(provider)))
            .ToList();

        await Send.OkAsync(new ReadIntegrationsResponse
        {
            Data = new ReadIntegrationsData
            {
                Type = MerchantIntegrationType.Tracking,
                Items = items
            }
        }, ct);
    }

    private static MerchantIntegrationListItem BuildItem(
        MerchantIntegrationDefinition definition,
        bool isAvailable,
        MerchantIntegration? entity)
    {
        var hasDbConfig = entity != null;
        var configValues = entity?.ConfigValues ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var isConfigured = definition.ConfigFields
            .Where(f => f.IsRequired)
            .All(f => configValues.TryGetValue(f.Key, out var value) && !string.IsNullOrWhiteSpace(value));

        return new MerchantIntegrationListItem
        {
            Provider = definition.Provider,
            Name = definition.Name,
            Description = definition.Description,
            WebsiteUrl = definition.WebsiteUrl,
            IsEnabled = hasDbConfig && entity!.IsEnabled,
            IsConfigured = isConfigured,
            ConfigValues = configValues,
            ConfigFields = definition.ConfigFields.Select(field => new MerchantIntegrationConfigFieldData
            {
                Key = field.Key,
                Label = field.Label,
                Type = field.Type,
                IsRequired = field.IsRequired,
                Placeholder = field.Placeholder,
                Description = field.Description,
            }).ToList(),
            IsAvailable = isAvailable,
            WaitingPaymentEnabled = hasDbConfig ? entity!.WaitingPaymentEnabled : true,
            PaidEnabled = hasDbConfig ? entity!.PaidEnabled : true,
            RefusedEnabled = hasDbConfig ? entity!.RefusedEnabled : true,
            RefundedEnabled = hasDbConfig ? entity!.RefundedEnabled : true,
            ChargedbackEnabled = hasDbConfig ? entity!.ChargedbackEnabled : true,
        };
    }
}
