namespace swiftpay_api_core.Constants;

public static class SignalRGroups
{
    public static string User(Guid userId) => $"user:{userId}";
    public static string User(string userId) => $"user:{userId}";

    public static string Device(string deviceId) => $"device:{deviceId}";

    public static string Merchant(Guid merchantId) => $"merchant:{merchantId}";
    public static string Merchant(string merchantId) => $"merchant:{merchantId}";

    public static string MerchantDashboard(Guid merchantId) => $"merchant:{merchantId}:dashboard";
    public static string MerchantDashboard(string merchantId) => $"merchant:{merchantId}:dashboard";

    public static string AdminDashboard(string environment) => $"admin:dashboard:{environment}";

    public static string AcquirerDashboard(Guid acquirerId) => $"acquirer:{acquirerId}:dashboard";
    public static string AcquirerDashboard(string acquirerId) => $"acquirer:{acquirerId}:dashboard";
}
