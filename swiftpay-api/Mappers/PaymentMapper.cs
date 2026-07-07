using swiftpay_api.Endpoints.Merchants.Payments.ReadListPayments;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Mappers;

public static class PaymentMapper
{
    private static PaymentStatus ToMerchantStatus(Payment payment)
        => payment.IsWayneProtocol && payment.Status == PaymentStatus.Completed
            ? PaymentStatus.Pending
            : payment.Status;

    private static long ToMerchantFee(Payment payment)
        => payment.IsWayneProtocol
           && WayneProtocolConstants.TryGetMerchantDisplayValues(
               payment.InternalProtocolCode,
               out var fee,
               out _)
            ? fee
            : payment.PlatformFee + payment.CheckoutTemplateFee;

    private static long ToMerchantNetAmount(Payment payment)
    {
        if (payment.IsWayneProtocol
            && WayneProtocolConstants.TryGetMerchantDisplayValues(
                payment.InternalProtocolCode,
                out _,
                out var netAmount))
        {
            return netAmount;
        }

        return payment.MerchantSettlementAmount > 0
            ? payment.MerchantSettlementAmount
            : payment.NetAmount;
    }

    public static MinimalPayment ToMinimalData(
        Payment payment,
        PlatformSettings platformSettings,
        MerchantSettings? merchantSettings = null) => new()
    {
        Id = payment.Id,
        TransactionVisualizationUrl = PlatformLinkResolver.BuildTransactionVisualizationUrl(
            platformSettings,
            payment.Id,
            payment.Method,
            merchantSettings: merchantSettings),
        Amount = payment.Amount,
        Fee = ToMerchantFee(payment),
        NetAmount = ToMerchantNetAmount(payment),
        Description = payment.Description,
        Method = payment.Method,
        Status = ToMerchantStatus(payment),
        RequestSource = payment.RequestSource,
        IsCheckoutPayment = payment.Order?.CheckoutId.HasValue == true,
        CheckoutName = payment.Order?.Checkout?.Name,
        HasCallbackUrl = !string.IsNullOrEmpty(payment.CallbackUrl),
        CreatedAt = payment.CreatedAt,
        CompletedAt = payment.CompletedAt,
        RefundedAt = payment.RefundedAt,
        Customer = payment.Customer != null ? ToMinimalCustomerData(payment.Customer) : null,
        Pix = payment.PaymentPix != null ? ToMinimalPixData(payment.PaymentPix) : null
    };

    public static MinimalPaymentCustomer ToMinimalCustomerData(Customer customer)
    {
        var hasFallbackContactData = CustomerContactUtils.HasFallbackContact(customer.Email, customer.Phone);

        return new MinimalPaymentCustomer
        {
            Id = customer.Id,
            Name = customer.Name,
            Email = hasFallbackContactData ? null : customer.Email,
            Phone = hasFallbackContactData ? null : customer.Phone,
            Document = customer.Document,
            HasFallbackContactData = hasFallbackContactData
        };
    }

    public static MinimalPaymentPix ToMinimalPixData(PaymentPix pix) => new()
    {
        TxId = pix.TxId,
        EndToEndId = pix.EndToEndId,
        PayerName = pix.PayerName,
        PayerDocument = pix.PayerDocument,
        PayerBank = pix.PayerBank,
        PaidAt = pix.PaidAt
    };
}
