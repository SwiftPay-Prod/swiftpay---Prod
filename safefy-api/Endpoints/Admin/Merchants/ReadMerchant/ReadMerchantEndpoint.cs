using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Interfaces;
using safefy_api_core.Utils;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Admin.Merchants.ReadMerchant;

public sealed class ReadMerchantEndpoint(
    PrimaryDbContext dbContext,
    IStorageService storageService
) : Endpoint<ReadMerchantRequest, ReadMerchantResponse>
{
    public override void Configure()
    {
        Get("merchants/{id:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadMerchantRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new ReadMerchantResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.User)
            .Include(m => m.MerchantKyc)
                .ThenInclude(k => k!.ProofOfAddressFile)
            .Include(m => m.MerchantKyc)
                .ThenInclude(k => k!.DocumentFrontFile)
            .Include(m => m.MerchantKyc)
                .ThenInclude(k => k!.DocumentBackFile)
            .Include(m => m.MerchantKyc)
                .ThenInclude(k => k!.SelfieFile)
            .Include(m => m.MerchantKyc)
                .ThenInclude(k => k!.CnpjCardFile)
            .Include(m => m.MerchantKyc)
                .ThenInclude(k => k!.CompanyContractFile)
                .Include(m => m.MerchantAcquirers.Where(ma => ma.IsActive))
                .ThenInclude(ma => ma.Acquirer)
            .Include(m => m.MerchantKycPendingItems)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.Id, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadMerchantResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

            var activeAcquirer = merchant.MerchantAcquirers.FirstOrDefault(ma => ma.IsActive);
        var data = await AdminMerchantMapper.ToDataWithKycAsync(merchant, activeAcquirer, storageService);

        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new ReadMerchantResponse
        {
            Data = data
        }, cancellation: ct);
    }
}
