using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;
using System.Text.Json.Serialization;

namespace safefy_api_payment.Endpoints.Internal.PlatformPayouts.ReprocessCompletedDev;

public sealed class InternalReprocessCompletedPlatformPayoutDevRequest
{
    public Guid PlatformPayoutItemId { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public InternalReprocessPlatformPayoutTargetStatus TargetStatus { get; set; } = InternalReprocessPlatformPayoutTargetStatus.Completed;
}

public enum InternalReprocessPlatformPayoutTargetStatus
{
    Completed,
    Failed
}

public sealed class InternalReprocessCompletedPlatformPayoutDevRequestValidator : Validator<InternalReprocessCompletedPlatformPayoutDevRequest>
{
    public InternalReprocessCompletedPlatformPayoutDevRequestValidator()
    {
        RuleFor(x => x.PlatformPayoutItemId)
            .NotEmpty()
            .WithMessage("O ID do item do saque de plataforma é obrigatório.");

        RuleFor(x => x.TargetStatus)
            .IsInEnum()
            .WithMessage("Status de reprocessamento inválido.");
    }
}

public sealed class InternalReprocessCompletedPlatformPayoutDevResponse
{
    public bool Success { get; set; }
    public Guid? PlatformPayoutItemId { get; set; }
    public Guid? PlatformPayoutId { get; set; }
    public PlatformPayoutStatus? Status { get; set; }
    public int ProcessedItemsCount { get; set; } = 0;
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}
