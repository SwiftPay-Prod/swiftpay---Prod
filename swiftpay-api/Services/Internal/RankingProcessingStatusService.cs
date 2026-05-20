using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Interfaces;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Services.Internal;

public sealed class RankingProcessingStatusService : IRankingProcessingStatusService
{
    private const string VolumeKeyPrefix = "ranking:processing:volume";
    private const string ReferralKey = "ranking:processing:referral";
    private const string AcquirerKey = "ranking:processing:acquirer";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly PrimaryDbContext dbContext;

    public RankingProcessingStatusService(PrimaryDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public Task MarkVolumeQueuedAsync(ApiEnvironment environment, RankingPeriod period, CancellationToken ct = default)
    {
        return UpdateCounterAsync(GetVolumeKey(period), environment, 1, ct);
    }

    public Task MarkVolumeCompletedAsync(ApiEnvironment environment, RankingPeriod period, CancellationToken ct = default)
    {
        return UpdateCounterAsync(GetVolumeKey(period), environment, -1, ct);
    }

    public Task<RankingProcessingStatus> GetVolumeStatusAsync(ApiEnvironment environment, RankingPeriod period, CancellationToken ct = default)
    {
        return GetStatusAsync(GetVolumeKey(period), environment, ct);
    }

    public Task MarkReferralQueuedAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        return UpdateCounterAsync(ReferralKey, environment, 1, ct);
    }

    public Task MarkReferralCompletedAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        return UpdateCounterAsync(ReferralKey, environment, -1, ct);
    }

    public Task<RankingProcessingStatus> GetReferralStatusAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        return GetStatusAsync(ReferralKey, environment, ct);
    }

    public Task MarkAcquirerQueuedAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        return UpdateCounterAsync(AcquirerKey, environment, 1, ct);
    }

    public Task MarkAcquirerCompletedAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        return UpdateCounterAsync(AcquirerKey, environment, -1, ct);
    }

    public Task<RankingProcessingStatus> GetAcquirerStatusAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        return GetStatusAsync(AcquirerKey, environment, ct);
    }

    private async Task UpdateCounterAsync(string key, ApiEnvironment environment, int delta, CancellationToken ct)
    {
        for (var attempt = 0; attempt < 2; attempt++)
        {
            var now = DateTime.UtcNow;

            var entity = await dbContext.SystemInternalConfigs
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.Key == key && c.Environment == environment, ct);

            if (entity == null)
            {
                var initialCount = Math.Max(0, delta);
                dbContext.SystemInternalConfigs.Add(new SystemInternalConfig
                {
                    Id = Guid.CreateVersion7(),
                    Key = key,
                    Environment = environment,
                    JsonValue = SerializeState(new RankingProcessingState(initialCount)),
                    UpdatedByUserId = Guid.Empty,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }
            else
            {
                var state = ParseState(entity.JsonValue);
                var nextCount = Math.Max(0, state.ProcessingCount + delta);

                entity.JsonValue = SerializeState(state with { ProcessingCount = nextCount });
                entity.UpdatedByUserId = Guid.Empty;
                entity.UpdatedAt = now;
            }

            try
            {
                await dbContext.SaveChangesAsync(ct);
                return;
            }
            catch (DbUpdateException) when (attempt == 0)
            {
                dbContext.ChangeTracker.Clear();
            }
        }
    }

    private async Task<RankingProcessingStatus> GetStatusAsync(string key, ApiEnvironment environment, CancellationToken ct)
    {
        var entity = await dbContext.SystemInternalConfigs
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Key == key && c.Environment == environment, ct);

        var processingCount = ParseState(entity?.JsonValue).ProcessingCount;
        return processingCount > 0
            ? RankingProcessingStatus.Processing
            : RankingProcessingStatus.Completed;
    }

    private static string GetVolumeKey(RankingPeriod period)
    {
        return $"{VolumeKeyPrefix}:{period}";
    }

    private static RankingProcessingState ParseState(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new RankingProcessingState(0);

        try
        {
            return JsonSerializer.Deserialize<RankingProcessingState>(json, JsonOptions) ?? new RankingProcessingState(0);
        }
        catch
        {
            return new RankingProcessingState(0);
        }
    }

    private static string SerializeState(RankingProcessingState state)
    {
        return JsonSerializer.Serialize(state, JsonOptions);
    }

    private sealed record RankingProcessingState(int ProcessingCount);
}
