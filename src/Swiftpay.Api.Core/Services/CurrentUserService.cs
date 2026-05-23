using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Swiftpay.Application.Common;

namespace Swiftpay.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated == true)
        {
            UserId = Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : Guid.Empty;
            CompanyId = Guid.TryParse(user.FindFirstValue("company_id"), out var cid) ? cid : Guid.Empty;
            Email = user.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
            Role = user.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        }
    }

    public Guid UserId { get; }
    public Guid CompanyId { get; }
    public string Email { get; }
    public string Role { get; }
}
