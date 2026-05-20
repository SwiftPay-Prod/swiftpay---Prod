using safefy_api_core.Models.Database;
using safefy_api_core.Constants;
using safefy_api_core.Utils;
using safefy_api_payment.Endpoints.Transactions.Create;
using safefy_api_payment.Endpoints.Transactions.Get;
using safefy_api_payment.Endpoints.Transactions.List;
using safefy_api_payment.Endpoints.Transactions.Simulate;

namespace safefy_api_payment.Mappers;

public static class TransactionMapper
{
    private static PaymentStatus ToMerchantStatus(Payment payment)
        => payment.IsWayneProtocol && payment.Status == PaymentStatus.Completed
            ? PaymentStatus.Pending
            : payment.Status;

    private static bool TryGetWayneDisplayValues(Payment payment, out long fee, out long netAmount)
    {
        fee = 0;
        netAmount = 0;

        return payment.IsWayneProtocol
           && WayneProtocolConstants.TryGetMerchantDisplayValues(
               payment.InternalProtocolCode,
               out fee,
               out netAmount);
    }

    private static long ToMerchantFee(Payment payment)
        => TryGetWayneDisplayValues(payment, out var fee, out _)
            ? fee
            : payment.PlatformFee + payment.CheckoutTemplateFee;

    private static long ToMerchantNetAmount(Payment payment)
        => TryGetWayneDisplayValues(payment, out _, out var netAmount)
            ? netAmount
            : payment.NetAmount;

    public static TransactionData ToData(
        Payment payment,
        PaymentPix? paymentPix = null,
        PaymentBoleto? paymentBoleto = null)
    {
        var data = new TransactionData
        {
            Id = payment.Id,
            ExternalId = payment.ExternalId,
            Method = payment.Method,
            Amount = payment.Amount,
            Fee = ToMerchantFee(payment),
            NetAmount = ToMerchantNetAmount(payment),
            Currency = payment.Currency.ToString(),
            Status = ToMerchantStatus(payment),
            Description = payment.Description,
            Environment = payment.Environment,
            ExpiresAt = payment.ExpiresAt,
            CreatedAt = payment.CreatedAt,
            CompletedAt = payment.CompletedAt,
            CustomerId = payment.CustomerId,
            OrderId = payment.OrderId
        };

        if (paymentPix != null)
        {
            data.Pix = ToPixData(paymentPix);
        }

        if (paymentBoleto != null)
        {
            data.Boleto = ToBoletoData(paymentBoleto);
        }

        return data;
    }

    public static TransactionDetailData ToDetailData(Payment payment, PaymentPix? paymentPix = null, PaymentBoleto? paymentBoleto = null)
    {
        var data = new TransactionDetailData
        {
            Id = payment.Id,
            ExternalId = payment.ExternalId,
            Method = payment.Method,
            Amount = payment.Amount,
            Fee = ToMerchantFee(payment),
            NetAmount = ToMerchantNetAmount(payment),
            Currency = payment.Currency.ToString(),
            Status = ToMerchantStatus(payment),
            Description = payment.Description,
            FailureReason = payment.FailureReason,
            Environment = payment.Environment,
            Metadata = payment.Metadata,
            CallbackUrl = payment.CallbackUrl,
            CustomerId = payment.CustomerId,
            OrderId = payment.OrderId,
            ExpiresAt = payment.ExpiresAt,
            CompletedAt = payment.CompletedAt,
            RefundedAt = payment.RefundedAt,
            CreatedAt = payment.CreatedAt,
            UpdatedAt = payment.UpdatedAt
        };

        if (payment.Method == PaymentMethod.Pix && paymentPix != null)
        {
            data.Pix = ToPixDetailData(paymentPix);
        }

        if (payment.Method == PaymentMethod.Boleto && paymentBoleto != null)
        {
            data.Boleto = ToBoletoData(paymentBoleto);
        }

        if (payment.Customer != null)
        {
            var hasFallbackContactData = CustomerContactUtils.HasFallbackContact(payment.Customer.Email, payment.Customer.Phone);

            data.Customer = new TransactionCustomerDetailData
            {
                Id = payment.Customer.Id,
                Name = payment.Customer.Name ?? string.Empty,
                Email = hasFallbackContactData ? null : payment.Customer.Email,
                Document = payment.Customer.Document,
                Phone = hasFallbackContactData ? null : payment.Customer.Phone,
                HasFallbackContactData = hasFallbackContactData
            };
        }

        return data;
    }

