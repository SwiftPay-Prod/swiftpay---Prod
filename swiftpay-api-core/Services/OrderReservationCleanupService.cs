using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Services;

public class OrderReservationCleanupService(
    IServiceScopeFactory scopeFactory,
    ILogger<OrderReservationCleanupService> logger
) : BackgroundService
{
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(2);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiredReservationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing expired order reservations");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task ProcessExpiredReservationsAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var stockService = scope.ServiceProvider.GetRequiredService<IStockService>();

        var expiredOrders = await dbContext.Orders
            .IgnoreQueryFilters()
            .Where(o => o.Status == OrderStatus.Reserved)
            .Where(o => o.ExpiresAt != null && o.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync(ct);

        foreach (var order in expiredOrders)
        {
            try
            {
                await stockService.ReleaseReservationAsync(
                    order.Id,
                    "Reserva expirada automaticamente",
                    ct);

                await stockService.ReleaseDigitalItemsAsync(order.Id, ct);

                order.Status = OrderStatus.Expired;
                order.UpdatedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error releasing reservation for order {OrderId}", order.Id);
            }
        }

        if (expiredOrders.Count > 0)
            await dbContext.SaveChangesAsync(ct);
    }
}
