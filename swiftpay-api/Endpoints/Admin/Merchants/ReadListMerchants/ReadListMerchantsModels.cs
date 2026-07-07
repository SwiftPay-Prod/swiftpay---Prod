using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api.Validators;

namespace swiftpay_api.Endpoints.Admin.Merchants.ReadListMerchants;

public sealed class ReadListMerchantsRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public MerchantStatus? Status { get; set; }
    public MerchantKycStatus? KycStatus { get; set; }
    public string? Search { get; set; }
    public Guid? UserId { get; set; }
}

public sealed class ReadListMerchantsRequestValidator : Validator<ReadListMerchantsRequest>
{
    public ReadListMerchantsRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
        
        RuleFor(x => x.Search)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.Search))
            .WithMessage("A busca deve ter no máximo 100 caracteres.");
    }
}

public sealed class ReadListMerchantsResponse : BaseResponse<Paginated<AdminMinimalMerchant>>;

public sealed class AdminMinimalMerchant
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public string? Name { get; set; }
    public string? Document { get; set; }
    public string? Email { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantStatus Status { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantKycStatus KycStatus { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantOnboardingStep OnboardingStep { get; set; }
    
    public Guid? AcquirerId { get; set; }
    public string? AcquirerName { get; set; }
    public string? AcquirerCode { get; set; }
    public string? AcquirerNominal { get; set; }
    public string? AcquirerLogoUrl { get; set; }
    public bool UsesSubaccount { get; set; }
    public string? ExternalSubmerchantId { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ExternalSubmerchantStatus? ExternalSubmerchantStatus { get; set; }

    public bool IsNominalAbTestActive { get; set; }
    public List<string> AcquirerOperationTypes { get; set; } = [];
    public long LifetimeVolume { get; set; }
    public long TotalFeesPaid { get; set; }
    public long AvailableBalance { get; set; }
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? PixApiFeeMode { get; set; }
    public long? PixApiFeeFixed { get; set; }
    public int? PixApiFeePercentage { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? KycSubmittedAt { get; set; }
}
