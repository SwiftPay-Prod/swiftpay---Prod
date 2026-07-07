using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api.Mappers;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.ReadMerchant;

public sealed class ReadMerchantEndpoint(
    PrimaryDbContext dbContext,
    IStorageService storageService
) : Endpoint<ReadMerchantRequest, ReadMerchantResponse>
{
    public override void Configure()
    {
        Get("{id:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadMerchantRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadMerchantResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantSettings)
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
            .Include(m => m.MerchantKycPendingItems)
            .AsSplitQuery()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.Id && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadMerchantResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status == MerchantStatus.Deleted)
        {
            await Send.ResponseAsync(new ReadMerchantResponse
            {
                Error = new("Esta organização foi excluída.")
            }, 410, ct);
            return;
        }

        var platformSettings = await dbContext.PlatformSettings.OrderBy(p => p.Id).FirstOrDefaultAsync(ct);
        var data = await MerchantMapper.ToDataWithDocumentsAsync(merchant, storageService, platformSettings);
        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new ReadMerchantResponse
        {
            Data = data
        }, cancellation: ct);
    }
}
