using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Reconciliations.ReadReconciliation;

public sealed class ReadReconciliationRequest
{
    public Guid Id { get; set; }
}

public sealed class ReadReconciliationRequestValidator : Validator<ReadReconciliationRequest>
{
    public ReadReconciliationRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("O identificador da reconciliação é obrigatório.");
    }
}

public sealed class ReadReconciliationResponse : BaseResponse<AdminReconciliationDetails>;

public sealed class AdminReconciliationDetails
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public string MerchantName { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    
    public long LedgerBalance { get; set; }
    public long CalculatedBalance { get; set; }
    public long BalanceDifference { get; set; }
    
    public long TotalPaymentsAmount { get; set; }
    public long TotalPayoutsAmount { get; set; }
    public long TotalFeesAmount { get; set; }
    public long TotalRefundsAmount { get; set; }
    public int TotalRefundsCount { get; set; }
    public long TotalAdjustmentsAmount { get; set; }
    public int TotalAdjustmentsCount { get; set; }
    public int TotalLedgerTransactionsCount { get; set; }
    
    public int TotalPaymentsCount { get; set; }
    public int TotalPayoutsCount { get; set; }
    
    public int TotalDiscrepancies { get; set; }
    public int CorrectedDiscrepancies { get; set; }
    public long DiscrepanciesWithErrorAmount { get; set; }
    public bool HasDiscrepancies { get; set; }
    public bool CorrectionsApplied { get; set; }
    
    public string? ErrorMessage { get; set; }
    
    public Guid RequestedByUserId { get; set; }
    public string? RequestedByUserName { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ProcessingStartedAt { get; set; }
    public DateTime? ProcessingCompletedAt { get; set; }
    public DateTime? CorrectionsAppliedAt { get; set; }
    public Guid? CorrectionsAppliedByUserId { get; set; }
    public string? CorrectionsAppliedByUserName { get; set; }
    public string? CorrectionNotes { get; set; }
    
    public List<AdminReconciliationDiscrepancy> Discrepancies { get; set; } = [];
}

public sealed class AdminReconciliationDiscrepancy
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    public Guid? PaymentId { get; set; }
    public Guid? PayoutId { get; set; }
    public string? LedgerTransactionId { get; set; }
    
    public long ExpectedAmount { get; set; }
    public long ActualAmount { get; set; }
    public long Difference { get; set; }
    
    public string? SuggestedAction { get; set; }
    public bool Corrected { get; set; }
    public DateTime CreatedAt { get; set; }
}
