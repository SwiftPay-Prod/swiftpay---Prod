using safefy_api_core.Models.Enum;

namespace safefy_api_core.Interfaces;

public interface IDashboardHubService
{
    Task NotifyMerchantDashboardUpdatedAsync(Guid merchantId);
    Task NotifyAdminDashboardUpdatedAsync(ApiEnvironment environment);
    Task NotifyAcquirerDashboardUpdatedAsync(Guid acquirerId);
}
