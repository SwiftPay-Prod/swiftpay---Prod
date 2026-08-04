using System.Text.Json;
using FluentAssertions;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.ActivePayments.Models.Webhook;
using swiftpay_api_payment.Clients.ActivePayments.Models.Withdrawals;
using swiftpay_api_payment.Clients.Bankizi.Models.Webhook;
using swiftpay_api_payment.Clients.Coldfy.Models.Webhook;
using swiftpay_api_payment.Clients.Coldfy.Models.Withdrawals;
using swiftpay_api_payment.Clients.IHubBanking.Models.Transactions;
using swiftpay_api_payment.Clients.IHubBanking.Models.Withdrawals;
using swiftpay_api_payment.Clients.IHubBanking.Models.Webhook;
using swiftpay_api_payment.Clients.HeartPay.Models.Webhook;
using swiftpay_api_payment.Clients.HunterPay.Models.Transactions;
using swiftpay_api_payment.Clients.HunterPay.Models.Webhook;
using swiftpay_api_payment.Clients.Pluggou.Models.Webhook;
using swiftpay_api_payment.Clients.Rapdyn.Models.Webhook;
using swiftpay_api_payment.Clients.Bankizi.Models.Withdrawals;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Tests.Integration;

public sealed class AcquirerStatusMappingTests
{
    [Theory]
    [InlineData(ActivePaymentsWebhookEventType.WithdrawalFailed, PayoutStatus.Failed)]
    [InlineData(ActivePaymentsWebhookEventType.WithdrawalRejected, PayoutStatus.Rejected)]
    [InlineData(ActivePaymentsWebhookEventType.WithdrawalDone, PayoutStatus.Completed)]
    [InlineData(ActivePaymentsWebhookEventType.WithdrawalApproved, PayoutStatus.Processing)]
    public void ActivePayments_EventMapping_ShouldMapPayoutStatus(
        ActivePaymentsWebhookEventType eventType,
        PayoutStatus expected)
    {
        var actual = ActivePaymentsStatusConverter.ToPayoutStatus(eventType);
        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(ActivePaymentsWithdrawalStatus.Failed, PayoutStatus.Failed)]
    [InlineData(ActivePaymentsWithdrawalStatus.Rejected, PayoutStatus.Rejected)]
    [InlineData(ActivePaymentsWithdrawalStatus.Done, PayoutStatus.Completed)]
    [InlineData(ActivePaymentsWithdrawalStatus.Pending, PayoutStatus.Processing)]
    public void ActivePayments_PayloadStatus_ShouldMapPayoutStatus(
        ActivePaymentsWithdrawalStatus status,
        PayoutStatus expected)
    {
        var actual = ActivePaymentsStatusConverter.ToPayoutStatus(status);
        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(ColdfyWebhookEventType.WithdrawalFailed, ColdfyWithdrawalStatus.Pending, PayoutStatus.Failed)]
    [InlineData(ColdfyWebhookEventType.Unknown, ColdfyWithdrawalStatus.Failed, PayoutStatus.Failed)]
    [InlineData(ColdfyWebhookEventType.Unknown, ColdfyWithdrawalStatus.Canceled, PayoutStatus.Failed)]
    [InlineData(ColdfyWebhookEventType.WithdrawalCompleted, ColdfyWithdrawalStatus.Failed, PayoutStatus.Completed)]
    public void Coldfy_ShouldMapPayoutStatus(
        ColdfyWebhookEventType eventType,
        ColdfyWithdrawalStatus withdrawalStatus,
        PayoutStatus expected)
    {
        var actual = ColdfyStatusConverter.ToPayoutStatus(eventType, withdrawalStatus);
        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(RapdynWebhookStatus.Failed, PayoutStatus.Failed)]
    [InlineData(RapdynWebhookStatus.Cancelled, PayoutStatus.Cancelled)]
    [InlineData(RapdynWebhookStatus.Canceled, PayoutStatus.Cancelled)]
    [InlineData(RapdynWebhookStatus.Refunded, PayoutStatus.Failed)]
    [InlineData(RapdynWebhookStatus.Done, PayoutStatus.Completed)]
    public void Rapdyn_ShouldMapPayoutStatus(RapdynWebhookStatus status, PayoutStatus expected)
    {
        var actual = RapdynStatusConverter.ToPayoutStatus(status);
        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData("failed", PayoutStatus.Failed)]
    [InlineData("canceled", PayoutStatus.Failed)]
    [InlineData("cancelled", PayoutStatus.Failed)]
    [InlineData("refunded", PayoutStatus.Failed)]
    [InlineData("paid", PayoutStatus.Completed)]
    [InlineData("approved", PayoutStatus.Processing)]
    public void Pluggou_ShouldMapPayoutStatus(string status, PayoutStatus expected)
    {
        var actual = PluggouStatusConverter.ToPayoutStatus(status);
        actual.Should().Be(expected);
    }

