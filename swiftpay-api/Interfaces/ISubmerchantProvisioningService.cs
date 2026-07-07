using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Interfaces;

public interface ISubmerchantProvisioningService
{
    Task<SubmerchantProvisioningResult> EnsureSubmerchantProvisionedAsync(
        Merchant merchant,
        MerchantAcquirer merchantAcquirer,
        Acquirer acquirer,
        bool forceResubmit = false,
        CancellationToken ct = default);

    Task<SubmerchantStatusRefreshResult> RefreshSubmerchantStatusAsync(
        MerchantAcquirer merchantAcquirer,
        Acquirer acquirer,
        CancellationToken ct = default);
}

public sealed record SubmerchantProvisioningResult(bool Success, string? ErrorMessage = null)
{
    public static SubmerchantProvisioningResult Ok() => new(true);

    public static SubmerchantProvisioningResult Fail(string? message)
        => new(false, string.IsNullOrWhiteSpace(message)
            ? "Falha ao provisionar subconta da organizacao na processadora."
            : message);
}

public sealed class SubmerchantStatusRefreshResult
{
    public bool Success { get; set; }
    public Guid MerchantAcquirerId { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public ExternalSubmerchantStatus Status { get; set; } = ExternalSubmerchantStatus.Pending;
    public string? LegalName { get; set; }
    public string? DocumentType { get; set; }
    public string? DocumentNumber { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? ErrorMessage { get; set; }

    public static SubmerchantStatusRefreshResult Fail(string? message)
        => new()
        {
            Success = false,
            ErrorMessage = string.IsNullOrWhiteSpace(message)
                ? "Falha ao atualizar status da subconta da organizacao na processadora."
                : message
        };
}
