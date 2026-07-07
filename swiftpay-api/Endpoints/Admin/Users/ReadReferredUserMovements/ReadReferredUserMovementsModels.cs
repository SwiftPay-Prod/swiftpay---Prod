using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Users.ReadReferredUserMovements;

public sealed class ReadReferredUserMovementsRequest
{
    public Guid UserId { get; set; }
    public Guid ReferredUserId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public sealed class ReadReferredUserMovementsRequestValidator : Validator<ReadReferredUserMovementsRequest>
{
    public ReadReferredUserMovementsRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("O identificador do usuário é obrigatório.");

        RuleFor(x => x.ReferredUserId)
            .NotEmpty()
            .WithMessage("O identificador do usuário indicado é obrigatório.");

        RuleFor(x => x.Page)
            .GreaterThan(0)
            .WithMessage("A página deve ser maior que zero.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("A quantidade por página deve estar entre 1 e 100.");
    }
}

public sealed class ReadReferredUserMovementsResponse : BaseResponse<AdminReferredUserMovementsData>;

public sealed class AdminReferredUserMovementsData
{
    public Guid ReferrerUserId { get; set; }
    public Guid ReferredUserId { get; set; }
    public string ReferredUserName { get; set; } = string.Empty;
    public string ReferredUserEmail { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserStatus ReferredUserStatus { get; set; }

    public DateTime? ReferredAt { get; set; }

    public long TotalCommissionFromPayments { get; set; }
    public long TotalCommissionFromPayouts { get; set; }
    public long TotalCommissionAmount { get; set; }

    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }

    public List<AdminReferralCommissionMovementData> Movements { get; set; } = [];
}

public sealed class AdminReferralCommissionMovementData
{
    public Guid Id { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ReferralCommissionMovementSourceType SourceType { get; set; }

    public Guid SourceId { get; set; }
    public int ReferralCommissionPercentage { get; set; }
    public long CommissionAmount { get; set; }
    public DateTime OccurredAt { get; set; }
    public string? Description { get; set; }
}