    [Fact]
    public void Bankizi_ShouldParseFailedPixOutStatus()
    {
        var json = "{\"txId\":\"abc\",\"status\":\"Failed\",\"amount\":100}";
        var data = JsonSerializer.Deserialize<BankiziPixOutData>(json);

        data.Should().NotBeNull();
        data!.Status.Should().Be(BankiziPixOutStatus.Failed);
    }

    [Theory]
    [InlineData("cashout.failed", IHubWebhookEvents.CashOutFailed)]
    [InlineData("CashOut.Failed", IHubWebhookEvents.CashOutFailed)]
    [InlineData(" CASHOUT.REJECTED ", IHubWebhookEvents.CashOutRejected)]
    [InlineData("cashin.expired", IHubWebhookEvents.CashInExpired)]
    public void IHub_ShouldNormalizeEvents(string value, string expected)
    {
        var actual = IHubWebhookEvents.Normalize(value);
        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData("cashin.paid", IHubWebhookEventType.CashInPaid)]
    [InlineData("CashOut.Reject", IHubWebhookEventType.CashOutRejected)]
    [InlineData("cashout.cancelled", IHubWebhookEventType.CashOutRejected)]
    [InlineData("infraction.updated", IHubWebhookEventType.InfractionUpdated)]
    public void IHub_ShouldMapEventTypeFromString(string value, IHubWebhookEventType expected)
    {
        var actual = IHubWebhookEvents.ToEventType(value);
        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(IHubTransactionStatus.PENDING, PaymentStatus.Pending)]
    [InlineData(IHubTransactionStatus.APPROVED, PaymentStatus.Completed)]
    [InlineData(IHubTransactionStatus.REFUNDED, PaymentStatus.Refunded)]
    [InlineData(IHubTransactionStatus.BLOCKED, PaymentStatus.Cancelled)]
    public void IHubStatusConverter_ShouldMapPaymentStatus(IHubTransactionStatus status, PaymentStatus expected)
    {
        var actual = IHubBankingStatusConverter.ToPaymentStatus(status);
        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(IHubWithdrawStatus.WITHDRAW_REQUEST, WithdrawStatus.Processing)]
    [InlineData(IHubWithdrawStatus.WITHDRAW_APPROVED, WithdrawStatus.Completed)]
    [InlineData(IHubWithdrawStatus.WITHDRAW_REJECTED, WithdrawStatus.Failed)]
    [InlineData(IHubWithdrawStatus.WITHDRAW_ERROR, WithdrawStatus.Failed)]
    public void IHubStatusConverter_ShouldMapWithdrawStatus(IHubWithdrawStatus status, WithdrawStatus expected)
    {
        var actual = IHubBankingStatusConverter.ToWithdrawStatus(status);
        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(BankiziPixStatus.Paid, PaymentStatus.Completed)]
    [InlineData(BankiziPixStatus.Cancelled, PaymentStatus.Cancelled)]
    [InlineData(BankiziPixStatus.Refunded, PaymentStatus.Refunded)]
    public void BankiziStatusConverter_ShouldMapPaymentStatus(BankiziPixStatus status, PaymentStatus expected)
    {
        var actual = BankiziStatusConverter.ToPaymentStatus(status);
        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(BankiziWithdrawStatus.Generated, WithdrawStatus.Processing)]
    [InlineData(BankiziWithdrawStatus.Done, WithdrawStatus.Completed)]
    [InlineData(BankiziWithdrawStatus.Rejected, WithdrawStatus.Failed)]
    [InlineData(BankiziWithdrawStatus.Failed, WithdrawStatus.Failed)]
    public void BankiziStatusConverter_ShouldMapWithdrawStatus(BankiziWithdrawStatus status, WithdrawStatus expected)
    {
        var actual = BankiziStatusConverter.ToWithdrawStatus(status);
        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData("withdrawal.done", HunterPayWebhookEventType.WithdrawalCompleted)]
    [InlineData("withdrawal.canceled", HunterPayWebhookEventType.WithdrawalCancelled)]
    [InlineData("transaction.refunded", HunterPayWebhookEventType.TransactionRefunded)]
    public void HunterPayWebhookEventTypeConverter_ShouldParseAliases(string value, HunterPayWebhookEventType expected)
    {
        var json = $"{{\"event\":\"{value}\",\"type\":\"transaction\"}}";
        var result = JsonSerializer.Deserialize<HunterPayWebhookRequest>(json);

        result.Should().NotBeNull();
        result!.Event.Should().Be(expected);
    }

