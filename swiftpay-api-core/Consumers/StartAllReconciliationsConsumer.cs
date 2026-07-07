using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Services;

namespace swiftpay_api_core.Consumers;

public sealed class StartAllReconciliationsConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<StartAllReconciliationsConsumer> logger
) : IConsumer<StartAllReconciliationsMessage>
{
    public async Task Consume(ConsumeContext<StartAllReconciliationsMessage> context)
    {
        var message = context.Message;

        using var environmentScope = HybridEnvironmentProvider.SetEnvironment(message.Environment);
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var reconciliationService = scope.ServiceProvider.GetRequiredService<IBankReconciliationService>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var merchants = await dbContext.Merchants
            .Where(m => m.Status == MerchantStatus.Active)
            .Where(m => dbContext.Accounts.Any(a => a.MerchantId == m.Id))
            .Select(m => new { m.Id, m.Name })
            .ToListAsync(context.CancellationToken);

        if (merchants.Count == 0)
        {
            await notificationService.CreateUserNotificationAsync(
                message.RequestedByUserId,
                NotificationType.Info,
                "Reconciliação em lote",
                "Nenhum merchant ativo encontrado para reconciliar.",
                actionUrl: "/panel/admin/reconciliations");
            return;
        }

        var batchId = Guid.CreateVersion7();
        var queued = 0;
        var skipped = 0;

        foreach (var merchant in merchants)
        {
            try
            {
                var hasPending = await dbContext.BankReconciliations
                    .AnyAsync(br =>
                        br.MerchantId == merchant.Id &&
                        (br.Status == BankReconciliationStatus.Pending ||
                         br.Status == BankReconciliationStatus.Processing), CancellationToken.None);

                if (hasPending)
                {
                    skipped++;
                    continue;
                }

                await reconciliationService.StartReconciliationAsync(
                    merchant.Id,
                    message.RequestedByUserId,
                    message.SilentMode,
                    batchId);

                queued++;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error queueing reconciliation for merchant {MerchantId}", merchant.Id);
            }
        }

        if (queued == 0)
        {
            var reason = skipped > 0
                ? $"{skipped} merchant(s) já com reconciliação em andamento."
                : "Nenhuma reconciliação precisou ser iniciada.";

            await notificationService.CreateUserNotificationAsync(
                message.RequestedByUserId,
                NotificationType.Info,
                "Reconciliação em lote",
                reason,
                actionUrl: "/panel/admin/reconciliations");
        }
    }
}
