using Hangfire.Common;
using Hangfire.Server;
using StackExchange.Redis;

namespace swiftpay_api.Filters;

/// <summary>
/// Hangfire server filter that prevents concurrent execution of the same job
/// using a Redis distributed lock.
/// </summary>
public sealed class SkipConcurrentExecutionFilter(
    IConnectionMultiplexer redis,
    TimeSpan lockTimeout
) : IServerFilter
{
    private const string LockKeyPrefix = "hangfire:lock:";
    private const string LockValueKey = "DistributedLockValue";

    public void OnPerforming(PerformingContext context)
    {
        var jobName = context.BackgroundJob.Job.Method.Name;
        var lockKey = $"{LockKeyPrefix}{jobName}";
        var lockValue = Guid.NewGuid().ToString("N");

        var db = redis.GetDatabase();
        var acquired = db.StringSet(lockKey, lockValue, lockTimeout, When.NotExists);

        if (!acquired)
        {
            context.Canceled = true;
            return;
        }

        context.Items[LockValueKey] = lockValue;
    }

    public void OnPerformed(PerformedContext context)
    {
        var jobName = context.BackgroundJob.Job.Method.Name;
        var lockKey = $"{LockKeyPrefix}{jobName}";

        if (context.Items.TryGetValue(LockValueKey, out var value) && value is string lockValue)
        {
            var db = redis.GetDatabase();
            var script = """
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
            """;
            db.ScriptEvaluate(script, [new RedisKey(lockKey)], [new RedisValue(lockValue)]);
        }
    }
}
