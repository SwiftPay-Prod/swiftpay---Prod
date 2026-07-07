using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Enum;

/// <summary>
/// Tipo do produto
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ProductType
{
    Physical,
    Digital,
    Service
}

/// <summary>
/// Status do produto
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ProductStatus
{
    Active,
    Inactive,
    Archived
}

/// <summary>
/// Status da variante do produto
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum VariantStatus
{
    Active,
    Inactive,
    OutOfStock
}

/// <summary>
/// Tipo de localização do serviço
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ServiceLocationType
{
    /// <summary>
    /// Serviço prestado online (videochamada, etc)
    /// </summary>
    Online,

    /// <summary>
    /// Serviço prestado presencialmente
    /// </summary>
    InPerson,

    /// <summary>
    /// Serviço pode ser prestado online ou presencialmente
    /// </summary>
    Both
}
