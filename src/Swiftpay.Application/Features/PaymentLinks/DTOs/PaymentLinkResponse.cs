namespace Swiftpay.Application.Features.PaymentLinks.DTOs;

public class PaymentLinkResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long Amount { get; set; }
    public long? AmountMin { get; set; }
    public long? AmountMax { get; set; }
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsExpired { get; set; }
    public bool IsExhausted { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? MaxUses { get; set; }
    public int UsesCount { get; set; }
    public bool RequireDocument { get; set; }
    public bool RequirePhone { get; set; }
    public string? Theme { get; set; }
    public string? PrimaryColor { get; set; }
    public string? CtaText { get; set; }
    public DateTime CreatedAt { get; set; }
}
