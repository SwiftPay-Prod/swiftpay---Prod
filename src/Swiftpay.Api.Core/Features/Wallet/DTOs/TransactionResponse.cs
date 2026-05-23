namespace Swiftpay.Application.Features.Wallet.DTOs;

public class TransactionResponse
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
