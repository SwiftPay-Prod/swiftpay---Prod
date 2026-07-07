namespace swiftpay_api_payment.Clients.Bankizi.Models.Withdrawals;

public sealed class BankiziWithdrawRequest
{
    public long Amount { get; set; }
    public string TxId { get; set; } = string.Empty;
    public string PixKey { get; set; } = string.Empty;
}
