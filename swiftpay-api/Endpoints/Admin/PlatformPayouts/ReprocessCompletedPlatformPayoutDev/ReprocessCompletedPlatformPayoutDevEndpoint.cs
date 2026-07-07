using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api.Models.PaymentApi;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.PlatformPayouts.ReprocessCompletedPlatformPayoutDev;

public sealed class ReprocessCompletedPlatformPayoutDevEndpoint(
    PrimaryDbContext dbContext,
    IPaymentApiClient paymentApiClient
) : Endpoint<ReprocessCompletedPlatformPayoutDevRequest, ReprocessCompletedPlatformPayoutDevResponse>
{
    public override void Configure()
    {
        Post("platform-payout-items/{platformPayoutItemId:guid}/dev/reprocess-completed");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReprocessCompletedPlatformPayoutDevRequest req, CancellationToken ct)
    {
        var role = EndpointUtils.GetUserRole(User);
        if (role != nameof(UserRole.God))
        {
            await Send.ForbiddenAsync(ct);
            return;
        }

        var item = await dbContext.PlatformPayoutItems
            .AsNoTracking()
            .Select(i => new { i.Id, i.PlatformPayoutId })
            .OrderBy(i => i.Id)
            .FirstOrDefaultAsync(i => i.Id == req.PlatformPayoutItemId, ct);

        if (item == null)
        {
            await Send.ResponseAsync(new ReprocessCompletedPlatformPayoutDevResponse
            {
                Error = new("Item do saque de plataforma não encontrado.")
            }, 404, ct);
            return;
        }

        var result = await paymentApiClient.ReprocessCompletedPlatformPayoutItemDevAsync(new ReprocessCompletedPlatformPayoutItemDevApiInput
        {
            PlatformPayoutItemId = req.PlatformPayoutItemId,
            TargetStatus = req.TargetStatus switch
            {
                AdminReprocessPlatformPayoutTargetStatus.Failed => ReprocessPlatformPayoutTargetStatus.Failed,
                _ => ReprocessPlatformPayoutTargetStatus.Completed
            }
        }, ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new ReprocessCompletedPlatformPayoutDevResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao reprocessar saque de plataforma.")
            }, 400, ct);
            return;
        }

        await Send.OkAsync(new ReprocessCompletedPlatformPayoutDevResponse
        {
            Data = new AdminReprocessCompletedPlatformPayoutDevData
            {
                PlatformPayoutItemId = result.PlatformPayoutItemId ?? req.PlatformPayoutItemId,
                PlatformPayoutId = result.PlatformPayoutId ?? item.PlatformPayoutId,
                Status = result.Status ?? PlatformPayoutStatus.Processing,
                ProcessedItemsCount = result.ProcessedItemsCount,
                Message = req.TargetStatus switch
                {
                    AdminReprocessPlatformPayoutTargetStatus.Failed => "Saque de plataforma reprocessado como falha com sucesso.",
                    _ => "Saque de plataforma reprocessado como concluído com sucesso."
                }
            },
            Message = "Fluxo financeiro do item do saque de plataforma reprocessado com sucesso."
        }, ct);
    }
}
