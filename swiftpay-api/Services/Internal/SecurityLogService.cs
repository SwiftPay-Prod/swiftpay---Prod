using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;

namespace safefy_api.Services.Internal;

public class SecurityLogService(ILogQueue<SecurityLogEntry> logQueue) : ISecurityLogService
{
    private string? _ipAddress;
    private string? _userAgent;
    private string? _location;

    public void SetContext(string? ipAddress, string? userAgent)
    {
        _ipAddress = ipAddress;
        _userAgent = userAgent;
    }

    public void SetContext(string? ipAddress, string? userAgent, string? location)
    {
        _ipAddress = ipAddress;
        _userAgent = userAgent;
        _location = location;
    }

    public async Task LogAsync(SecurityLogInput entry)
    {
        var log = new SecurityLogEntry
        {
            Id = Guid.CreateVersion7(),
            Action = entry.Action,
            Status = entry.Status,
            UserId = entry.UserId,
            UserEmail = entry.UserEmail,
            Details = entry.Details,
            IpAddress = entry.IpAddress ?? _ipAddress,
            UserAgent = entry.UserAgent ?? _userAgent,
            Location = entry.Location ?? _location,
            ServiceName = "swiftpay-api",
            CreatedAt = DateTime.UtcNow
        };

        await logQueue.EnqueueAsync(log);
    }
}
