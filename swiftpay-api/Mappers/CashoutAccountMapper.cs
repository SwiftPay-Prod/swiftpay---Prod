using swiftpay_api.Endpoints.Merchants.Cashouts.ListCashouts;
using swiftpay_api.Endpoints.Merchants.CashoutAccounts.CreateCashoutAccount;
using swiftpay_api.Endpoints.Merchants.CashoutAccounts.ReadListCashoutAccounts;
using swiftpay_api.Endpoints.Merchants.CashoutAccounts.ViewCashoutAccount;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Mappers;

public static class CashoutAccountMapper
{
    public static CashoutAccountData ToData(MerchantPayoutAccount account, bool maskPixKey = true) => new()
    {
        Id = account.Id,
        PixKeyType = account.PixKeyType,
        PixKey = maskPixKey 
            ? MaskUtils.MaskPixKey(account.PixKey, account.PixKeyType.ToString()) 
            : account.PixKey,
        HolderName = account.HolderName,
        Status = account.Status,
        IsDefault = account.IsDefault,
        CreatedAt = account.CreatedAt
    };

    public static CashoutAccountItem ToListItem(MerchantPayoutAccount account) => new()
    {
        Id = account.Id,
        PixKeyType = account.PixKeyType,
        PixKey = MaskUtils.MaskPixKey(account.PixKey, account.PixKeyType.ToString()),
        HolderName = account.HolderName,
        BankName = account.BankName,
        Status = account.Status,
        IsDefault = account.IsDefault,
        CreatedAt = account.CreatedAt
    };

    public static CashoutAccountSummary ToSummary(MerchantPayoutAccount account) => new()
    {
        Id = account.Id,
        PixKeyType = account.PixKeyType,
        PixKey = MaskUtils.MaskPixKey(account.PixKey, account.PixKeyType.ToString())
    };

    public static ViewCashoutAccountData ToViewData(MerchantPayoutAccount account) => new()
    {
        Id = account.Id,
        PixKeyType = account.PixKeyType,
        PixKey = account.PixKey,
        HolderName = account.HolderName,
        HolderDocument = account.HolderDocument,
        BankName = account.BankName,
        BankIspb = account.BankIspb,
        Status = account.Status,
        IsDefault = account.IsDefault,
        CreatedAt = account.CreatedAt
    };
}
