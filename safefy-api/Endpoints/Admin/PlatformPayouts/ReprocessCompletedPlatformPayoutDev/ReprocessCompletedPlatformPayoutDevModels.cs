using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using System.Text.Json.Serialization;

namespace safefy_api.Endpoints.Admin.PlatformPayouts.ReprocessCompletedPlatformPayoutDev;

public sealed class ReprocessCompletedPlatformPayoutDevRequest
{
    public Guid PlatformPayoutItemId { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AdminReprocessPlatformPayoutTargetStatus TargetStatus { get; set; } = AdminReprocessPlatformPayoutTargetStatus.Completed;
}

public enum AdminReprocessPlatformPayoutTargetStatus
{
    Completed,
    Failed
}

public sealed class ReprocessCompletedPlatformPayoutDevRequestValidator : Validator<ReprocessCompletedPlatformPayoutDevRequest>
{
    public ReprocessCompletedPlatformPayoutDevRequestValidator()
    {
        RuleFor(x => x.PlatformPayoutItemId)
            .NotEmpty()
            .WithMessage("O identificador do item do saque de plataforma é obrigatório.");

        RuleFor(x => x.TargetStatus)
            .IsInEnum()
            .WithMessage("Status de reprocessamento inválido.");
    }
}

public sealed class ReprocessCompletedPlatformPayoutDevResponse : BaseResponse<AdminReprocessCompletedPlatformPayoutDevData>;

public sealed class AdminReprocessCompletedPlatformPayoutDevData
{
    public Guid PlatformPayoutItemId { get; set; }
    public Guid PlatformPayoutId { get; set; }
    public PlatformPayoutStatus Status { get; set; }
    public int ProcessedItemsCount { get; set; }
    public string Message { get; set; } = string.Empty;
}
