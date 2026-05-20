using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using CredentialUtils = safefy_api_core.Models.Acquirer.CredentialUtils;

namespace safefy_api.Endpoints.Admin.Acquirers.UpdateAcquirer;

public sealed class UpdateAcquirerEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdateAcquirerRequest, UpdateAcquirerResponse>
{
    public override void Configure()
    {
        Patch("acquirers/{acquirerId:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(UpdateAcquirerRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateAcquirerResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var userRole = EndpointUtils.GetUserRole(User);
        var isGod = userRole == "God";

        var acquirer = await dbContext.Acquirers
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == req.AcquirerId, ct);

        if (acquirer == null)
        {
            await Send.ResponseAsync(new UpdateAcquirerResponse
            {
                Error = new("Adquirente não encontrada.")
            }, 404, ct);
            return;
        }

        if (req.IsActive.HasValue)
            acquirer.IsActive = req.IsActive.Value;

        if (req.HideFromMerchantNominalSelection.HasValue)
            acquirer.HideFromMerchantNominalSelection = req.HideFromMerchantNominalSelection.Value;

        if (req.DisplayName != null)
            acquirer.DisplayName = string.IsNullOrEmpty(req.DisplayName) ? null : req.DisplayName;

        var previousNominal = acquirer.Nominal;
        if (req.Nominal != null)
            acquirer.Nominal = string.IsNullOrEmpty(req.Nominal) ? null : req.Nominal;

        if (req.LogoUrl != null)
            acquirer.LogoUrl = string.IsNullOrEmpty(req.LogoUrl) ? null : req.LogoUrl;

        if (req.OperationTypes != null && req.OperationTypes.Count > 0)
            acquirer.OperationTypes = req.OperationTypes;

        // Funcionalidades (o que a adquirente suporta tecnicamente)
        if (req.SupportsPix.HasValue)
        {
            acquirer.SupportsPix = req.SupportsPix.Value;
            if (!req.SupportsPix.Value)
                acquirer.PixEnabled = false;
        }

        if (req.SupportsBoleto.HasValue)
        {
            acquirer.SupportsBoleto = req.SupportsBoleto.Value;
            if (!req.SupportsBoleto.Value)
                acquirer.BoletoEnabled = false;
        }

        if (req.SupportsCreditCard.HasValue)
        {
            acquirer.SupportsCreditCard = req.SupportsCreditCard.Value;
            if (!req.SupportsCreditCard.Value)
                acquirer.CreditCardEnabled = false;
        }

        if (req.SupportsWithdrawal.HasValue)
            acquirer.SupportsWithdrawal = req.SupportsWithdrawal.Value;

        // Operações habilitadas - só pode habilitar se a adquirente suporta
        if (req.PixEnabled.HasValue)
        {
            if (req.PixEnabled.Value && !acquirer.SupportsPix)
            {
                await Send.ResponseAsync(new UpdateAcquirerResponse
                {
                    Error = new("Não é possível habilitar PIX pois a adquirente não suporta esta operação.")
                }, 400, ct);
                return;
            }
            acquirer.PixEnabled = req.PixEnabled.Value;
        }

        if (req.BoletoEnabled.HasValue)
        {
            if (req.BoletoEnabled.Value && !acquirer.SupportsBoleto)
            {
                await Send.ResponseAsync(new UpdateAcquirerResponse
                {
                    Error = new("Não é possível habilitar Boleto pois a adquirente não suporta esta operação.")
                }, 400, ct);
                return;
            }
            acquirer.BoletoEnabled = req.BoletoEnabled.Value;
        }

        if (req.CreditCardEnabled.HasValue)
        {
            if (req.CreditCardEnabled.Value && !acquirer.SupportsCreditCard)
            {
                await Send.ResponseAsync(new UpdateAcquirerResponse
                {
                    Error = new("Não é possível habilitar Cartão de Crédito pois a adquirente não suporta esta operação.")
                }, 400, ct);
                return;
            }
            acquirer.CreditCardEnabled = req.CreditCardEnabled.Value;
        }

        if (req.PixHasCompensation.HasValue)
        {
            acquirer.PixHasCompensation = req.PixHasCompensation.Value;
            if (!req.PixHasCompensation.Value)
                acquirer.PixCompensationDays = 0;
        }

        if (req.PixCompensationDays.HasValue)
            acquirer.PixCompensationDays = req.PixCompensationDays.Value;

        if (req.BoletoHasCompensation.HasValue)
        {
            acquirer.BoletoHasCompensation = req.BoletoHasCompensation.Value;
            if (!req.BoletoHasCompensation.Value)
                acquirer.BoletoCompensationDays = 0;
        }

        if (req.BoletoCompensationDays.HasValue)
            acquirer.BoletoCompensationDays = req.BoletoCompensationDays.Value;

        if (req.CreditCardHasCompensation.HasValue)
        {
            acquirer.CreditCardHasCompensation = req.CreditCardHasCompensation.Value;
            if (!req.CreditCardHasCompensation.Value)
                acquirer.CreditCardCompensationDays = 0;
        }

        if (req.CreditCardCompensationDays.HasValue)
            acquirer.CreditCardCompensationDays = req.CreditCardCompensationDays.Value;

        // ==========================================
        // CAMPOS DE INTEGRAÇÃO (APENAS GOD)
        // ==========================================
        if (isGod)
        {
            if (req.WebhookAuthMode.HasValue)
                acquirer.WebhookAuthMode = req.WebhookAuthMode.Value;

            if (req.WebhookToken != null)
                acquirer.WebhookToken = string.IsNullOrEmpty(req.WebhookToken) ? null : req.WebhookToken;

            if (req.WebhookAllowedIps != null)
                acquirer.WebhookAllowedIps = string.IsNullOrEmpty(req.WebhookAllowedIps) ? null : req.WebhookAllowedIps;

            if (req.ApiBaseUrlProduction != null)
                acquirer.ApiBaseUrlProduction = string.IsNullOrEmpty(req.ApiBaseUrlProduction) ? null : req.ApiBaseUrlProduction;

            if (req.ApiBaseUrlSandbox != null)
                acquirer.ApiBaseUrlSandbox = string.IsNullOrEmpty(req.ApiBaseUrlSandbox) ? null : req.ApiBaseUrlSandbox;
        }
        
        // New Dynamic Credentials System (outside of isGod but still restricted to God through request validation)
        Dictionary<string, string>? trimmedCredentials = null;
        Dictionary<string, string>? trimmedCredentialsSandbox = null;
        
        if (isGod && req.DefaultCredentials != null)
        {
            // Trim values and filter out empty ones
            trimmedCredentials = req.DefaultCredentials
                .Where(kvp => !string.IsNullOrWhiteSpace(kvp.Value))
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Trim());
                
            acquirer.DefaultCredentials = trimmedCredentials.Count == 0 
                ? null 
                : CredentialUtils.SerializeCredentials(trimmedCredentials);
        }
        
