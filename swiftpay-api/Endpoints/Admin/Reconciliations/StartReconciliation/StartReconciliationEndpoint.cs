using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.Reconciliations.StartReconciliation;

public sealed class StartReconciliationEndpoint(
    PrimaryDbContext dbContext,
    IBankReconciliationService reconciliationService
) : Endpoint<StartReconciliationRequest, StartReconciliationResponse>
{
    public override void Configure()
    {
        Post("reconciliations/start");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(StartReconciliationRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new StartReconciliationResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new StartReconciliationResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var hasActiveReconciliation = await dbContext.BankReconciliations
            .AnyAsync(r => 
                r.MerchantId == req.MerchantId && 
                (r.Status == BankReconciliationStatus.Pending ||
                 r.Status == BankReconciliationStatus.Processing), ct);

        if (hasActiveReconciliation)
        {
            await Send.ResponseAsync(new StartReconciliationResponse
            {
                Error = new("Já existe uma reconciliação em andamento para esta organização e ambiente.")
            }, 400, ct);
            return;
        }

        var reconciliation = await reconciliationService.StartReconciliationAsync(
            req.MerchantId,
            userId.Value,
            req.SilentMode);

        var message = req.SilentMode
            ? "Reconciliação iniciada em modo silencioso. Nenhuma notificação será enviada."
            : "Reconciliação iniciada com sucesso. Você será notificado quando o processamento for concluído.";

        await Send.ResponseAsync(new StartReconciliationResponse
        {
            Data = new StartReconciliationData
            {
                Id = reconciliation.Id,
                MerchantId = reconciliation.MerchantId,
                Environment = reconciliation.Environment.ToString(),
                Status = reconciliation.Status.ToString(),
                CreatedAt = reconciliation.CreatedAt
            },
            Message = message
        }, 201, ct);
    }
}
