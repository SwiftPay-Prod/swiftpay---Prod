using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Domain.Entities;

public class PaymentLink
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Money Amount { get; set; } = new(0);
    public Money? AmountMin { get; set; }
    public Money? AmountMax { get; set; }
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime? ExpiresAt { get; set; }
    public int? MaxUses { get; set; }
    public int UsesCount { get; set; }
    public bool RequireDocument { get; set; }
    public bool RequirePhone { get; set; }
    public string? Theme { get; set; }
    public string? PrimaryColor { get; set; }
    public string? CtaText { get; set; }
    public string? SuccessMessage { get; set; }
    public string? SuccessUrl { get; set; }
    public string? CancelUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    public bool IsExpired => ExpiresAt.HasValue && ExpiresAt < DateTime.UtcNow;
    public bool IsExhausted => MaxUses.HasValue && UsesCount >= MaxUses;

    public void MarkAsUpdated()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}
