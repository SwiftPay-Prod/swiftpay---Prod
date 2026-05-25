using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Gestao.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    public async Task<ActionResult> GetSummary()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);
        var payments = _db.Payments.Where(p => p.CreatedAt >= monthStart && p.CreatedAt < monthEnd);

        var total = await payments.CountAsync();
        var paid = await payments.CountAsync(p => p.Status == "PAID");
        var failed = await payments.CountAsync(p => p.Status == "FAILED" || p.Status == "REFUSED");
        var refunded = await payments.CountAsync(p => p.Status == "REFUNDED");

        var revenue = await payments.Where(p => p.Status == "PAID").SumAsync(p => (long?)p.Amount) ?? 0;
        var fees = await payments.Where(p => p.Status == "PAID").SumAsync(p => (long?)p.PlatformFee) ?? 0;
        var acquirerFees = await payments.Where(p => p.Status == "PAID").SumAsync(p => (long?)p.AcquirerFee) ?? 0;

        var dailyData = await payments
            .GroupBy(p => p.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Revenue = g.Sum(p => (long?)p.Amount) ?? 0 })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                revenue,
                platformFees = fees,
                acquirerFees,
                netRevenue = revenue - fees - acquirerFees,
                totalTransactions = total,
                successfulTransactions = paid,
                failedTransactions = failed,
                refundedTransactions = refunded,
                avgTicket = paid > 0 ? revenue / paid : 0,
                dailyBreakdown = dailyData.OrderBy(d => d.Date).Select(d => new { d.Date, d.Revenue })
            }
        });
    }
}
