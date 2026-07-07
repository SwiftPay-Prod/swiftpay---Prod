using swiftpay_api_core.Models.Database;

namespace swiftpay_api_core.Interfaces;

public interface IPushNotificationService
{
    Task SendPushNotificationAsync(Guid userId, string title, string body, Dictionary<string, string>? data = null);
    Task SendPushNotificationToMerchantUsersAsync(Guid merchantId, string title, string body, Dictionary<string, string>? data = null);
    Task<PushToken?> RegisterTokenAsync(Guid userId, string token, PushTokenPlatform platform, string? deviceName = null, string? deviceId = null);
    Task<bool> UnregisterTokenAsync(Guid userId, string token);
    Task<bool> UnregisterTokensByDeviceIdAsync(Guid userId, string deviceId);
    Task<bool> UnregisterAllTokensAsync(Guid userId);
    Task<List<PushToken>> GetUserTokensAsync(Guid userId);
}
