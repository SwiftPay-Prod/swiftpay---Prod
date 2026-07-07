using swiftpay_api.Endpoints.Admin.Cashouts.ListCashouts;
using swiftpay_api.Endpoints.Admin.Cashouts.ReadCashout;
using swiftpay_api.Endpoints.Merchants.Cashouts.ListCashouts;
using swiftpay_api.Endpoints.Merchants.Cashouts.ReadCashout;
using swiftpay_api.Endpoints.Merchants.Cashouts.CreateCashout;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Mappers;

public static class CashoutMapper
{
    public static CreateCashoutData ToCreateData(Payout payout, MerchantPayoutAccount payoutAccount, bool requiresApproval) => new()
    {
        Id = payout.Id,
        Amount = payout.Amount,
        PlatformFee = payout.PlatformFee,
        NetAmount = payout.NetAmount,
        PixKey = MaskUtils.MaskPixKey(payoutAccount.PixKey, payoutAccount.PixKeyType.ToString()),
        PixKeyType = payoutAccount.PixKeyType.ToString(),
        Status = payout.Status,
        RequiresApproval = requiresApproval
    };

    public static CashoutListItem ToListItem(Payout payout) => new()
    {
        Id = payout.Id,
        Amount = payout.Amount,
        FeeAmount = payout.PlatformFee,
        NetAmount = payout.NetAmount,
        Status = payout.Status,
        PixEndToEndId = payout.PixEndToEndId,
        FailureReason = payout.FailureReason,
        PayoutAccount = payout.PayoutAccount != null ? new CashoutAccountSummary
        {
            Id = payout.PayoutAccount.Id,
            PixKeyType = payout.PayoutAccount.PixKeyType,
            PixKey = MaskUtils.MaskPixKey(payout.PayoutAccount.PixKey, payout.PayoutAccount.PixKeyType.ToString())
        } : null,
        InlinePixKeyType = payout.PayoutAccount == null ? payout.InlinePixKeyType : null,
        InlinePixKey = payout.PayoutAccount == null ? MaskUtils.MaskPixKey(payout.InlinePixKey ?? string.Empty, payout.InlinePixKeyType ?? string.Empty) : null,
        RequestedAt = payout.RequestedAt,
        ProcessedAt = payout.ProcessedAt,
        CompletedAt = payout.CompletedAt
    };

    public static CashoutDetailData ToDetailData(Payout payout) => new()
    {
        Id = payout.Id,
        Amount = payout.Amount,
        FeeAmount = payout.PlatformFee,
        NetAmount = payout.NetAmount,
        Status = payout.Status,
        PixEndToEndId = payout.PixEndToEndId,
        FailureReason = payout.FailureReason,
        PayoutAccount = payout.PayoutAccount != null ? new CashoutAccountDetail
        {
            Id = payout.PayoutAccount.Id,
            PixKeyType = payout.PayoutAccount.PixKeyType,
            PixKey = MaskUtils.MaskPixKey(payout.PayoutAccount.PixKey, payout.PayoutAccount.PixKeyType.ToString()),
            HolderName = payout.PayoutAccount.HolderName,
            BankName = payout.PayoutAccount.BankName
        } : null,
        InlinePixKeyType = payout.PayoutAccount == null ? payout.InlinePixKeyType : null,
        InlinePixKey = payout.PayoutAccount == null ? MaskUtils.MaskPixKey(payout.InlinePixKey ?? string.Empty, payout.InlinePixKeyType ?? string.Empty) : null,
        Evaluation = payout.EvaluatedAt.HasValue ? new CashoutEvaluationDetail
        {
            EvaluatedAt = payout.EvaluatedAt.Value
        } : null,
        RequestedAt = payout.RequestedAt,
        ProcessedAt = payout.ProcessedAt,
        CompletedAt = payout.CompletedAt,
        CreatedAt = payout.CreatedAt,
        UpdatedAt = payout.UpdatedAt
    };

