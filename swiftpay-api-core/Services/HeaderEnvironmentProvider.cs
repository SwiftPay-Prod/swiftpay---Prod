using Microsoft.AspNetCore.Http;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Services;

/// <summary>
/// Hybrid environment provider that checks AsyncLocal first (for consumers/background jobs),
/// then falls back to HTTP header (for HTTP requests).
/// This is the primary provider used by the application.
/// </summary>
public sealed class HybridEnvironmentProvider : IEnvironmentProvider
{
    /// <summary>
    /// The HTTP header name used to specify the API environment.
    /// </summary>
    public const string HeaderName = "X-Api-Environment";

    private static readonly AsyncLocal<ApiEnvironment?> _asyncLocalEnvironment = new();

    private readonly IHttpContextAccessor? _httpContextAccessor;

    public HybridEnvironmentProvider(IHttpContextAccessor? httpContextAccessor = null)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public ApiEnvironment CurrentEnvironment
    {
        get
        {
            if (_asyncLocalEnvironment.Value.HasValue)
            {
                return _asyncLocalEnvironment.Value.Value;
            }

            var headerValue = _httpContextAccessor?.HttpContext?.Request.Headers[HeaderName].ToString();
            if (!string.IsNullOrEmpty(headerValue) && Enum.TryParse<ApiEnvironment>(headerValue, true, out var env))
            {
                return env;
            }

            return ApiEnvironment.Production;
        }
    }

    public bool HasEnvironment
    {
        get
        {
            if (_asyncLocalEnvironment.Value.HasValue)
            {
                return true;
            }

            var headerValue = _httpContextAccessor?.HttpContext?.Request.Headers[HeaderName].ToString();
            return !string.IsNullOrEmpty(headerValue) && Enum.TryParse<ApiEnvironment>(headerValue, true, out _);
        }
    }

    /// <summary>
    /// Sets the environment for the current async context.
    /// Use in a using block to automatically reset when done.
    /// This is used by MassTransit consumers and background jobs.
    /// </summary>
    public static IDisposable SetEnvironment(ApiEnvironment environment)
    {
        _asyncLocalEnvironment.Value = environment;
        return new EnvironmentScope();
    }

    private sealed class EnvironmentScope : IDisposable
    {
        public void Dispose()
        {
            _asyncLocalEnvironment.Value = null;
        }
    }
}

/// <summary>
/// Environment provider that reads the current environment from the X-Api-Environment HTTP header.
/// This is kept for backwards compatibility, but HybridEnvironmentProvider should be preferred.
/// </summary>
[Obsolete("Use HybridEnvironmentProvider instead")]
public sealed class HeaderEnvironmentProvider : IEnvironmentProvider
{
    public const string HeaderName = "X-Api-Environment";

    public ApiEnvironment CurrentEnvironment { get; }
    public bool HasEnvironment { get; }

    public HeaderEnvironmentProvider(IHttpContextAccessor httpContextAccessor)
    {
        var headerValue = httpContextAccessor.HttpContext?.Request.Headers[HeaderName].ToString();

        if (!string.IsNullOrEmpty(headerValue) && Enum.TryParse<ApiEnvironment>(headerValue, true, out var env))
        {
            CurrentEnvironment = env;
            HasEnvironment = true;
        }
        else
        {
            CurrentEnvironment = ApiEnvironment.Production;
            HasEnvironment = false;
        }
    }
}
