namespace Swiftpay.Application.Features.Wallet.DTOs;

public class WithdrawalResponse
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PixKey { get; set; } = string.Empty;
    public string PixKeyType { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
}
