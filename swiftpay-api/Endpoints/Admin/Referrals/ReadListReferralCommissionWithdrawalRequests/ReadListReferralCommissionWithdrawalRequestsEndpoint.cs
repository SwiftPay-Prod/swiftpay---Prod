using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Referrals.ReadListReferralCommissionWithdrawalRequests;

public sealed class ReadListReferralCommissionWithdrawalRequestsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListReferralCommissionWithdrawalRequestsRequest, ReadListReferralCommissionWithdrawalRequestsResponse>
{
    public override void Configure()
    {
        Get("referrals/withdrawal-requests");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadListReferralCommissionWithdrawalRequestsRequest req, CancellationToken ct)
    {
        var query = dbContext.ReferralCommissionWithdrawalRequests
            .AsNoTracking()
            .Include(r => r.ReferrerUser)
            .AsQueryable();

        if (req.Status.HasValue)
        {
            query = query.Where(r => r.Status == req.Status.Value);
        }

        if (req.UserId.HasValue)
        {
            query = query.Where(r => r.ReferrerUserId == req.UserId.Value);
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.Trim().ToLower();

            if (Guid.TryParse(search, out var paymentId))
            {
                query = query.Where(r =>
                    dbContext.ReferralCommissionPayments.Any(p => p.Id == paymentId && p.WithdrawalRequestId == r.Id));
            }
            else
            {
                query = query.Where(r =>
                    r.ReferrerUser.Name.ToLower().Contains(search)
                    || r.ReferrerUser.Email.ToLower().Contains(search));
            }
        }

        var totalItems = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize);

        var items = await query
            .OrderByDescending(r => r.RequestedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(r => new AdminMinimalReferralCommissionWithdrawalRequest
            {
                Id = r.Id,
                ReferrerUserId = r.ReferrerUserId,
                ReferrerName = r.ReferrerUser.Name,
                ReferrerEmail = r.ReferrerUser.Email,
                Amount = r.Amount,
                RequestedAt = r.RequestedAt,
                Status = r.Status,
                Notes = r.Notes
            })
            .ToListAsync(ct);

        await Send.OkAsync(new ReadListReferralCommissionWithdrawalRequestsResponse
        {
            Data = new Paginated<AdminMinimalReferralCommissionWithdrawalRequest>
            {
                Items = items,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = totalPages
            }
        }, ct);
    }
}
