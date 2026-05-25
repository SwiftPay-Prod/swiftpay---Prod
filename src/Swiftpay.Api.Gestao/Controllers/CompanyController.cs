using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Gestao.Controllers;

[ApiController]
[Route("api/v1/company")]
[Authorize]
public class CompanyController : ControllerBase
{
    private readonly AppDbContext _db;

    public CompanyController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult> GetCompany()
    {
        var companyId = Guid.Parse(User.FindFirst("company_id")!.Value);
        var company = await _db.Companies.FirstOrDefaultAsync(c => c.Id == companyId);
        if (company == null) return NotFound();
        return Ok(new { success = true, data = new { company.Id, company.Name, company.Document, company.KycStatus } });
    }
}
