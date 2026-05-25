using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Gestao.Controllers;

[ApiController]
[Route("api/v1/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProfileController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult> GetProfile()
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var user = await _db.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound();
        return Ok(new { success = true, data = new { user.Id, user.Name, Email = user.Email.ToString(), user.Role, Company = user.Company?.Name } });
    }
}
