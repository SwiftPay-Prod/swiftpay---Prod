using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swiftpay.Domain.Entities;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Gestao.Controllers;

[ApiController]
[Route("api/v1/webhooks")]
[Authorize]
public class WebhookConfigurationController : ControllerBase
{
    private readonly AppDbContext _db;

    public WebhookConfigurationController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult> List()
    {
        var configs = await _db.Set<WebhookConfiguration>().ToListAsync();
        return Ok(configs);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] WebhookConfiguration config)
    {
        config.Id = Guid.NewGuid();
        _db.Set<WebhookConfiguration>().Add(config);
        await _db.SaveChangesAsync();
        return Ok(config);
    }

    [HttpGet("delivery")]
    public async Task<ActionResult> GetDeliveries([FromQuery] int page = 1, [FromQuery] int limit = 25)
    {
        var query = _db.Set<WebhookDeliveryLog>().OrderByDescending(l => l.CreatedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * limit).Take(limit).ToListAsync();
        return Ok(new { success = true, data = new { items, total, page, limit } });
    }

    [HttpPost("delivery/{id}/retry")]
    public async Task<ActionResult> RetryDelivery(Guid id)
    {
        var log = await _db.Set<WebhookDeliveryLog>().FindAsync(id);
        if (log == null) return NotFound();
        log.Attempts++;
        log.Status = "Pending";
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
