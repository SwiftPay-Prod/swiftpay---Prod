using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Endpoints.Cashouts.Get;

public sealed class GetCashoutRequest
{
    public Guid Id { get; set; }
}

public sealed class GetCashoutResponse : BaseResponse<GetCashoutData>;

public sealed class GetCashoutData
{
    public Guid Id { get; set; }

    public string? ExternalId { get; set; }

    public long Amount { get; set; }

    public long Fee { get; set; }

    public long NetAmount { get; set; }

    public string Currency { get; set; } = "BRL";

    public PayoutStatus Status { get; set; }

    public ApiEnvironment Environment { get; set; }

    public GetCashoutPixData Pix { get; set; } = new();

    public DateTime RequestedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? FailureReason { get; set; }

    public DateTime CreatedAt { get; set; }
}

public sealed class GetCashoutPixData
{
    public string? PixKeyType { get; set; }

    public string? PixKey { get; set; }

    public string? EndToEndId { get; set; }
}
