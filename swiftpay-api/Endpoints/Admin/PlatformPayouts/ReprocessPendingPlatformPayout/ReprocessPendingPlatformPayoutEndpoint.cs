using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Models.Messages;

namespace safefy_api.Endpoints.Admin.PlatformPayouts.ReprocessPendingPlatformPayout;

public sealed class ReprocessPendingPlatformPayoutEndpoint(
    PrimaryDbContext dbContext,
    IMessagePublisher messagePublisher,
    IApiLogService apiLogService
) : Endpoint<ReprocessPendingPlatformPayoutRequest, ReprocessPendingPlatformPayoutResponse>
{
    public override void Configure()
    {
        Patch("platform-payouts/{id:guid}/reprocess-pending");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReprocessPendingPlatformPayoutRequest req, CancellationToken ct)
    {
        var payout = await dbContext.PlatformPayouts
            .AsNoTracking()
            .Include(p => p.Items)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.Id, ct);

        if (payout == null)
        {
            await Send.ResponseAsync(new ReprocessPendingPlatformPayoutResponse
            {
                Error = new("Saque da plataforma não encontrado.")
            }, 404, ct);
            return;
        }

        var pendingItems = payout.Items
            .Where(i => i.Status == PlatformPayoutItemStatus.Processing)
            .ToList();

        if (pendingItems.Count == 0)
        {
            await Send.ResponseAsync(new ReprocessPendingPlatformPayoutResponse
            {
                Error = new("Não há itens pendentes em processamento para reenfileirar.")
            }, 400, ct);
            return;
        }

        var republished = 0;

        foreach (var item in pendingItems)
        {
            try
            {
                await messagePublisher.PublishAsync(
                    RabbitMQQueues.ProcessPlatformPayoutItem,
                    new ProcessPlatformPayoutItemMessage
                    {
                        PlatformPayoutId = payout.Id,
                        PlatformPayoutItemId = item.Id,
                        AcquirerId = item.AcquirerId,
                        Environment = payout.Environment
                    },
                    ct);

                republished++;
            }
            catch
            {
                await apiLogService.LogAsync(new ApiLogInput
                {
                    Action = ApiLogAction.ReprocessPlatformPayout,
                    Status = ApiLogStatus.Failed,
                    MerchantId = Guid.Empty,
                    HttpMethod = HttpContext.Request.Method,
                    Endpoint = HttpContext.Request.Path,
                    StatusCode = 500,
                    ResourceId = payout.Id,
                    ResourceType = ApiLogResourceType.Payout,
                    Details = $"Falha ao reenfileirar item pendente do saque da plataforma. ItemId={item.Id}."
                });
            }
        }

        if (republished == 0)
        {
            await Send.ResponseAsync(new ReprocessPendingPlatformPayoutResponse
            {
                Error = new("Falha ao reenfileirar itens pendentes do saque da plataforma.")
            }, 500, ct);
            return;
        }

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.ReprocessPlatformPayout,
            Status = ApiLogStatus.Success,
            MerchantId = Guid.Empty,
            HttpMethod = HttpContext.Request.Method,
            Endpoint = HttpContext.Request.Path,
            StatusCode = 200,
            ResourceId = payout.Id,
            ResourceType = ApiLogResourceType.Payout,
            Details = $"Itens pendentes reenfileirados para saque da plataforma. Total={pendingItems.Count}, Reenfileirados={republished}."
        });

        await Send.OkAsync(new ReprocessPendingPlatformPayoutResponse
        {
            Data = new AdminReprocessPendingPlatformPayoutData
            {
                PlatformPayoutId = payout.Id,
                Environment = payout.Environment,
                TotalPendingItems = pendingItems.Count,
                RepublishedItems = republished
            },
            Message = republished == pendingItems.Count
                ? "Itens pendentes reenfileirados com sucesso."
                : "Reenfileiramento parcial concluído. Verifique os logs de auditoria para detalhes."
        }, ct);
    }
}
