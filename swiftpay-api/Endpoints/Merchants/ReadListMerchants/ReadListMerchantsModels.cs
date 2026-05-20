using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api.Validators;

namespace safefy_api.Endpoints.Merchants.ReadListMerchants;

public sealed class ReadListMerchantsRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public MerchantStatus? Status { get; set; }
}

public sealed class ReadListMerchantsRequestValidator : Validator<ReadListMerchantsRequest>
{
    public ReadListMerchantsRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();

        RuleFor(x => x.Status)
            .IsInEnum()
            .When(x => x.Status.HasValue)
            .WithMessage("Status inválido.");
    }
}

public sealed class ReadListMerchantsResponse : BaseResponse<Paginated<MinimalMerchant>>;

public sealed class MinimalMerchant
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Document { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantStatus Status { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantKycStatus KycStatus { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantOnboardingStep OnboardingStep { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? OnboardingCompletedAt { get; set; }
    public long? AvailableBalance { get; set; }
    public MinimalMerchantFees? Fees { get; set; }
}

public sealed class MinimalMerchantFees
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode PixApiFeeMode { get; set; }
    public long PixApiFeeFixed { get; set; }
    public int PixApiFeePercentage { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode PixCheckoutFeeMode { get; set; }
    public long PixCheckoutFeeFixed { get; set; }
    public int PixCheckoutFeePercentage { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode WithdrawalFeeMode { get; set; }
    public long WithdrawalFeeFixed { get; set; }
    public int WithdrawalFeePercentage { get; set; }
    public long MinWithdrawalAmount { get; set; }
}
