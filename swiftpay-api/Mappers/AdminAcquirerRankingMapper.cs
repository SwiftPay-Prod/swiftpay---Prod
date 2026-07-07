using swiftpay_api.Endpoints.Admin.Ranking.ReadAcquirerRanking;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Mappers;

public static class AdminAcquirerRankingMapper
{
    public static AdminAcquirerRankingData ToData(
        List<AdminAcquirerRankingMetricsRow> rows,
        int sampleSize,
        List<AcquirerOperationType> operationTypes,
        DateTime calculatedAt)
    {
        return new AdminAcquirerRankingData
        {
            Items = rows.Select(ToItemData).ToList(),
            SampleSize = sampleSize,
            OperationTypes = operationTypes,
            CalculatedAt = calculatedAt
        };
    }

    private static AdminAcquirerRankingItem ToItemData(AdminAcquirerRankingMetricsRow row)
    {
        return new AdminAcquirerRankingItem
        {
            AcquirerId = row.AcquirerId,
            Name = row.Name,
            DisplayName = row.DisplayName,
            LogoUrl = row.LogoUrl,
            OperationTypes = row.OperationTypes,
            Position = row.Position,
            Score = row.Score,
            ApprovalRate = row.ApprovalRate,
            ApprovedTransactions = row.ApprovedTransactions,
            FailedTransactions = row.FailedTransactions,
            RejectedTransactions = row.RejectedTransactions,
            AnalyzedTransactions = row.AnalyzedTransactions
        };
    }
}

public sealed class AdminAcquirerRankingMetricsRow
{
    public Guid AcquirerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? LogoUrl { get; set; }
    public List<swiftpay_api_core.Models.Database.AcquirerOperationType> OperationTypes { get; set; } = [];
    public int Position { get; set; }
    public int Score { get; set; }
    public decimal ApprovalRate { get; set; }
    public int ApprovedTransactions { get; set; }
    public int FailedTransactions { get; set; }
    public int RejectedTransactions { get; set; }
    public int AnalyzedTransactions { get; set; }
}
