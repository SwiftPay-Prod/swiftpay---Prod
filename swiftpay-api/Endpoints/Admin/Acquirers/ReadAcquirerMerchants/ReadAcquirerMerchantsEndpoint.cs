using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Acquirers.ReadAcquirerMerchants;

public sealed class ReadAcquirerMerchantsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadAcquirerMerchantsRequest, ReadAcquirerMerchantsResponse>
{
    public override void Configure()
    {
        Get("acquirers/{acquirerId:guid}/merchants");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadAcquirerMerchantsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadAcquirerMerchantsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var acquirerExists = await dbContext.Acquirers.AnyAsync(a => a.Id == req.AcquirerId, ct);
        if (!acquirerExists)
        {
            await Send.ResponseAsync(new ReadAcquirerMerchantsResponse
            {
                Error = new("Adquirente não encontrada.")
            }, 404, ct);
            return;
        }

        var providerCategory = await dbContext.Acquirers
            .Where(a => a.Id == req.AcquirerId)
            .Select(a => a.ProviderCategory)
            .FirstOrDefaultAsync(ct);

        var usesSubaccount = ExternalSubmerchantUtils.UsesExternalSubmerchant(providerCategory);

        var query = dbContext.MerchantAcquirers
            .Include(ma => ma.Merchant)
                .ThenInclude(m => m.MerchantKyc)
            .Where(ma => ma.AcquirerId == req.AcquirerId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(req.ExternalSubmerchantStatus))
        {
            if (!Enum.TryParse<ExternalSubmerchantStatus>(req.ExternalSubmerchantStatus, true, out var parsedStatus))
            {
                await Send.ResponseAsync(new ReadAcquirerMerchantsResponse
                {
                    Error = new("Status de submerchant inválido.")
                }, 400, ct);
                return;
            }

            query = query.Where(ma => ma.ExternalSubmerchantStatus == parsedStatus);
        }

        if (req.HasExternalSubmerchant.HasValue)
        {
            query = req.HasExternalSubmerchant.Value
                ? query.Where(ma => !string.IsNullOrWhiteSpace(ma.ExternalSubmerchantId))
                : query.Where(ma => string.IsNullOrWhiteSpace(ma.ExternalSubmerchantId));
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var searchLower = req.Search.Trim().ToLower();
            query = query.Where(ma =>
                (ma.Merchant.Name != null && ma.Merchant.Name.ToLower().Contains(searchLower)) ||
                (ma.Merchant.MerchantKyc != null && ma.Merchant.MerchantKyc.LegalName != null && ma.Merchant.MerchantKyc.LegalName.ToLower().Contains(searchLower)) ||
                (ma.Merchant.MerchantKyc != null && ma.Merchant.MerchantKyc.DocumentNumber != null && ma.Merchant.MerchantKyc.DocumentNumber.ToLower().Contains(searchLower)) ||
                (ma.ExternalSubmerchantId != null && ma.ExternalSubmerchantId.ToLower().Contains(searchLower))
            );
        }

        var totalItems = await query.CountAsync(ct);

        var items = await query
            .OrderBy(ma => ma.Merchant.Name)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(ma => new AcquirerMerchantData
            {
                MerchantAcquirerId = ma.Id,
                Id = ma.Merchant.Id,
                Name = ma.Merchant.Name,
                LegalName = ma.Merchant.MerchantKyc != null ? ma.Merchant.MerchantKyc.LegalName : null,
                DocumentNumber = ma.Merchant.MerchantKyc != null ? ma.Merchant.MerchantKyc.DocumentNumber : null,
                DocumentType = ma.Merchant.MerchantKyc != null && ma.Merchant.MerchantKyc.DocumentType != null 
                    ? ma.Merchant.MerchantKyc.DocumentType.ToString() 
                    : null,
                Status = ma.Merchant.Status.ToString(),
                IsActive = ma.IsActive,
                IsDefault = ma.IsDefault,
                UsesSubaccount = usesSubaccount,
                ExternalSubmerchantId = ma.ExternalSubmerchantId,
                ExternalSubmerchantStatus = usesSubaccount ? ma.ExternalSubmerchantStatus.ToString() : null,
                ExternalOnboardingSubmittedAt = ma.ExternalOnboardingSubmittedAt,
                ExternalOnboardingCompletedAt = ma.ExternalOnboardingCompletedAt,
                ExternalOnboardingRejectionReason = ma.ExternalOnboardingRejectionReason,
                CreatedAt = ma.CreatedAt
            })
            .ToListAsync(ct);

        await Send.OkAsync(new ReadAcquirerMerchantsResponse
        {
            Data = new Paginated<AcquirerMerchantData>
            {
                Items = items,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}
