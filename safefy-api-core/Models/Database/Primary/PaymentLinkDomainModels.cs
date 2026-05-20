using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

public sealed class PaymentLinkDomainMethodOptions
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public PaymentMethod Method { get; set; }

    public List<PaymentLinkDomainOption> Options { get; set; } = [];
}

public sealed class PaymentLinkDomainOption
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public bool ShowSafefyBranding { get; set; } = true;
}

public sealed class MerchantPaymentLinkDomainSelection
{
    public string? PixOptionId { get; set; }
    public string? BoletoOptionId { get; set; }
    public string? CreditCardOptionId { get; set; }

    public string? ResolveOptionId(PaymentMethod method)
    {
        return method switch
        {
            PaymentMethod.Boleto => BoletoOptionId,
            PaymentMethod.CreditCard => CreditCardOptionId,
            _ => PixOptionId
        };
    }
}

public sealed class PaymentLinkDomainResolved
{
    public string? BaseUrl { get; init; }
    public PaymentLinkDomainOption? Option { get; init; }
}