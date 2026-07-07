using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Endpoints.PaymentLinks.Status;

public sealed class GetPaymentLinkPaymentStatusRequest
{
    public string Token { get; set; } = string.Empty;
    public Guid PaymentId { get; set; }
}

public sealed class GetPaymentLinkPaymentStatusResponse : BaseResponse<GetPaymentLinkPaymentStatusData>;

public sealed class GetPaymentLinkPaymentStatusData
{
    public PaymentStatus Status { get; set; }
    public DateTime? CompletedAt { get; set; }
}
