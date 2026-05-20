using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Referrals.ReadListReferrals;

public sealed class ReadListReferralsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListReferralsRequest, ReadListReferralsResponse>
{
    public override void Configure()
    {
        Get("referrals");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadListReferralsRequest req, CancellationToken ct)
    {
        var query = dbContext.Users
            .AsNoTracking()
            .Where(u => u.ReferredByUserId.HasValue)
            .AsQueryable();

        if (req.ReferrerUserId.HasValue)
        {
            query = query.Where(u => u.ReferredByUserId == req.ReferrerUserId.Value);
        }

        if (req.ReferredUserStatus.HasValue)
        {
            query = query.Where(u => u.Status == req.ReferredUserStatus.Value);
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.Trim().ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(search)
                || u.Email.ToLower().Contains(search)
                || (u.ReferredByUser != null && u.ReferredByUser.Name.ToLower().Contains(search))
                || (u.ReferredByUser != null && u.ReferredByUser.Email.ToLower().Contains(search)));
        }

        var referredUsers = await query
            .OrderByDescending(u => u.ReferredAt ?? u.CreatedAt)
            .Select(u => new AdminReferredUserProjection
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Status = u.Status,
                ReferredAt = u.ReferredAt,
                ReferrerUserId = u.ReferredByUserId!.Value,
                ReferrerName = u.ReferredByUser != null ? u.ReferredByUser.Name : string.Empty,
                ReferrerEmail = u.ReferredByUser != null ? u.ReferredByUser.Email : string.Empty
            })
            .ToListAsync(ct);

        var referredUserIds = referredUsers.Select(u => u.Id).ToList();

        var summariesByReferredUserId = new Dictionary<Guid, (long TotalPayments, long TotalPayouts, long Total)>(referredUserIds.Count);

        if (referredUserIds.Count > 0)
        {
            var groupedSummaries = await dbContext.ReferralReferredUserSummaries
                .AsNoTracking()
                .Where(s => referredUserIds.Contains(s.ReferredUserId))
                .GroupBy(s => s.ReferredUserId)
                .Select(g => new
                {
                    ReferredUserId = g.Key,
                    TotalCommissionFromPayments = g.Sum(x => x.TotalCommissionFromPayments),
                    TotalCommissionFromPayouts = g.Sum(x => x.TotalCommissionFromPayouts),
                    TotalCommissionAmount = g.Sum(x => x.TotalCommissionAmount)
                })
                .ToListAsync(ct);

            foreach (var groupedSummary in groupedSummaries)
            {
                summariesByReferredUserId[groupedSummary.ReferredUserId] = (
                    groupedSummary.TotalCommissionFromPayments,
                    groupedSummary.TotalCommissionFromPayouts,
                    groupedSummary.TotalCommissionAmount);
            }
        }

        foreach (var referredUser in referredUsers)
        {
            if (summariesByReferredUserId.TryGetValue(referredUser.Id, out var summaryByUser))
            {
                referredUser.EstimatedCommissionFromPayments = summaryByUser.TotalPayments;
                referredUser.EstimatedCommissionFromPayouts = summaryByUser.TotalPayouts;
                referredUser.EstimatedCommissionTotal = summaryByUser.Total;
                continue;
            }

            referredUser.EstimatedCommissionFromPayments = 0;
            referredUser.EstimatedCommissionFromPayouts = 0;
            referredUser.EstimatedCommissionTotal = 0;
        }

        var totalItems = referredUsers.Count;
        var totalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize);

        var pagedItems = referredUsers
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(AdminReferralMapper.ToMinimalData)
            .ToList();

        var summary = new AdminReferralsSummaryData
        {
            TotalReferredUsers = totalItems,
            TotalReferrers = referredUsers
                .Select(u => u.ReferrerUserId)
                .Distinct()
                .Count(),
            TotalEstimatedCommissionFromPayments = referredUsers.Sum(u => u.EstimatedCommissionFromPayments),
            TotalEstimatedCommissionFromPayouts = referredUsers.Sum(u => u.EstimatedCommissionFromPayouts),
            TotalEstimatedCommission = referredUsers.Sum(u => u.EstimatedCommissionTotal)
        };

        await Send.OkAsync(new ReadListReferralsResponse
        {
            Data = new AdminReferralsData
            {
                Summary = summary,
                ReferredUsers = new Paginated<AdminMinimalReferredUser>
                {
                    Items = pagedItems,
                    TotalItems = totalItems,
                    Page = req.Page,
                    PageSize = req.PageSize,
                    TotalPages = totalPages
                }
            }
        }, ct);
    }
}