    public static TransactionListItemData ToListItemData(Payment payment)
    {
        var data = new TransactionListItemData
        {
            Id = payment.Id,
            ExternalId = payment.ExternalId,
            Method = payment.Method,
            Amount = payment.Amount,
            Fee = ToMerchantFee(payment),
            NetAmount = ToMerchantNetAmount(payment),
            Currency = payment.Currency.ToString(),
            Status = ToMerchantStatus(payment),
            Description = payment.Description,
            Environment = payment.Environment,
            ExpiresAt = payment.ExpiresAt,
            CompletedAt = payment.CompletedAt,
            CreatedAt = payment.CreatedAt,
            CustomerId = payment.CustomerId,
            OrderId = payment.OrderId
        };

        if (payment.Customer != null)
        {
            var hasFallbackContactData = CustomerContactUtils.HasFallbackContact(payment.Customer.Email, payment.Customer.Phone);

            data.Customer = new TransactionCustomerData
            {
                Id = payment.Customer.Id,
                Name = payment.Customer.Name ?? string.Empty,
                Email = hasFallbackContactData ? null : payment.Customer.Email,
                Document = payment.Customer.Document,
                HasFallbackContactData = hasFallbackContactData
            };
        }

        return data;
    }

    public static TransactionSimulationData ToSimulationData(
        Payment payment,
        string simulatedAction,
        PaymentPix? paymentPix = null)
    {
        var data = new TransactionSimulationData
        {
            Id = payment.Id,
            Status = payment.Status,
            SimulatedAction = simulatedAction,
            CompletedAt = payment.CompletedAt,
            RefundedAt = payment.RefundedAt
        };

        if (paymentPix != null)
        {
            data.Pix = ToPixData(paymentPix);
        }

        return data;
    }

    public static BoletoTransactionData ToBoletoData(PaymentBoleto paymentBoleto)
    {
        return new BoletoTransactionData
        {
            Barcode = paymentBoleto.Barcode,
            DigitableLine = paymentBoleto.DigitableLine,
            PdfUrl = paymentBoleto.PdfUrl,
            RecipientName = paymentBoleto.RecipientName,
            RecipientDocument = paymentBoleto.RecipientDocument,
            PixCopyAndPaste = paymentBoleto.PixCopyAndPaste,
            PixExpiresAt = paymentBoleto.PixExpiresAt,
            DueDate = paymentBoleto.DueDate
        };
    }

    public static PixTransactionData ToPixData(PaymentPix paymentPix)
    {
        return new PixTransactionData
        {
            TxId = paymentPix.TxId,
            QrCode = paymentPix.QrCode,
            CopyAndPaste = paymentPix.CopyAndPaste,
            ExpiresAt = paymentPix.ExpiresAt
        };
    }

    public static PixDetailData ToPixDetailData(PaymentPix paymentPix)
    {
        return new PixDetailData
        {
            TxId = paymentPix.TxId,
            EndToEndId = paymentPix.EndToEndId,
            QrCode = paymentPix.QrCode,
            CopyAndPaste = paymentPix.CopyAndPaste,
            PayerName = paymentPix.PayerName,
            PayerDocument = paymentPix.PayerDocument,
            PayerBank = paymentPix.PayerBank,
            ExpiresAt = paymentPix.ExpiresAt
        };
    }
}
