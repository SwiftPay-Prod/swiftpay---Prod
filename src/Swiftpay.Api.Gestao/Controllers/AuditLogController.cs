using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swiftpay.Domain.Entities;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Gestao.Controllers;

[ApiController]
[Route("api/v1/audit-logs")]
[Authorize]
public class AuditLogController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditLogController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult> List([FromQuery] int page = 1, [FromQuery] int limit = 25, [FromQuery] string? action = null)
    {
        var query = _db.Set<AuditLog>().AsQueryable();

        if (!string.IsNullOrEmpty(action))
            query = query.Where(l => l.Action == action);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new { items, total, page, limit, totalPages = (int)Math.Ceiling(total / (double)limit) }
        });
    }

    [HttpGet("stats")]
    public async Task<ActionResult> Stats()
    {
        var today = DateTime.UtcNow.Date;
        var total = await _db.Set<AuditLog>().CountAsync();
        var todayCount = await _db.Set<AuditLog>().CountAsync(l => l.CreatedAt >= today);

        return Ok(new { success = true, data = new { total, todayCount } });
    }
}
