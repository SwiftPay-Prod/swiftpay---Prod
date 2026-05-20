using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Interfaces;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.Acquirers.SubmitMerchantSubmerchant;

public sealed class SubmitMerchantSubmerchantEndpoint(
    PrimaryDbContext dbContext,
    ISubmerchantProvisioningService submerchantProvisioningService
) : Endpoint<SubmitMerchantSubmerchantRequest, SubmitMerchantSubmerchantResponse>
{
    public override void Configure()
    {
        Post("acquirers/{acquirerId:guid}/merchants/{merchantId:guid}/submerchant/submit");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(SubmitMerchantSubmerchantRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new SubmitMerchantSubmerchantResponse
            {
                Error = new("Token invalido.")
            }, 401, ct);
            return;
        }

        var acquirer = await dbContext.Acquirers
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == req.AcquirerId, ct);

        if (acquirer == null)
        {
            await Send.ResponseAsync(new SubmitMerchantSubmerchantResponse
            {
                Error = new("Adquirente nao encontrada.")
            }, 404, ct);
            return;
        }

        var merchantAcquirer = await dbContext.MerchantAcquirers
            .Include(ma => ma.Merchant)
                .ThenInclude(m => m.MerchantKyc)
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync(ma => ma.MerchantId == req.MerchantId && ma.AcquirerId == req.AcquirerId, ct);

        if (merchantAcquirer == null)
        {
            await Send.ResponseAsync(new SubmitMerchantSubmerchantResponse
            {
                Error = new("Vinculo da organizacao com a adquirente nao encontrado.")
            }, 404, ct);
            return;
        }

        var merchant = merchantAcquirer.Merchant;
        if (merchant == null)
        {
            await Send.ResponseAsync(new SubmitMerchantSubmerchantResponse
            {
                Error = new("Organizacao nao encontrada para o vinculo informado.")
            }, 404, ct);
            return;
        }

        var submitResult = await submerchantProvisioningService.EnsureSubmerchantProvisionedAsync(
            merchant,
            merchantAcquirer,
            acquirer,
            forceResubmit: req.ForceResubmit,
            ct: ct);

        if (!submitResult.Success)
        {
            await Send.ResponseAsync(new SubmitMerchantSubmerchantResponse
            {
                Error = new(submitResult.ErrorMessage ?? "Falha ao reenviar submerchant para a processadora.")
            }, 400, ct);
            return;
        }

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new SubmitMerchantSubmerchantResponse
        {
            Data = new SubmitMerchantSubmerchantData
            {
                MerchantAcquirerId = merchantAcquirer.Id,
                ExternalSubmerchantId = merchantAcquirer.ExternalSubmerchantId ?? string.Empty,
                Status = merchantAcquirer.ExternalSubmerchantStatus,
                RejectionReason = merchantAcquirer.ExternalOnboardingRejectionReason
            }
        }, ct);
    }
}
