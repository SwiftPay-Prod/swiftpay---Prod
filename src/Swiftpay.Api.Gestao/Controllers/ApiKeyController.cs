using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swiftpay.Domain.Entities;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Gestao.Controllers;

[ApiController]
[Route("api/v1/api-keys")]
[Authorize]
public class ApiKeyController : ControllerBase
{
    private readonly AppDbContext _db;

    public ApiKeyController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult> List()
    {
        var keys = await _db.Set<ApiKey>().ToListAsync();
        return Ok(new { success = true, data = keys });
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] ApiKey request)
    {
        var key = new ApiKey
        {
            Id = Guid.NewGuid(),
            MerchantId = request.MerchantId,
            Name = request.Name,
            Key = $"swp_{Convert.ToHexString(Guid.NewGuid().ToByteArray()).ToLower()}",
            Scopes = request.Scopes ?? "read,write",
        };
        _db.Set<ApiKey>().Add(key);
        await _db.SaveChangesAsync();
        return Ok(new { success = true, data = key });
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var key = await _db.Set<ApiKey>().FindAsync(id);
        if (key == null) return NotFound();
        key.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
