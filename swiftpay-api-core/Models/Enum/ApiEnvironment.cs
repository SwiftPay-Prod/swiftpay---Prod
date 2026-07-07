using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Enum;

/// <summary>
/// Ambiente de operação da API (Sandbox para testes, Production para produção).
/// Usado para isolar dados transacionais entre ambientes.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ApiEnvironment
{
    /// <summary>
    /// Ambiente de sandbox/testes
    /// </summary>
    Sandbox,

    /// <summary>
    /// Ambiente de produção
    /// </summary>
    Production
}
