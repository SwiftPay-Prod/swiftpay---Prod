using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Users.ReadReferredUserMovements;

public sealed class ReadReferredUserMovementsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadReferredUserMovementsRequest, ReadReferredUserMovementsResponse>
{
    public override void Configure()
    {
        Get("users/{userId:guid}/referrals/referred-users/{referredUserId:guid}/movements");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadReferredUserMovementsRequest req, CancellationToken ct)
    {
        var referredUser = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == req.ReferredUserId && u.ReferredByUserId == req.UserId)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Status,
                u.ReferredAt
            })
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (referredUser == null)
        {
            await Send.ResponseAsync(new ReadReferredUserMovementsResponse
            {
                Error = new("Usuário indicado não encontrado.")
            }, 404, ct);
            return;
        }

        var page = req.Page < 1 ? 1 : req.Page;
        var pageSize = req.PageSize < 1 ? 10 : req.PageSize > 100 ? 100 : req.PageSize;

        var movementsBaseQuery = dbContext.ReferralCommissionMovements
            .AsNoTracking()
            .Where(m => m.ReferrerUserId == req.UserId && m.ReferredUserId == req.ReferredUserId);

        var totalItems = await movementsBaseQuery.CountAsync(ct);
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

        var movements = await movementsBaseQuery
            .OrderByDescending(m => m.OccurredAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new AdminReferralCommissionMovementData
            {
                Id = m.Id,
                SourceType = m.SourceType,
                SourceId = m.SourceId,
                ReferralCommissionPercentage = m.ReferralCommissionPercentage,
                CommissionAmount = m.CommissionAmount,
                OccurredAt = m.OccurredAt,
                Description = m.Description
            })
            .ToListAsync(ct);

        var totalsBySource = await movementsBaseQuery
            .GroupBy(m => m.SourceType)
            .Select(g => new
            {
                SourceType = g.Key,
                TotalCommission = g.Sum(x => x.CommissionAmount)
            })
            .ToListAsync(ct);

        var totalCommissionFromPayments = totalsBySource
            .Where(x => x.SourceType == ReferralCommissionMovementSourceType.Payment)
            .Sum(x => x.TotalCommission);

        var totalCommissionFromPayouts = totalsBySource
            .Where(x => x.SourceType == ReferralCommissionMovementSourceType.Payout)
            .Sum(x => x.TotalCommission);

        await Send.OkAsync(new ReadReferredUserMovementsResponse
        {
            Data = new AdminReferredUserMovementsData
            {
                ReferrerUserId = req.UserId,
                ReferredUserId = referredUser.Id,
                ReferredUserName = referredUser.Name,
                ReferredUserEmail = referredUser.Email,
                ReferredUserStatus = referredUser.Status,
                ReferredAt = referredUser.ReferredAt,
                TotalCommissionFromPayments = totalCommissionFromPayments,
                TotalCommissionFromPayouts = totalCommissionFromPayouts,
                TotalCommissionAmount = totalCommissionFromPayments + totalCommissionFromPayouts,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
                Movements = movements
            }
        }, ct);
    }
}
