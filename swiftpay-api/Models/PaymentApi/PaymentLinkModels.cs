using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Models.PaymentApi;

public sealed class CreatePaymentLinkApiInput
{
    public Guid MerchantId { get; set; }
    public Guid UserId { get; set; }
    public ApiEnvironment Environment { get; set; }
    public List<PaymentMethod> EnabledMethods { get; set; } = [];
    public long Amount { get; set; }
    public CurrencyType Currency { get; set; } = CurrencyType.BRL;
    public string? Description { get; set; }
    public string? ExternalId { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CallbackUrl { get; set; }
    public string? Metadata { get; set; }
    public int? PixExpirationMinutes { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerDocument { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CardNumber { get; set; }
    public string? CardHolderName { get; set; }
    public int? CardExpirationMonth { get; set; }
    public int? CardExpirationYear { get; set; }
    public int? Installments { get; set; }
    public string? CardCvv { get; set; }
    public DateTime? BoletoDueDate { get; set; }
    public string? BoletoInstructions { get; set; }
    public string? RedirectUrl { get; set; }
    public string? RequiredBuyerFields { get; set; }
    public bool ShowFees { get; set; }
    public bool PassFeeToCustomer { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? LogoUrl { get; set; }
    public string? ColorMode { get; set; }
    public string? ThemeMode { get; set; }
    public string? ProductName { get; set; }
    public string? ProductImageUrl { get; set; }
}

public sealed class CreatePaymentLinkApiResult
{
    public bool Success { get; set; }
    public Guid? PaymentLinkId { get; set; }
    public string? PaymentLinkUrl { get; set; }
    public List<PaymentMethod> EnabledMethods { get; set; } = [];
    public long? Amount { get; set; }
    public CurrencyType? Currency { get; set; }
    public string? Description { get; set; }
    public ApiEnvironment? Environment { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public Guid? CustomerId { get; set; }
    public string? RedirectUrl { get; set; }
    public string? RequiredBuyerFields { get; set; }
    public bool ShowFees { get; set; }
    public bool PassFeeToCustomer { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? LogoUrl { get; set; }
    public string? ColorMode { get; set; }
    public string? ThemeMode { get; set; }
    public string? ProductName { get; set; }
    public string? ProductImageUrl { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

internal sealed class PaymentApiCreatePaymentLinkResponse
{
    public bool Success { get; set; }
    public Guid? PaymentLinkId { get; set; }
    public string? PaymentLinkUrl { get; set; }
    public List<string> EnabledMethods { get; set; } = [];
    public long? Amount { get; set; }
    public string? Currency { get; set; }
    public string? Description { get; set; }
    public string? Environment { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public Guid? CustomerId { get; set; }
    public string? RedirectUrl { get; set; }
    public string? RequiredBuyerFields { get; set; }
    public bool ShowFees { get; set; }
    public bool PassFeeToCustomer { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? LogoUrl { get; set; }
    public string? ColorMode { get; set; }
    public string? ThemeMode { get; set; }
    public string? ProductName { get; set; }
    public string? ProductImageUrl { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}
