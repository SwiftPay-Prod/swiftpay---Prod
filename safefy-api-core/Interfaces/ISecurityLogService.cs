using safefy_api_core.Models.Inputs;

namespace safefy_api_core.Interfaces;

public interface ISecurityLogService
{
    Task LogAsync(SecurityLogInput entry);

    void SetContext(string? ipAddress, string? userAgent);

    void SetContext(string? ipAddress, string? userAgent, string? location);
}