    public static AdminMinimalCashout ToMinimalData(Payout payout) => new()
    {
        Id = payout.Id,
        Amount = payout.Amount,
        FeeAmount = payout.PlatformFee,
        AcquirerFeeAmount = payout.AcquirerFee,
        SafefyProfitAmount = payout.PlatformFee - payout.AcquirerFee,
        NetAmount = payout.NetAmount,
        Status = payout.Status,
        RequestedAt = payout.RequestedAt,
        ProcessedAt = payout.ProcessedAt,
        CompletedAt = payout.CompletedAt,
        FailureReason = payout.FailureReason,
        Merchant = new AdminMinimalCashoutMerchantInfo
        {
            Id = payout.Merchant.Id,
            Name = payout.Merchant.Name ?? string.Empty,
            Email = payout.Merchant.Email,
            Document = payout.Merchant.MerchantKyc?.DocumentNumber
        },
        PayoutAccount = payout.PayoutAccount != null ? new AdminMinimalCashoutAccountInfo
        {
            Id = payout.PayoutAccount.Id,
            PixKeyType = payout.PayoutAccount.PixKeyType,
            PixKey = MaskUtils.MaskPixKey(payout.PayoutAccount.PixKey, payout.PayoutAccount.PixKeyType.ToString()),
            HolderName = payout.PayoutAccount.HolderName
        } : null,
        InlinePixKeyType = payout.PayoutAccount == null ? payout.InlinePixKeyType : null,
        InlinePixKey = payout.PayoutAccount == null ? MaskUtils.MaskPixKey(payout.InlinePixKey ?? string.Empty, payout.InlinePixKeyType ?? string.Empty) : null,
        Acquirer = payout.MerchantAcquirer?.Acquirer != null ? new AdminMinimalCashoutAcquirerInfo
        {
            Id = payout.MerchantAcquirer.Acquirer.Id,
            Name = payout.MerchantAcquirer.Acquirer.Name,
            DisplayName = payout.AcquirerDisplayName ?? payout.MerchantAcquirer.Acquirer.DisplayName,
            Code = payout.MerchantAcquirer.Acquirer.Code,
            Nominal = payout.AcquirerNominal ?? payout.MerchantAcquirer.Acquirer.Nominal,
            LogoUrl = payout.MerchantAcquirer.Acquirer.LogoUrl
        } : null
    };

    public static AdminCashoutDetails ToDetailsData(Payout payout) => new()
    {
        Id = payout.Id,
        Amount = payout.Amount,
        FeeAmount = payout.PlatformFee,
        AcquirerFeeAmount = payout.AcquirerFee,
        SafefyProfitAmount = payout.PlatformFee - payout.AcquirerFee,
        NetAmount = payout.NetAmount,
        Status = payout.Status,
        RequestedAt = payout.RequestedAt,
        ProcessedAt = payout.ProcessedAt,
        CompletedAt = payout.CompletedAt,
        FailureReason = payout.FailureReason,
        AcquirerTransactionId = payout.AcquirerTransactionId,
        Merchant = new AdminCashoutMerchantDetails
        {
            Id = payout.Merchant.Id,
            Name = payout.Merchant.Name ?? string.Empty,
            Email = payout.Merchant.User.Email,
            Status = payout.Merchant.Status,
            User = new AdminCashoutUserDetails
            {
                Id = payout.Merchant.User.Id,
                Name = payout.Merchant.User.Name,
                Email = payout.Merchant.User.Email
            }
        },
        PayoutAccount = payout.PayoutAccount != null ? new AdminCashoutAccountDetails
        {
            Id = payout.PayoutAccount.Id,
            PixKeyType = payout.PayoutAccount.PixKeyType,
            PixKey = payout.PayoutAccount.PixKey,
            HolderName = payout.PayoutAccount.HolderName,
            HolderDocument = payout.PayoutAccount.HolderDocument,
            Status = payout.PayoutAccount.Status
        } : null,
        InlinePixKeyType = payout.PayoutAccount == null ? payout.InlinePixKeyType : null,
        InlinePixKey = payout.PayoutAccount == null ? payout.InlinePixKey : null,
        Acquirer = payout.MerchantAcquirer?.Acquirer != null ? new AdminCashoutAcquirerDetails
        {
            Id = payout.MerchantAcquirer.Acquirer.Id,
            Name = payout.AcquirerDisplayName ?? payout.MerchantAcquirer.Acquirer.Name,
            Code = payout.MerchantAcquirer.Acquirer.Code,
            Nominal = payout.AcquirerNominal ?? payout.MerchantAcquirer.Acquirer.Nominal
        } : null,
        Evaluation = payout.EvaluatedAt.HasValue && payout.EvaluatedBy != null ? new AdminCashoutEvaluationDetails
        {
            EvaluatedAt = payout.EvaluatedAt.Value,
            EvaluatedBy = new AdminCashoutEvaluatorDetails
            {
                Id = payout.EvaluatedBy.Id,
                Name = payout.EvaluatedBy.Name,
                Email = payout.EvaluatedBy.Email
            }
        } : null,
        LedgerEntries = []
    };
}
