namespace Swiftpay.Api.Core.Messages;

public record WithdrawalRequestedMessage(Guid WithdrawalId, Guid MerchantId, long Amount);
public record WithdrawalCompletedMessage(Guid WithdrawalId, Guid MerchantId, long Amount, long NetAmount);
public record WithdrawalFailedMessage(Guid WithdrawalId, Guid MerchantId, long Amount);
