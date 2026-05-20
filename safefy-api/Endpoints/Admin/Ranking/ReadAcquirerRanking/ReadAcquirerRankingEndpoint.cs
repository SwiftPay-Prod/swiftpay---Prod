using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;
using safefy_api_core.Database;

namespace safefy_api.Endpoints.Admin.Ranking.ReadAcquirerRanking;

public sealed class ReadAcquirerRankingEndpoint(
    PrimaryDbContext dbContext,
    IRankingProcessingStatusService rankingProcessingStatusService
) : Endpoint<ReadAcquirerRankingRequest, ReadAcquirerRankingResponse>
{
    private const int RankingSampleSize = 1000;

    public override void Configure()
    {
        Get("ranking/acquirers");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadAcquirerRankingRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadAcquirerRankingResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var selectedOperationTypes = ParseOperationTypes(req.OperationTypes);

        var cachedRanking = await dbContext.AcquirerRankingCaches
            .AsNoTracking()
            .Include(r => r.Acquirer)
            .OrderBy(r => r.Position)
            .ToListAsync(ct);

        var filteredRows = cachedRanking
            .Where(r => selectedOperationTypes.Count == 0 || r.Acquirer.OperationTypes.Any(selectedOperationTypes.Contains))
            .ToList();

        var rankedRows = filteredRows
            .Select((row, index) => new AdminAcquirerRankingMetricsRow
            {
                AcquirerId = row.AcquirerId,
                Name = row.Acquirer.Name,
                DisplayName = row.Acquirer.DisplayName,
                LogoUrl = row.Acquirer.LogoUrl,
                OperationTypes = row.Acquirer.OperationTypes,
                Position = index + 1,
                Score = AcquirerRankingScoreCalculator.Calculate(
                    row.ApprovedTransactions,
                    row.AnalyzedTransactions,
                    row.RejectedTransactions,
                    RankingSampleSize).Score,
                ApprovalRate = row.ApprovalRate,
                ApprovedTransactions = row.ApprovedTransactions,
                FailedTransactions = row.RejectedTransactions,
                RejectedTransactions = row.RejectedTransactions,
                AnalyzedTransactions = row.AnalyzedTransactions
            })
            .ToList();

        var calculatedAt = filteredRows.Count > 0
            ? filteredRows.Max(x => x.CalculatedAt)
            : DateTime.UtcNow;

        var sampleSize = filteredRows.Count > 0
            ? filteredRows.Max(x => x.SampleSize)
            : RankingSampleSize;

        var responseData = AdminAcquirerRankingMapper.ToData(rankedRows, sampleSize, selectedOperationTypes, calculatedAt);
        responseData.Status = await rankingProcessingStatusService.GetAcquirerStatusAsync(ApiEnvironment.Production, ct);

        await Send.OkAsync(new ReadAcquirerRankingResponse
        {
            Data = responseData
        }, ct);
    }

    private static List<AcquirerOperationType> ParseOperationTypes(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return [AcquirerOperationType.Black, AcquirerOperationType.White];
        }

        var result = new HashSet<AcquirerOperationType>();
        var parts = value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var part in parts)
        {
            if (Enum.TryParse<AcquirerOperationType>(part, true, out var parsed))
            {
                result.Add(parsed);
            }
        }

        return result.Count > 0
            ? result.ToList()
            : [AcquirerOperationType.Black, AcquirerOperationType.White];
    }
}
