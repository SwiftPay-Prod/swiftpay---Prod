using Microsoft.Extensions.Logging;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;

namespace swiftpay_api_core.Services;

public class SecurityLogDbService : ISecurityLogService
{
    private readonly ILogQueue<SecurityLogEntry> _logQueue;
    private readonly ILogger<SecurityLogDbService> _logger;
    
    private string? _ipAddress;
    private string? _userAgent;
    private string? _location;

    public SecurityLogDbService(
        ILogQueue<SecurityLogEntry> logQueue,
        ILogger<SecurityLogDbService> logger
    )
    {
        _logQueue = logQueue;
        _logger = logger;
    }

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

    public async Task LogAsync(SecurityLogAction action, SecurityLogStatus status, Guid? userId = null, string? details = null)
    {
        await LogAsync(new SecurityLogInput
        {
            Action = action,
            Status = status,
            UserId = userId,
            Details = details
        });
    }

    public async Task LogAsync(SecurityLogInput entry)
    {
        try
        {
            var log = new SecurityLogEntry
            {
                Id = Guid.CreateVersion7(),
                UserId = entry.UserId,
                UserEmail = entry.UserEmail,
                Action = entry.Action,
                Status = entry.Status,
                IpAddress = entry.IpAddress ?? _ipAddress,
                UserAgent = entry.UserAgent ?? _userAgent,
                Location = entry.Location ?? _location,
                Details = entry.Details,
                CreatedAt = DateTime.UtcNow
            };

            await _logQueue.EnqueueAsync(log);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Failed to enqueue security log: Action={Action}, Status={Status}",
                entry.Action, entry.Status);
        }
    }
}
