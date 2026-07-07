using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Interfaces;

public interface IDashboardHubService
{
    Task NotifyMerchantDashboardUpdatedAsync(Guid merchantId);
    Task NotifyAdminDashboardUpdatedAsync(ApiEnvironment environment);
    Task NotifyAcquirerDashboardUpdatedAsync(Guid acquirerId);
}
