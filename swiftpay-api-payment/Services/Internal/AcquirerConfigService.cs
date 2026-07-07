using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Acquirer;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Internal;

namespace swiftpay_api_payment.Services.Internal;

public class AcquirerConfigService(
    PrimaryDbContext dbContext,
    IOptions<PlatformSettingsOptions> platformSettings
) : IAcquirerConfigService
{
    private readonly string _platformBaseUrl = platformSettings.Value.BaseUrl;
    public async Task<AcquirerConfigResult?> GetDefaultAcquirerConfigAsync(Guid merchantId, ApiEnvironment environment)
    {
        var merchantAcquirer = await dbContext.MerchantAcquirers
            .AsNoTracking()
            .Include(ma => ma.Acquirer)
            .Where(ma => ma.MerchantId == merchantId && ma.IsActive && ma.Acquirer!.IsActive)
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync();

        if (merchantAcquirer == null)
            return null;

        return BuildAcquirerConfig(merchantAcquirer, environment, _platformBaseUrl);
    }

    public async Task<AcquirerConfigResult?> GetAcquirerConfigAsync(Guid merchantId, Guid acquirerId, ApiEnvironment environment)
    {
        var merchantAcquirer = await dbContext.MerchantAcquirers
            .AsNoTracking()
            .Include(ma => ma.Acquirer)
            .Where(ma => ma.MerchantId == merchantId
                && ma.AcquirerId == acquirerId
                && ma.Acquirer!.IsActive)
            .OrderByDescending(ma => ma.IsActive)
            .ThenByDescending(ma => ma.ActivatedAt ?? DateTime.MinValue)
            .ThenBy(ma => ma.Id)
            .FirstOrDefaultAsync();

        if (merchantAcquirer == null)
            return null;

        return BuildAcquirerConfig(merchantAcquirer, environment, _platformBaseUrl);
    }

    public async Task<AcquirerConfigResult?> GetAcquirerConfigByMerchantAcquirerIdAsync(
        Guid merchantId,
        Guid merchantAcquirerId,
        ApiEnvironment environment)
    {
        var merchantAcquirer = await dbContext.MerchantAcquirers
            .AsNoTracking()
            .Include(ma => ma.Acquirer)
            .FirstOrDefaultAsync(ma => ma.MerchantId == merchantId
                && ma.Id == merchantAcquirerId
                && ma.Acquirer!.IsActive);

        if (merchantAcquirer == null)
            return null;

        return BuildAcquirerConfig(merchantAcquirer, environment, _platformBaseUrl);
    }

    private static AcquirerConfigResult BuildAcquirerConfig(MerchantAcquirer merchantAcquirer, ApiEnvironment environment, string platformBaseUrl)
    {
        var acquirer = merchantAcquirer.Acquirer!;
        var isSandbox = environment == ApiEnvironment.Sandbox;
        
        var baseUrl = isSandbox
            ? acquirer.ApiBaseUrlSandbox ?? acquirer.ApiBaseUrl
            : acquirer.ApiBaseUrlProduction ?? acquirer.ApiBaseUrl;

        // Build credentials using the new generic system
        var defaultCredentials = isSandbox
            ? CredentialUtils.ParseCredentials(acquirer.DefaultCredentialsSandbox) ?? CredentialUtils.ParseCredentials(acquirer.DefaultCredentials)
            : CredentialUtils.ParseCredentials(acquirer.DefaultCredentials);

        var merchantCredentials = CredentialUtils.ParseCredentials(merchantAcquirer.Credentials);
        var credentials = CredentialUtils.MergeCredentials(defaultCredentials, merchantCredentials);

        var additionalSettings = ParseAdditionalSettings(merchantAcquirer.AdditionalSettings);

        var config = new AcquirerConfig
        {
            AcquirerId = acquirer.Id,
            AcquirerType = acquirer.Type,
            MerchantId = merchantAcquirer.MerchantId,
            ApiBaseUrl = baseUrl ?? "",
            Credentials = credentials,
            WebhookToken = acquirer.WebhookToken,
            PlatformBaseUrl = platformBaseUrl,
            IsSandbox = isSandbox,
            IsSimulated = isSandbox,
            AdditionalSettings = additionalSettings
        };

        return new AcquirerConfigResult
        {
            AcquirerType = acquirer.Type,
            Config = config,
            MerchantAcquirerId = merchantAcquirer.Id,
            SupportsPix = acquirer.SupportsPix,
            SupportsBoleto = acquirer.SupportsBoleto,
            SupportsCreditCard = acquirer.SupportsCreditCard,
            SupportsWithdrawal = acquirer.SupportsWithdrawal,
            SupportsRefund = acquirer.SupportsRefund,
            MinPixAmount = acquirer.MinPixAmount,
            MaxPixAmount = acquirer.MaxPixAmount,
            MinBoletoAmount = acquirer.MinBoletoAmount,
            MaxBoletoAmount = acquirer.MaxBoletoAmount,
            MinCreditCardAmount = acquirer.MinCreditCardAmount,
            MaxCreditCardAmount = acquirer.MaxCreditCardAmount,
            MinPayoutAmount = acquirer.MinPayoutAmount,
            MaxPayoutAmount = acquirer.MaxPayoutAmount,
        };
    }

    private static Dictionary<string, string>? ParseAdditionalSettings(string? json)
    {
        if (string.IsNullOrEmpty(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(json);
        }
        catch
        {
            return null;
        }
    }

    public async Task<AcquirerConfigResult?> GetPlatformAcquirerConfigAsync(Guid acquirerId, ApiEnvironment environment)
    {
        var acquirer = await dbContext.Acquirers
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == acquirerId && a.IsActive);

        if (acquirer == null)
            return null;

        var isSandbox = environment == ApiEnvironment.Sandbox;

        var baseUrl = isSandbox
            ? acquirer.ApiBaseUrlSandbox ?? acquirer.ApiBaseUrl
            : acquirer.ApiBaseUrlProduction ?? acquirer.ApiBaseUrl;

        // Build credentials using the new generic system
        var credentials = isSandbox
            ? CredentialUtils.ParseCredentials(acquirer.DefaultCredentialsSandbox) ?? CredentialUtils.ParseCredentials(acquirer.DefaultCredentials) ?? new Dictionary<string, string>()
            : CredentialUtils.ParseCredentials(acquirer.DefaultCredentials) ?? new Dictionary<string, string>();

        var config = new AcquirerConfig
        {
            AcquirerId = acquirer.Id,
            AcquirerType = acquirer.Type,
            ApiBaseUrl = baseUrl ?? "",
            Credentials = credentials,
            WebhookToken = acquirer.WebhookToken,
            PlatformBaseUrl = _platformBaseUrl,
            IsSandbox = isSandbox,
            IsSimulated = isSandbox
        };

        return new AcquirerConfigResult
        {
            AcquirerType = acquirer.Type,
            Config = config,
            MerchantAcquirerId = Guid.Empty,
            SupportsPix = acquirer.SupportsPix,
            SupportsBoleto = acquirer.SupportsBoleto,
            SupportsCreditCard = acquirer.SupportsCreditCard,
            SupportsWithdrawal = acquirer.SupportsWithdrawal,
            SupportsRefund = acquirer.SupportsRefund,
            MinPixAmount = acquirer.MinPixAmount,
            MaxPixAmount = acquirer.MaxPixAmount,
            MinBoletoAmount = acquirer.MinBoletoAmount,
            MaxBoletoAmount = acquirer.MaxBoletoAmount,
            MinCreditCardAmount = acquirer.MinCreditCardAmount,
            MaxCreditCardAmount = acquirer.MaxCreditCardAmount,
            MinPayoutAmount = acquirer.MinPayoutAmount,
            MaxPayoutAmount = acquirer.MaxPayoutAmount,
        };
    }
}
