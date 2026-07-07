using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_payment.Interfaces.Sandbox;

public interface ISandboxService
{
    Task SimulateAsync(Guid merchantId, Guid payoutId, ApiEnvironment environment, SimulateCashoutAction action, CancellationToken ct);
}

public enum SimulateCashoutAction
{
    Complete,
    Fail,
    Reject
}