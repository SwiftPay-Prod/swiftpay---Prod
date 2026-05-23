namespace Swiftpay.Api.Core.Messages;

public record PaymentPendingMessage(Guid PaymentId, Guid MerchantId, Guid? MerchantAcquirerId, long Amount, string Environment);
public record PaymentCompletedMessage(Guid PaymentId, Guid MerchantId, Guid? MerchantAcquirerId, string NewStatus, long Amount, long SettlementAmount, long AcquirerFee, string Environment);
public record PaymentCancelledMessage(Guid PaymentId, Guid MerchantId, long Amount, string Environment);
public record PaymentRefundedMessage(Guid PaymentId, Guid MerchantId, long RefundAmount, string Environment);
