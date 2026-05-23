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
}
