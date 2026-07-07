using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Services;

/// <summary>
/// Default environment provider that always returns Production.
/// Used as fallback when no environment is explicitly set.
/// </summary>
public sealed class DefaultEnvironmentProvider : IEnvironmentProvider
{
    public ApiEnvironment CurrentEnvironment => ApiEnvironment.Production;
    public bool HasEnvironment => false;
}
