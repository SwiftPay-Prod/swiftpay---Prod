using Microsoft.AspNetCore.SignalR;

namespace safefy_api.Providers;

public class UserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        return connection.User?.FindFirst("id")?.Value
            ?? connection.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}
