using safefy_api.Endpoints.Admin.Transactions.ReadListTransactions;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Mappers;

public static class AdminTransactionMapper
{
    public static AdminMinimalTransaction ToMinimalData(
        Payment payment,
        PlatformSettings platformSettings,
        MerchantSettings? merchantSettings = null)
    {
        var totalPlatformFee = payment.PlatformFee + payment.CheckoutTemplateFee;

        return new AdminMinimalTransaction
        {
            Id = payment.Id,
            TransactionVisualizationUrl = PlatformLinkResolver.BuildTransactionVisualizationUrl(
                platformSettings,
                payment.Id,
                payment.Method,
                merchantSettings: merchantSettings),
            IsWayneProtocol = payment.IsWayneProtocol,
            Amount = payment.Amount,
            Fee = totalPlatformFee,
            Profit = totalPlatformFee - payment.AcquirerFee,
            Method = payment.Method,
            RequestSource = payment.RequestSource,
            Status = payment.Status,
            Environment = payment.Environment,
            CreatedAt = payment.CreatedAt,
            Merchant = new AdminTransactionMerchantInfo
            {
                Id = payment.MerchantId,
                Name = payment.Merchant.Name,
                Document = payment.Merchant.MerchantKyc?.DocumentNumber
            },
            Acquirer = payment.MerchantAcquirer?.Acquirer != null ? new AdminTransactionAcquirerInfo
            {
                Id = payment.MerchantAcquirer.Acquirer.Id,
                Name = payment.MerchantAcquirer.Acquirer.Name,
                DisplayName = payment.AcquirerDisplayName ?? payment.MerchantAcquirer.Acquirer.DisplayName,
                Code = payment.MerchantAcquirer.Acquirer.Code,
                Nominal = payment.AcquirerNominal ?? payment.MerchantAcquirer.Acquirer.Nominal,
                LogoUrl = payment.MerchantAcquirer.Acquirer.LogoUrl
            } : null,
            Pix = payment.PaymentPix != null ? new AdminTransactionPixInfo
            {
                PayerName = payment.PaymentPix.PayerName,
                PayerBank = payment.PaymentPix.PayerBank
            } : null
        };
    }
}
