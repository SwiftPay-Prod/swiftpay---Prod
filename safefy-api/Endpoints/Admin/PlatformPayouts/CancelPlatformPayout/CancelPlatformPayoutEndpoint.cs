using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Models.Messages;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.PlatformPayouts.CancelPlatformPayout;

public sealed class CancelPlatformPayoutEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService,
    IMessagePublisher messagePublisher,
    IApiLogService apiLogService
) : Endpoint<CancelPlatformPayoutRequest, CancelPlatformPayoutResponse>
{
    public override void Configure()
    {
        Patch("platform-payouts/{id:guid}/cancel");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CancelPlatformPayoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CancelPlatformPayoutResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var payout = await dbContext.PlatformPayouts
            .Include(p => p.Items)
                .ThenInclude(i => i.Acquirer)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.Id, ct);

        if (payout == null)
        {
            await Send.ResponseAsync(new CancelPlatformPayoutResponse
            {
                Error = new("Saque da plataforma não encontrado.")
            }, 404, ct);
            return;
        }

        if (payout.Status != PlatformPayoutStatus.Processing)
        {
            await Send.ResponseAsync(new CancelPlatformPayoutResponse
            {
                Error = new($"Apenas saques em processamento podem ser cancelados. Status atual: {payout.Status}.")
            }, 400, ct);
            return;
        }

        var processingItems = payout.Items
            .Where(i => i.Status == PlatformPayoutItemStatus.Processing)
            .ToList();

        if (processingItems.Count == 0)
        {
            await Send.ResponseAsync(new CancelPlatformPayoutResponse
            {
                Error = new("Não há itens em processamento para cancelar neste saque.")
            }, 400, ct);
            return;
        }

        var reason = string.IsNullOrWhiteSpace(req.Reason)
            ? "Saque da plataforma cancelado manualmente pelo administrador."
            : req.Reason.Trim();

        var now = DateTime.UtcNow;

        foreach (var item in processingItems)
        {
            var acquirerName = item.Acquirer?.Name ?? item.AcquirerId.ToString();

            var claimed = await dbContext.PlatformPayoutItems
                .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Processing)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(i => i.Status, PlatformPayoutItemStatus.Cancelled)
                    .SetProperty(i => i.FailureReason, reason)
                    .SetProperty(i => i.ProcessedAt, item.ProcessedAt ?? now)
                    .SetProperty(i => i.CompletedAt, now), ct);

            if (claimed == 0)
            {
                continue;
            }

            var ledgerResult = await ledgerService.RecordPlatformWithdrawalFailedAsync(
                payout.Id,
                item.Id,
                item.Amount,
                $"{reason} ({acquirerName})");

            if (!ledgerResult.Success)
            {
                var rollbackReason = $"Falha ao estornar cancelamento no ledger: {ledgerResult.ErrorMessage}";
                await dbContext.PlatformPayoutItems
                    .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Cancelled)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(i => i.Status, PlatformPayoutItemStatus.Processing)
                        .SetProperty(i => i.FailureReason, rollbackReason)
                        .SetProperty(i => i.CompletedAt, (DateTime?)null), ct);

                await apiLogService.LogAsync(new ApiLogInput
                {
                    Action = ApiLogAction.CancelPlatformPayout,
                    Status = ApiLogStatus.Failed,
                    MerchantId = Guid.Empty,
                    HttpMethod = HttpContext.Request.Method,
                    Endpoint = HttpContext.Request.Path,
                    StatusCode = 500,
                    Details = $"Falha ao estornar saque da plataforma {payout.Id} no ledger: {ledgerResult.ErrorMessage}",
                    ResourceId = payout.Id,
                    ResourceType = ApiLogResourceType.Payout
                });

                await Send.ResponseAsync(new CancelPlatformPayoutResponse
                {
                    Error = new($"Erro ao estornar saldo no ledger: {ledgerResult.ErrorMessage}")
                }, 500, ct);
                return;
            }
        }

        var hasCompletedItems = await dbContext.PlatformPayoutItems
            .AnyAsync(i => i.PlatformPayoutId == payout.Id && i.Status == PlatformPayoutItemStatus.Completed, ct);

        payout.Status = hasCompletedItems ? PlatformPayoutStatus.PartiallyCompleted : PlatformPayoutStatus.Cancelled;
        payout.CompletedAt ??= now;

        await dbContext.SaveChangesAsync(ct);

        foreach (var acquirerId in processingItems.Select(i => i.AcquirerId).Distinct())
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessPlatformBalance,
                new ProcessPlatformBalanceMessage
                {
                    AcquirerId = acquirerId,
                    Environment = payout.Environment
                },
                ct);
        }

            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.CancelPlatformPayout,
                Status = ApiLogStatus.Success,
                MerchantId = Guid.Empty,
                HttpMethod = HttpContext.Request.Method,
                Endpoint = HttpContext.Request.Path,
                StatusCode = 200,
                Details = $"Saque da plataforma cancelado. Itens cancelados: {processingItems.Count}. Status final: {payout.Status}.",
                ResourceId = payout.Id,
                ResourceType = ApiLogResourceType.Payout
            });

        await Send.OkAsync(new CancelPlatformPayoutResponse
        {
            Message = "Saque da plataforma cancelado com sucesso."
        }, ct);
    }
}
