using System.Text.Json;
using System.Text.Json.Serialization;
using safefy_api_core.Models.Database;

namespace safefy_api_core.Utils;

public static class PlatformLinkResolver
{
    private static readonly JsonSerializerOptions DomainJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public static string BuildPaymentLinkUrl(
        PlatformSettings settings,
        string token,
        PaymentMethod? method = null,
        IEnumerable<PaymentMethod>? enabledMethods = null,
        MerchantSettings? merchantSettings = null)
    {
        var baseUrl = ResolvePaymentLinkBaseUrl(settings, method, enabledMethods, merchantSettings);
        return !string.IsNullOrWhiteSpace(baseUrl)
            ? $"{baseUrl.TrimEnd('/')}/{token}"
            : token;
    }

    public static string? ResolvePaymentLinkBaseUrl(
        PlatformSettings settings,
        PaymentMethod? method = null,
        IEnumerable<PaymentMethod>? enabledMethods = null,
        MerchantSettings? merchantSettings = null)
    {
        return ResolvePaymentLinkDomain(settings, merchantSettings, method, enabledMethods).BaseUrl;
    }

    public static PaymentLinkDomainResolved ResolvePaymentLinkDomain(
        PlatformSettings settings,
        MerchantSettings? merchantSettings = null,
        PaymentMethod? method = null,
        IEnumerable<PaymentMethod>? enabledMethods = null)
    {
        var resolvedMethod = method ?? ResolveMethodFromEnabledMethods(enabledMethods);

        var configuredOptions = ParsePlatformDomainOptions(settings.PaymentLinkDomainOptionsJson)
            .FirstOrDefault(item => item.Method == resolvedMethod)?
            .Options
            .Where(option => !string.IsNullOrWhiteSpace(option.BaseUrl))
            .ToList() ?? [];

        PaymentLinkDomainOption? selectedOption = null;
        if (configuredOptions.Count > 0)
        {
            var selectedOptionId = ParseMerchantSelection(merchantSettings?.PaymentLinkDomainSelectionJson)
                ?.ResolveOptionId(resolvedMethod);

            if (!string.IsNullOrWhiteSpace(selectedOptionId))
            {
                selectedOption = configuredOptions.FirstOrDefault(option =>
                    string.Equals(option.Id, selectedOptionId, StringComparison.OrdinalIgnoreCase));
            }

            selectedOption ??= configuredOptions.FirstOrDefault(option => option.IsDefault);
            selectedOption ??= configuredOptions.First();
        }

        var legacyBaseUrl = resolvedMethod switch
        {
            PaymentMethod.Boleto => settings.BoletoPaymentLinkBaseUrl,
            PaymentMethod.CreditCard => settings.CreditCardPaymentLinkBaseUrl,
            _ => settings.PixPaymentLinkBaseUrl
        };

        var resolvedBaseUrl = NormalizeBaseUrl(selectedOption?.BaseUrl)
            ?? NormalizeBaseUrl(legacyBaseUrl);

        return new PaymentLinkDomainResolved
        {
            BaseUrl = resolvedBaseUrl,
            Option = selectedOption
        };
    }

    public static PaymentLinkDomainOption? ResolvePaymentLinkBranding(
        PlatformSettings settings,
        MerchantSettings? merchantSettings = null,
        PaymentMethod? method = null,
        IEnumerable<PaymentMethod>? enabledMethods = null)
    {
        return ResolvePaymentLinkDomain(settings, merchantSettings, method, enabledMethods).Option;
    }

    public static string? BuildBoletoProxyUrl(PlatformSettings settings, Guid paymentId)
    {
        if (string.IsNullOrWhiteSpace(settings.BoletoProxyBaseUrl))
        {
            return null;
        }

        return $"{settings.BoletoProxyBaseUrl.TrimEnd('/')}/{paymentId}";
    }

    public static string? BuildTransactionVisualizationUrl(
        PlatformSettings settings,
        Guid paymentId,
        PaymentMethod? method = null,
        IEnumerable<PaymentMethod>? enabledMethods = null,
        MerchantSettings? merchantSettings = null)
    {
        var baseUrl = ResolvePaymentLinkBaseUrl(settings, method, enabledMethods, merchantSettings);
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return null;
        }

        return $"{baseUrl.TrimEnd('/')}/{paymentId}";
    }

    private static List<PaymentLinkDomainMethodOptions> ParsePlatformDomainOptions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<PaymentLinkDomainMethodOptions>>(json, DomainJsonOptions) ?? [];
        }
        catch
        {
            return [];
        }
    }

    private static MerchantPaymentLinkDomainSelection? ParseMerchantSelection(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<MerchantPaymentLinkDomainSelection>(json, DomainJsonOptions);
        }
        catch
        {
            return null;
        }
    }

    private static string? NormalizeBaseUrl(string? baseUrl)
    {
        return string.IsNullOrWhiteSpace(baseUrl)
            ? null
            : baseUrl.TrimEnd('/');
    }

    private static PaymentMethod ResolveMethodFromEnabledMethods(IEnumerable<PaymentMethod>? enabledMethods)
    {
        var methods = enabledMethods?.ToList() ?? [];
        if (methods.Count == 0)
        {
            return PaymentMethod.Pix;
        }

        return methods[0];
    }
}