    [Theory]
    [InlineData(HunterPayTransactionStatus.Paid, PaymentStatus.Completed)]
    [InlineData(HunterPayTransactionStatus.Refunded, PaymentStatus.Refunded)]
    [InlineData(HunterPayTransactionStatus.Canceled, PaymentStatus.Cancelled)]
    [InlineData(HunterPayTransactionStatus.Refused, PaymentStatus.Failed)]
    public void HunterPayStatusConverter_ShouldMapTypedTransactionStatus(HunterPayTransactionStatus status, PaymentStatus expected)
    {
        var actual = HunterPayStatusConverter.ToPaymentStatus(status);
        actual.Should().Be(expected);
    }

        [Fact]
        public void HeartPayWebhookEventTypeConverter_ShouldParsePayInCompletedAlias()
        {
                const string json = "{\"event\":\"PayInCompleted\"}";

                var result = JsonSerializer.Deserialize<HeartPayWebhookRequest>(json);

                result.Should().NotBeNull();
                result!.Event.Should().Be(HeartPayWebhookEventType.ChargePaid);
        }

        [Fact]
        public void HeartPayWebhookRequest_ShouldParseNestedDataPayload()
        {
                const string json = """
                                                        {
                                                            "event": "PayInCompleted",
                                                            "timestamp": "2026-03-27T11:56:33.522Z",
                                                            "data": {
                                                                "data": {
                                                                    "txid": "BOL_019d286962e57a4da68ca050e2f58c1b",
                                                                    "correlationID": "BOL_019d286962e57a4da68ca050e2f58c1b",
                                                                    "status": "paid"
                                                                },
                                                                "event": "PayInCompleted"
                                                            }
                                                        }
                                                        """;

                var result = JsonSerializer.Deserialize<HeartPayWebhookRequest>(json);

                result.Should().NotBeNull();
                result!.Event.Should().Be(HeartPayWebhookEventType.ChargePaid);
                result.Data.Should().NotBeNull();
                result.Data!.Event.Should().Be(HeartPayWebhookEventType.ChargePaid);
                result.Data.Data.Should().NotBeNull();
                result.Data.Data!.CorrelationId.Should().Be("BOL_019d286962e57a4da68ca050e2f58c1b");
                (result.Data.Data.TxId ?? result.Data.Data.TxIdLower).Should().Be("BOL_019d286962e57a4da68ca050e2f58c1b");
                result.Data.Data.Status.Should().Be(HeartPayWebhookStatus.Paid);
        }

        [Theory]
        [InlineData("WAITING_PAYMENT", PaymentStatus.Pending)]
        [InlineData("PENDING", PaymentStatus.Pending)]
        [InlineData("APPROVED", PaymentStatus.Completed)]
        [InlineData("PAID", PaymentStatus.Completed)]
        [InlineData("REFUSED", PaymentStatus.Failed)]
        [InlineData("CANCELLED", PaymentStatus.Cancelled)]
        [InlineData("REFUNDED", PaymentStatus.Refunded)]
        [InlineData("IN_PROTEST", PaymentStatus.Disputed)]
        [InlineData("CHARGEBACK", PaymentStatus.Disputed)]
        public void AkkadPag_PaymentStatus_ShouldMapCorrectly(string status, PaymentStatus expected)
        {
            var actual = AkkadPagStatusConverter.ToPaymentStatus(status);
            actual.Should().Be(expected);
        }

        [Theory]
        [InlineData("PENDING_ANALYSIS", WithdrawStatus.Processing)]
        [InlineData("PROCESSING", WithdrawStatus.Processing)]
        [InlineData("COMPLETED", WithdrawStatus.Completed)]
        [InlineData("REFUSED", WithdrawStatus.Failed)]
        [InlineData("CANCELLED", WithdrawStatus.Cancelled)]
        public void AkkadPag_WithdrawStatus_ShouldMapCorrectly(string status, WithdrawStatus expected)
        {
            var actual = AkkadPagStatusConverter.ToWithdrawStatus(status);
            actual.Should().Be(expected);
        }
}
