using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Admin.Users.ReadListUsers;

public sealed class ReadListUsersEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListUsersRequest, ReadListUsersResponse>
{
    public override void Configure()
    {
        Get("users");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadListUsersRequest req, CancellationToken ct)
    {
        var query = dbContext.Users.AsQueryable();
        var sortBy = (req.SortBy ?? "createdAt").Trim().ToLowerInvariant();
        var sortOrder = (req.SortOrder ?? "desc").Trim().ToLowerInvariant();
        var isAsc = sortOrder == "asc";

        if (req.Status.HasValue)
        {
            query = query.Where(u => u.Status == req.Status.Value);
        }

        if (req.Role.HasValue)
        {
            query = query.Where(u => u.Role == req.Role.Value);
        }

        if (req.WasReferred.HasValue)
        {
            query = req.WasReferred.Value
                ? query.Where(u => u.ReferredByUserId.HasValue)
                : query.Where(u => !u.ReferredByUserId.HasValue);
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(u => u.Name.ToLower().Contains(search) || u.Email.ToLower().Contains(search));
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Include(u => u.Merchants)
            .ToListAsync(ct);

        var userIds = users.Select(u => u.Id).ToList();

        var referredUsersCountByReferrerId = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.ReferredByUserId.HasValue && userIds.Contains(u.ReferredByUserId.Value))
            .GroupBy(u => u.ReferredByUserId!.Value)
            .Select(g => new
            {
                ReferrerUserId = g.Key,
                Count = g.Count()
            })
            .ToDictionaryAsync(x => x.ReferrerUserId, x => x.Count, ct);

        var paidCommissionByReferrerId = await dbContext.ReferralCommissionPayments
            .AsNoTracking()
            .Where(p => userIds.Contains(p.ReferrerUserId))
            .GroupBy(p => p.ReferrerUserId)
            .Select(g => new
            {
                ReferrerUserId = g.Key,
                TotalPaid = g.Sum(p => p.Amount)
            })
            .ToDictionaryAsync(x => x.ReferrerUserId, x => x.TotalPaid, ct);

        var estimatedCommissionByReferrerId = await dbContext.ReferralCommissionBalances
            .AsNoTracking()
            .Where(b => userIds.Contains(b.ReferrerUserId))
            .GroupBy(b => b.ReferrerUserId)
            .Select(g => new
            {
                ReferrerUserId = g.Key,
                TotalGenerated = g.Sum(x => x.TotalGenerated)
            })
            .ToDictionaryAsync(x => x.ReferrerUserId, x => x.TotalGenerated, ct);

        var generatedCommissionByReferredUserId = await dbContext.ReferralReferredUserSummaries
            .AsNoTracking()
            .Where(s => userIds.Contains(s.ReferredUserId))
            .GroupBy(s => s.ReferredUserId)
            .Select(g => new
            {
                ReferredUserId = g.Key,
                TotalGenerated = g.Sum(x => x.TotalCommissionAmount)
            })
            .ToDictionaryAsync(x => x.ReferredUserId, x => x.TotalGenerated, ct);

        var items = users.Select(user =>
        {
            var referredUsersCount = referredUsersCountByReferrerId.GetValueOrDefault(user.Id, 0);
            var paidCommissionTotal = paidCommissionByReferrerId.GetValueOrDefault(user.Id, 0);
            var estimatedCommissionTotal = estimatedCommissionByReferrerId.GetValueOrDefault(user.Id, 0);
            var availableCommissionBalance = Math.Max(estimatedCommissionTotal - paidCommissionTotal, 0);
            var generatedReferralCommission = generatedCommissionByReferredUserId.GetValueOrDefault(user.Id, 0);

            return UserMapper.ToAdminMinimalUser(
                user,
                referredUsersCount,
                availableCommissionBalance,
                generatedReferralCommission);
        }).ToList();

        items = (sortBy, isAsc) switch
        {
            ("referreduserscount", true) => items.OrderBy(u => u.ReferredUsersCount).ThenBy(u => u.CreatedAt).ToList(),
            ("referreduserscount", false) => items.OrderByDescending(u => u.ReferredUsersCount).ThenByDescending(u => u.CreatedAt).ToList(),
            ("availablecommissionbalance", true) => items.OrderBy(u => u.AvailableCommissionBalance).ThenBy(u => u.CreatedAt).ToList(),
            ("availablecommissionbalance", false) => items.OrderByDescending(u => u.AvailableCommissionBalance).ThenByDescending(u => u.CreatedAt).ToList(),
            ("generatedreferralcommission", true) => items.OrderBy(u => u.GeneratedReferralCommission).ThenBy(u => u.CreatedAt).ToList(),
            ("generatedreferralcommission", false) => items.OrderByDescending(u => u.GeneratedReferralCommission).ThenByDescending(u => u.CreatedAt).ToList(),
            (_, true) => items.OrderBy(u => u.CreatedAt).ToList(),
            _ => items.OrderByDescending(u => u.CreatedAt).ToList(),
        };

        var totalItems = items.Count;
        var totalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize);
        var pagedItems = items
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToList();

        await Send.ResponseAsync(new ReadListUsersResponse
        {
            Data = new Paginated<AdminMinimalUser>
            {
                Items = pagedItems,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = totalPages
            }
        }, cancellation: ct);
    }
}
