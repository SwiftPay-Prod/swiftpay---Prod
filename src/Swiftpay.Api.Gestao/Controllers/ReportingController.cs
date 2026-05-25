using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Gestao.Controllers;

[ApiController]
[Route("api/v1/reporting")]
[Authorize]
public class ReportingController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReportingController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("transactions")]
    public async Task<ActionResult> GetTransactions(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] string? method, [FromQuery] string? status,
        [FromQuery] int page = 1, [FromQuery] int limit = 50)
    {
        var query = _db.Payments.AsQueryable();

        if (from.HasValue)
            query = query.Where(p => p.CreatedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(p => p.CreatedAt <= to.Value.AddDays(1));
        if (!string.IsNullOrEmpty(method))
            query = query.Where(p => p.Method == method);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(p => p.Status == status);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Amount,
                p.PlatformFee,
                p.AcquirerFee,
                p.NetAmount,
                p.Method,
                p.Status,
                p.CreatedAt,
                p.PaidAt,
                p.ExternalId,
                p.AcquirerPaymentId
            })
            .ToListAsync();

        var paid = await query.CountAsync(p => p.Status == "PAID");
        var revenue = await query.Where(p => p.Status == "PAID").SumAsync(p => (long?)p.Amount) ?? 0;
        var fees = await query.Where(p => p.Status == "PAID").SumAsync(p => (long?)p.PlatformFee) ?? 0;

        return Ok(new
        {
            success = true,
            data = new
            {
                items,
                total,
                page,
                limit,
                totalPages = (int)Math.Ceiling(total / (double)limit),
                summary = new
                {
                    revenue,
                    totalFees = fees,
                    paidTransactions = paid,
                    successRate = total > 0 ? paid * 100.0 / total : 0
                }
            }
        });
    }
}
