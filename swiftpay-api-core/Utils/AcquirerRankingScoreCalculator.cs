namespace swiftpay_api_core.Utils;

public static class AcquirerRankingScoreCalculator
{
    private const int ApprovalRateWeight = 10;
    private const int AnalyzedTransactionsWeight = 5;
    private const int FailureRateWeight = 5;

    public static AcquirerRankingScoreResult Calculate(
        int approvedTransactions,
        int analyzedTransactions,
        int failedTransactions,
        int maxSampleSize)
    {
        if (analyzedTransactions <= 0 || maxSampleSize <= 0)
        {
            return new AcquirerRankingScoreResult(0, 0, 0);
        }

        var approvalRate = MathUtils.CalculatePercentage(approvedTransactions, analyzedTransactions);
        var failureRate = MathUtils.CalculatePercentage(failedTransactions, analyzedTransactions);

        var approvalNormalized = approvalRate / 100m;
        var analyzedTransactionsNormalized = Math.Clamp((decimal)analyzedTransactions / maxSampleSize, 0m, 1m);
        var inverseFailureNormalized = 1m - (failureRate / 100m);

        var weightedScore =
            approvalNormalized * ApprovalRateWeight
            + analyzedTransactionsNormalized * AnalyzedTransactionsWeight
            + inverseFailureNormalized * FailureRateWeight;

        var totalWeight = ApprovalRateWeight + AnalyzedTransactionsWeight + FailureRateWeight;
        var normalizedScore = weightedScore / totalWeight;
        var score = (int)Math.Round(normalizedScore * 1000m, MidpointRounding.AwayFromZero);

        return new AcquirerRankingScoreResult(
            approvalRate,
            failureRate,
            Math.Clamp(score, 0, 1000));
    }
}

public readonly record struct AcquirerRankingScoreResult(
    decimal ApprovalRate,
    decimal FailureRate,
    int Score);