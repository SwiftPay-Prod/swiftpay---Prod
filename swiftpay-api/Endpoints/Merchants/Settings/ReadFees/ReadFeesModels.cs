using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.Settings.ReadFees;

public sealed class ReadFeesRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class ReadFeesResponse : BaseResponse<ReadFeesData>;

public sealed class ReadFeesData
{
    // Operações habilitadas
    public bool PixEnabled { get; set; }
    public bool BoletoEnabled { get; set; }
    public bool CreditCardEnabled { get; set; }
    public bool WithdrawalEnabled { get; set; }

    public int PixCompensationDays { get; set; }
    public int BoletoCompensationDays { get; set; }
    public int CreditCardCompensationDays { get; set; }

    public int PixReservePercentage { get; set; }
    public int BoletoReservePercentage { get; set; }
    public int CreditCardReservePercentage { get; set; }
    
    public long PixMinTransactionAmount { get; set; }
    public long PixMaxTransactionAmount { get; set; }
    
    public long BoletoMinTransactionAmount { get; set; }
    public long BoletoMaxTransactionAmount { get; set; }

    public FeeChargeMode PixApiFeeMode { get; set; }
    public long PixApiFeeFixed { get; set; }
    public int PixApiFeePercentage { get; set; }

    public FeeChargeMode PixCheckoutFeeMode { get; set; }
    public long PixCheckoutFeeFixed { get; set; }
    public int PixCheckoutFeePercentage { get; set; }

    public FeeChargeMode PixPaymentLinkFeeMode { get; set; }
    public long PixPaymentLinkFeeFixed { get; set; }
    public int PixPaymentLinkFeePercentage { get; set; }

    public FeeChargeMode BoletoApiFeeMode { get; set; }
    public long BoletoApiFeeFixed { get; set; }
    public int BoletoApiFeePercentage { get; set; }

    public FeeChargeMode CreditCardApiFeeMode { get; set; }
    public long CreditCardApiFeeFixed { get; set; }
    public int CreditCardApiFeePercentage { get; set; }

    public FeeChargeMode BoletoCheckoutFeeMode { get; set; }
    public long BoletoCheckoutFeeFixed { get; set; }
    public int BoletoCheckoutFeePercentage { get; set; }

    public FeeChargeMode BoletoPaymentLinkFeeMode { get; set; }
    public long BoletoPaymentLinkFeeFixed { get; set; }
    public int BoletoPaymentLinkFeePercentage { get; set; }

    public FeeChargeMode CreditCardCheckoutFeeMode { get; set; }
    public long CreditCardCheckoutFeeFixed { get; set; }
    public int CreditCardCheckoutFeePercentage { get; set; }

    public FeeChargeMode CreditCardPaymentLinkFeeMode { get; set; }
    public long CreditCardPaymentLinkFeeFixed { get; set; }
    public int CreditCardPaymentLinkFeePercentage { get; set; }

    public FeeChargeMode WithdrawalFeeMode { get; set; }
    public long WithdrawalFeeFixed { get; set; }
    public int WithdrawalFeePercentage { get; set; }
    public long MinWithdrawalAmount { get; set; }
    public WithdrawalApprovalMode WithdrawalApprovalMode { get; set; }

    public int RateLimitPerMinute { get; set; }
    public int RateLimitPerHour { get; set; }
    public int RateLimitPerDay { get; set; }
}
