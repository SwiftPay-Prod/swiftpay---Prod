using safefy_api_core.Models.Enum;

namespace safefy_api_core.Interfaces;

/// <summary>
/// Provider interface for obtaining the current API environment from the HTTP request context.
/// This enables automatic environment filtering at the DbContext level.
/// </summary>
public interface IEnvironmentProvider
{
    /// <summary>
    /// Gets the current API environment for this request.
    /// Defaults to Production if not specified.
    /// </summary>
    ApiEnvironment CurrentEnvironment { get; }

    /// <summary>
    /// Indicates whether an environment was explicitly provided in the request.
    /// </summary>
    bool HasEnvironment { get; }
}
