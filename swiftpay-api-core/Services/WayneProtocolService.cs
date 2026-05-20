using System.Text.Json;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Services;

public sealed class WayneProtocolService(
    PrimaryDbContext dbContext
) : IWayneProtocolService
{
    private const int MinCycleVolume = 1;
    private const int MaxCycleVolume = 100000;
    private const int MinSamplingRate = 0;
    private const int MaxSamplingRate = 100;

    public async Task<WayneProtocolConfig> GetConfigAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        var entity = await dbContext.SystemInternalConfigs
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Key == WayneProtocolConstants.ConfigKey && x.Environment == environment, ct);

        return entity == null
            ? new WayneProtocolConfig(false, 100, 0)
            : ParseConfig(entity.JsonValue);
    }

    public async Task<WayneProtocolConfig> UpsertConfigAsync(
        ApiEnvironment environment,
        bool isEnabled,
        int cycleVolume,
        int samplingRatePercent,
        Guid updatedByUserId,
        CancellationToken ct = default)
    {
        ValidateConfig(cycleVolume, samplingRatePercent);

        var normalized = new WayneProtocolConfig(isEnabled, cycleVolume, samplingRatePercent);
        var now = DateTime.UtcNow;

        var entity = await dbContext.SystemInternalConfigs
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Key == WayneProtocolConstants.ConfigKey && x.Environment == environment, ct);

        if (entity == null)
        {
            entity = new SystemInternalConfig
            {
                Id = Guid.CreateVersion7(),
                Key = WayneProtocolConstants.ConfigKey,
                Environment = environment,
                JsonValue = JsonSerializer.Serialize(normalized),
                UpdatedByUserId = updatedByUserId,
                CreatedAt = now,
                UpdatedAt = now
            };

            dbContext.SystemInternalConfigs.Add(entity);
        }
        else
        {
            entity.JsonValue = JsonSerializer.Serialize(normalized);
            entity.UpdatedByUserId = updatedByUserId;
            entity.UpdatedAt = now;
        }

        await dbContext.SaveChangesAsync(ct);
        return normalized;
    }

    public async Task<WayneProtocolDecision> EvaluateAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        var config = await GetConfigAsync(environment, ct);
        if (!config.IsEnabled || config.CycleVolume <= 0 || config.SamplingRatePercent <= 0)
        {
            return new WayneProtocolDecision(false, 0, 0, config.CycleVolume, config.SamplingRatePercent, 0);
        }

        var targetInCycle = (int)Math.Floor(config.CycleVolume * (config.SamplingRatePercent / 100m));
        if (targetInCycle <= 0)
            targetInCycle = 1;

        await using var tx = await dbContext.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, ct);

        var state = await dbContext.WayneProtocolCycleStates
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Environment == environment, ct);

        if (state == null)
        {
            state = new WayneProtocolCycleState
            {
                Environment = environment,
                CycleNumber = 1,
                PositionInCycle = 0,
                MarkedInCycle = 0,
                UpdatedAt = DateTime.UtcNow
            };

            dbContext.WayneProtocolCycleStates.Add(state);
            await dbContext.SaveChangesAsync(ct);
        }

        var currentPosition = state.PositionInCycle + 1;
        var remainingPositions = config.CycleVolume - state.PositionInCycle;
        var remainingTargets = targetInCycle - state.MarkedInCycle;

        var apply = remainingTargets > 0 && (remainingTargets >= remainingPositions
            || RandomNumberGenerator.GetInt32(remainingPositions) < remainingTargets);

        state.PositionInCycle = currentPosition;
        if (apply)
            state.MarkedInCycle += 1;

        var decision = new WayneProtocolDecision(
            apply,
            state.CycleNumber,
            currentPosition,
            config.CycleVolume,
            config.SamplingRatePercent,
            targetInCycle);

        if (state.PositionInCycle >= config.CycleVolume)
        {
            state.CycleNumber += 1;
            state.PositionInCycle = 0;
            state.MarkedInCycle = 0;
        }

        state.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return decision;
    }

    private static WayneProtocolConfig ParseConfig(string json)
    {
        try
        {
            var parsed = JsonSerializer.Deserialize<WayneProtocolConfig>(json);
            if (parsed == null)
                return new WayneProtocolConfig(false, 100, 0);

            var cycleVolume = Math.Clamp(parsed.CycleVolume, MinCycleVolume, MaxCycleVolume);
            var samplingRate = Math.Clamp(parsed.SamplingRatePercent, MinSamplingRate, MaxSamplingRate);
            return parsed with { CycleVolume = cycleVolume, SamplingRatePercent = samplingRate };
        }
        catch
        {
            return new WayneProtocolConfig(false, 100, 0);
        }
    }

    private static void ValidateConfig(int cycleVolume, int samplingRatePercent)
    {
        if (cycleVolume < MinCycleVolume || cycleVolume > MaxCycleVolume)
            throw new ArgumentOutOfRangeException(nameof(cycleVolume));

        if (samplingRatePercent < MinSamplingRate || samplingRatePercent > MaxSamplingRate)
            throw new ArgumentOutOfRangeException(nameof(samplingRatePercent));
    }
}
