namespace Swiftpay.Api.Core.Messages;

public record UpdateMerchantDashboardMessage(Guid MerchantId);
public record UpdateAdminDashboardMessage;
public record SendWebhookMessage(Guid PaymentId, string EventType);