        if (isGod && req.DefaultCredentialsSandbox != null)
        {
            // Trim values and filter out empty ones
            trimmedCredentialsSandbox = req.DefaultCredentialsSandbox
                .Where(kvp => !string.IsNullOrWhiteSpace(kvp.Value))
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Trim());
                
            acquirer.DefaultCredentialsSandbox = trimmedCredentialsSandbox.Count == 0 
                ? null 
                : CredentialUtils.SerializeCredentials(trimmedCredentialsSandbox);
        }

        if (req.AccessAccounts != null)
        {
            acquirer.AccessAccounts = req.AccessAccounts
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

        // PIX In Fees
        if (req.PixInFeeMode.HasValue)
            acquirer.PixInFeeMode = req.PixInFeeMode.Value;

        if (req.PixInFeeFixed.HasValue)
            acquirer.PixInFeeFixed = req.PixInFeeFixed.Value;

        if (req.PixInFeePercentage.HasValue)
            acquirer.PixInFeePercentage = req.PixInFeePercentage.Value;

        // BOLETO In Fees
        if (req.BoletoInFeeMode.HasValue)
            acquirer.BoletoInFeeMode = req.BoletoInFeeMode.Value;

        if (req.BoletoInFeeFixed.HasValue)
            acquirer.BoletoInFeeFixed = req.BoletoInFeeFixed.Value;

        if (req.BoletoInFeePercentage.HasValue)
            acquirer.BoletoInFeePercentage = req.BoletoInFeePercentage.Value;

        // CREDIT CARD In Fees
        if (req.CreditCardInFeeMode.HasValue)
            acquirer.CreditCardInFeeMode = req.CreditCardInFeeMode.Value;

        if (req.CreditCardInFeeFixed.HasValue)
            acquirer.CreditCardInFeeFixed = req.CreditCardInFeeFixed.Value;

        if (req.CreditCardInFeePercentage.HasValue)
            acquirer.CreditCardInFeePercentage = req.CreditCardInFeePercentage.Value;

        // Payout Fees
        if (req.PayoutFeeMode.HasValue)
            acquirer.PayoutFeeMode = req.PayoutFeeMode.Value;

        if (req.PayoutFeeFixed.HasValue)
            acquirer.PayoutFeeFixed = req.PayoutFeeFixed.Value;

        if (req.PayoutFeePercentage.HasValue)
            acquirer.PayoutFeePercentage = req.PayoutFeePercentage.Value;

        if (req.PayoutFeeHandling.HasValue)
            acquirer.PayoutFeeHandling = req.PayoutFeeHandling.Value;
        
        // Fee Split Handling
        if (req.PixFeeSplitHandling.HasValue)
            acquirer.PixFeeSplitHandling = req.PixFeeSplitHandling.Value;
        
        if (req.BoletoFeeSplitHandling.HasValue)
            acquirer.BoletoFeeSplitHandling = req.BoletoFeeSplitHandling.Value;
        
        if (req.CreditCardFeeSplitHandling.HasValue)
            acquirer.CreditCardFeeSplitHandling = req.CreditCardFeeSplitHandling.Value;

        // Transaction Limits - PIX
        if (req.MinPixAmount.HasValue)
            acquirer.MinPixAmount = req.MinPixAmount.Value;

        if (req.MaxPixAmount.HasValue)
            acquirer.MaxPixAmount = req.MaxPixAmount.Value;

        // Transaction Limits - Boleto
        if (req.MinBoletoAmount.HasValue)
            acquirer.MinBoletoAmount = req.MinBoletoAmount.Value;

        if (req.MaxBoletoAmount.HasValue)
            acquirer.MaxBoletoAmount = req.MaxBoletoAmount.Value;

        // Transaction Limits - Credit Card
        if (req.MinCreditCardAmount.HasValue)
            acquirer.MinCreditCardAmount = req.MinCreditCardAmount.Value;

        if (req.MaxCreditCardAmount.HasValue)
            acquirer.MaxCreditCardAmount = req.MaxCreditCardAmount.Value;

        // Transaction Limits - Payout
        if (req.MinPayoutAmount.HasValue)
            acquirer.MinPayoutAmount = req.MinPayoutAmount.Value;

        if (req.MaxPayoutAmount.HasValue)
            acquirer.MaxPayoutAmount = req.MaxPayoutAmount.Value;

        // Sync to MerchantAcquirers if requested
        if (req.SyncToMerchantAcquirers)
        {
            var merchantAcquirers = await dbContext.MerchantAcquirers
                .Where(ma => ma.AcquirerId == req.AcquirerId)
                .ToListAsync(ct);

            foreach (var ma in merchantAcquirers)
            {
                // Sync credentials (new system) - use already trimmed credentials
                if (trimmedCredentials != null)
                {
                    ma.Credentials = trimmedCredentials.Count == 0 
                        ? null 
                        : CredentialUtils.SerializeCredentials(trimmedCredentials);
                }

                // Sync fees
                if (req.PixInFeeMode.HasValue)
                    ma.PixInFeeMode = req.PixInFeeMode.Value;

                if (req.PixInFeeFixed.HasValue)
                    ma.PixInFeeFixed = req.PixInFeeFixed.Value;

                if (req.PixInFeePercentage.HasValue)
                    ma.PixInFeePercentage = req.PixInFeePercentage.Value;

                if (req.BoletoInFeeMode.HasValue)
                    ma.BoletoInFeeMode = req.BoletoInFeeMode.Value;

                if (req.BoletoInFeeFixed.HasValue)
                    ma.BoletoInFeeFixed = req.BoletoInFeeFixed.Value;

                if (req.BoletoInFeePercentage.HasValue)
                    ma.BoletoInFeePercentage = req.BoletoInFeePercentage.Value;

                if (req.CreditCardInFeeMode.HasValue)
                    ma.CreditCardInFeeMode = req.CreditCardInFeeMode.Value;

                if (req.CreditCardInFeeFixed.HasValue)
                    ma.CreditCardInFeeFixed = req.CreditCardInFeeFixed.Value;

                if (req.CreditCardInFeePercentage.HasValue)
                    ma.CreditCardInFeePercentage = req.CreditCardInFeePercentage.Value;

                if (req.PayoutFeeMode.HasValue)
                    ma.PayoutFeeMode = req.PayoutFeeMode.Value;

                if (req.PayoutFeeFixed.HasValue)
                    ma.PayoutFeeFixed = req.PayoutFeeFixed.Value;

                if (req.PayoutFeePercentage.HasValue)
                    ma.PayoutFeePercentage = req.PayoutFeePercentage.Value;
                
                // Sync fee split handling
                if (req.PixFeeSplitHandling.HasValue)
                    ma.PixFeeSplitHandling = req.PixFeeSplitHandling.Value;
                
                if (req.BoletoFeeSplitHandling.HasValue)
                    ma.BoletoFeeSplitHandling = req.BoletoFeeSplitHandling.Value;
                
                if (req.CreditCardFeeSplitHandling.HasValue)
                    ma.CreditCardFeeSplitHandling = req.CreditCardFeeSplitHandling.Value;

                // Sync enabled operations (reset to null = inherit from acquirer)
                if (req.PixEnabled.HasValue)
                    ma.PixEnabled = null;

                if (req.BoletoEnabled.HasValue)
                    ma.BoletoEnabled = null;

                if (req.CreditCardEnabled.HasValue)
                    ma.CreditCardEnabled = null;
            }
        }

        var newNominal = req.Nominal != null ? (string.IsNullOrEmpty(req.Nominal) ? null : req.Nominal) : null;
        if (req.Nominal != null &&
            newNominal != null &&
            !string.Equals(previousNominal, newNominal, StringComparison.OrdinalIgnoreCase))
        {
            var userName = userId.HasValue
                ? await dbContext.Users
                    .Where(u => u.Id == userId.Value)
                    .OrderBy(u => u.Id)
                    .Select(u => u.Name)
                    .FirstOrDefaultAsync(ct)
                : null;

            dbContext.AcquirerPixNominalHistories.Add(new AcquirerPixNominalHistory
            {
                AcquirerId = acquirer.Id,
                PreviousNominal = previousNominal,
                NewNominal = newNominal,
                Source = AcquirerNominalChangeSource.Manual,
                ChangedByUserId = userId,
                ChangedByUserName = userName,
            });
        }

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateAcquirerResponse
        {
            Data = new UpdateAcquirerData
            {
                Id = acquirer.Id,
                Name = acquirer.Name,
                Code = acquirer.Code,
                DisplayName = acquirer.DisplayName,
                IsActive = acquirer.IsActive,
                HideFromMerchantNominalSelection = acquirer.HideFromMerchantNominalSelection,
                OperationTypes = acquirer.OperationTypes.Select(t => t.ToString()).ToList(),
                SupportsPix = acquirer.SupportsPix,
                SupportsBoleto = acquirer.SupportsBoleto,
                SupportsCreditCard = acquirer.SupportsCreditCard,
                SupportsWithdrawal = acquirer.SupportsWithdrawal,
                PixEnabled = acquirer.PixEnabled,
                BoletoEnabled = acquirer.BoletoEnabled,
                CreditCardEnabled = acquirer.CreditCardEnabled,
                PixHasCompensation = acquirer.PixHasCompensation,
                PixCompensationDays = acquirer.PixCompensationDays,
                BoletoHasCompensation = acquirer.BoletoHasCompensation,
                BoletoCompensationDays = acquirer.BoletoCompensationDays,
                CreditCardHasCompensation = acquirer.CreditCardHasCompensation,
                CreditCardCompensationDays = acquirer.CreditCardCompensationDays,
                WebhookAuthMode = acquirer.WebhookAuthMode.ToString(),
                HasWebhookToken = !string.IsNullOrEmpty(acquirer.WebhookToken),
                HasWebhookAllowedIps = !string.IsNullOrEmpty(acquirer.WebhookAllowedIps),
                AccessAccounts = acquirer.AccessAccounts
            },
            Message = "Adquirente atualizada com sucesso."
        }, ct);
    }
}
