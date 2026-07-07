using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Endpoints.Transactions.Create;

namespace swiftpay_api_payment.Endpoints.PaymentLinks.Get;

public sealed class GetPaymentLinkRequest
{
    public string Token { get; set; } = string.Empty;
}

public sealed class GetPaymentLinkResponse : BaseResponse<PaymentLinkData>;

public sealed class PaymentLinkData
{
    public Guid Id { get; set; }
    public Guid PaymentLinkId { get; set; }
    public Guid? PaymentId { get; set; }
    public List<PaymentMethod> EnabledMethods { get; set; } = [];
    public PaymentMethod? Method { get; set; }
    public long Amount { get; set; }
    public string Currency { get; set; } = "BRL";
    public PaymentStatus Status { get; set; }
    public string? Description { get; set; }
    public ApiEnvironment Environment { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsPaymentStarted { get; set; }
    public bool IsUnlimitedLink { get; set; }
    public string? RedirectUrl { get; set; }
    public List<string> RequiredBuyerFields { get; set; } = [];
    public bool ShowFees { get; set; }
    public Dictionary<string, long> FeeAmounts { get; set; } = [];
    public bool PassFeeToCustomer { get; set; }
    public bool ShowSwiftPayBranding { get; set; }
    public string? ThemeMode { get; set; }
    public string? LogoUrl { get; set; }
    public string? ProductName { get; set; }
    public string? ProductImageUrl { get; set; }
    public PixTransactionData? Pix { get; set; }
    public BoletoTransactionData? Boleto { get; set; }
}
