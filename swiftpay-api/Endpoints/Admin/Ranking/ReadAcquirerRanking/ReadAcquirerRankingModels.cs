using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Admin.Ranking.ReadAcquirerRanking;

public sealed class ReadAcquirerRankingRequest
{
    [QueryParam, BindFrom("operationTypes")]
    public string? OperationTypes { get; set; }
}

public sealed class ReadAcquirerRankingRequestValidator : Validator<ReadAcquirerRankingRequest>
{
    public ReadAcquirerRankingRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => AreOperationTypesValid(x.OperationTypes))
            .WithMessage("Os tipos de operação devem conter apenas valores válidos: Black, White.");
    }

    private static bool AreOperationTypesValid(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        var validTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            nameof(AcquirerOperationType.Black),
            nameof(AcquirerOperationType.White)
        };

        var parts = value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return parts.All(part => validTypes.Contains(part));
    }
}

public sealed class ReadAcquirerRankingResponse : BaseResponse<AdminAcquirerRankingData>;

public sealed class AdminAcquirerRankingData
{
    public List<AdminAcquirerRankingItem> Items { get; set; } = [];
    public int SampleSize { get; set; }

    public List<AcquirerOperationType> OperationTypes { get; set; } = [];

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public RankingProcessingStatus Status { get; set; }

    public DateTime CalculatedAt { get; set; }
}

public sealed class AdminAcquirerRankingItem
{
    public Guid AcquirerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? LogoUrl { get; set; }
    public List<AcquirerOperationType> OperationTypes { get; set; } = [];
    public int Position { get; set; }
    public int Score { get; set; }
    public decimal ApprovalRate { get; set; }
    public int ApprovedTransactions { get; set; }
    public int FailedTransactions { get; set; }
    public int RejectedTransactions { get; set; }
    public int AnalyzedTransactions { get; set; }
}
