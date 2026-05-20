using safefy_api_core.Models.Database;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Cashouts.Cancel;

public sealed class CancelCashoutRequest
{
    public Guid Id { get; set; }
}

public sealed class CancelCashoutResponse : BaseResponse<CancelCashoutData>;

public sealed class CancelCashoutData
{
    public Guid Id { get; set; }
    public PayoutStatus Status { get; set; }
}
