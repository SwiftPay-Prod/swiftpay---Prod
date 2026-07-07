using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;

namespace swiftpay_api.Endpoints.Admin.Balance.RefreshPlatformBalance;

public sealed class RefreshPlatformBalanceEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider,
    IMessagePublisher messagePublisher
) : EndpointWithoutRequest<RefreshPlatformBalanceResponse>
{
    public override void Configure()
    {
        Post("/balance/refresh");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RefreshPlatformBalanceResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var environment = environmentProvider.CurrentEnvironment;

        var caches = await dbContext.PlatformBalanceCaches
            .Where(c => c.Environment == environment)
            .ToListAsync(ct);

        foreach (var cache in caches)
        {
            cache.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
            cache.NextProcessAt = null;
            cache.IsProcessing = false;
        }

        await dbContext.SaveChangesAsync(ct);

        var acquirerIds = await dbContext.Acquirers
            .Where(a => a.IsActive)
            .Select(a => a.Id)
            .ToListAsync(ct);

        foreach (var acquirerId in acquirerIds)
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessPlatformBalance,
                new ProcessPlatformBalanceMessage
                {
                    AcquirerId = acquirerId,
                    Environment = environment
                },
                ct);
        }

        await Send.OkAsync(new RefreshPlatformBalanceResponse
        {
            Message = "Recálculo de saldo iniciado. Os saldos serão atualizados em breve."
        }, ct);
    }
}
