using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Acquirers.RefreshMerchantSubmerchantStatus;

public sealed class RefreshMerchantSubmerchantStatusEndpoint(
    PrimaryDbContext dbContext,
    ISubmerchantProvisioningService submerchantProvisioningService
) : Endpoint<RefreshMerchantSubmerchantStatusRequest, RefreshMerchantSubmerchantStatusResponse>
{
    public override void Configure()
    {
        Post("acquirers/{acquirerId:guid}/merchant-acquirers/{merchantAcquirerId:guid}/submerchant/refresh-status");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(RefreshMerchantSubmerchantStatusRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RefreshMerchantSubmerchantStatusResponse
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
            await Send.ResponseAsync(new RefreshMerchantSubmerchantStatusResponse
            {
                Error = new("Adquirente nao encontrada.")
            }, 404, ct);
            return;
        }

        var merchantAcquirer = await dbContext.MerchantAcquirers
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync(ma => ma.Id == req.MerchantAcquirerId && ma.AcquirerId == req.AcquirerId, ct);

        if (merchantAcquirer == null)
        {
            await Send.ResponseAsync(new RefreshMerchantSubmerchantStatusResponse
            {
                Error = new("Vinculo da organizacao com a adquirente nao encontrado.")
            }, 404, ct);
            return;
        }

        var refreshResult = await submerchantProvisioningService.RefreshSubmerchantStatusAsync(
            merchantAcquirer,
            acquirer,
            ct);

        if (!refreshResult.Success)
        {
            await Send.ResponseAsync(new RefreshMerchantSubmerchantStatusResponse
            {
                Error = new(refreshResult.ErrorMessage ?? "Falha ao consultar status da subconta na processadora.")
            }, 400, ct);
            return;
        }

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new RefreshMerchantSubmerchantStatusResponse
        {
            Data = new RefreshMerchantSubmerchantStatusData
            {
                MerchantAcquirerId = refreshResult.MerchantAcquirerId,
                ExternalSubmerchantId = refreshResult.ExternalSubmerchantId,
                Status = refreshResult.Status,
                LegalName = refreshResult.LegalName,
                DocumentType = refreshResult.DocumentType,
                DocumentNumber = refreshResult.DocumentNumber,
                CreatedAt = refreshResult.CreatedAt,
                UpdatedAt = refreshResult.UpdatedAt,
                RejectionReason = refreshResult.RejectionReason
            }
        }, ct);
    }
}
