using System.Text.Json;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Acquirer;

/// <summary>
/// Tipo do campo de credencial.
/// </summary>
public enum CredentialFieldType
{
    /// <summary>Campo de texto visível.</summary>
    Text,
    /// <summary>Campo de senha/segredo (oculto).</summary>
    Password
}

/// <summary>
/// Schema de um campo de credencial para uma adquirente.
/// Define como o campo deve ser exibido e validado no frontend.
/// </summary>
public sealed record CredentialFieldSchema
{
    /// <summary>
    /// Chave única do campo (ex: "secretKey", "companyId", "token").
    /// Usado para armazenar/recuperar o valor.
    /// </summary>
    [JsonPropertyName("key")]
    public required string Key { get; init; }

    /// <summary>
    /// Label exibido no frontend (ex: "Secret Key", "Company ID", "Token").
    /// </summary>
    [JsonPropertyName("label")]
    public required string Label { get; init; }

    /// <summary>
    /// Tipo do campo: "password" (senha/oculto) ou "text" (texto visível).
    /// </summary>
    [JsonPropertyName("type")]
    public string Type { get; init; } = "password";

    /// <summary>
    /// Se o campo é obrigatório.
    /// </summary>
    [JsonPropertyName("required")]
    public bool Required { get; init; } = true;

    /// <summary>
    /// Placeholder do campo no frontend.
    /// </summary>
    [JsonPropertyName("placeholder")]
    public string? Placeholder { get; init; }

    /// <summary>
    /// Descrição/ajuda do campo.
    /// </summary>
    [JsonPropertyName("description")]
    public string? Description { get; init; }
}

/// <summary>
/// Schema completo de credenciais de uma adquirente.
/// </summary>
public sealed record CredentialSchema
{
    [JsonPropertyName("fields")]
    public required List<CredentialFieldSchema> Fields { get; init; }
}

/// <summary>
/// Utilitários para manipular credenciais em formato JSON.
/// </summary>
public static class CredentialUtils
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    /// <summary>
    /// Faz parse de um JSON de credenciais para Dictionary.
    /// </summary>
    public static Dictionary<string, string> ParseCredentials(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new Dictionary<string, string>();

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(json, JsonOptions)
                ?? new Dictionary<string, string>();
        }
        catch
        {
            return new Dictionary<string, string>();
        }
    }

    /// <summary>
    /// Serializa um Dictionary de credenciais para JSON.
    /// </summary>
    public static string SerializeCredentials(Dictionary<string, string> credentials)
    {
        return JsonSerializer.Serialize(credentials, JsonOptions);
    }

    /// <summary>
    /// Faz parse de um JSON de schema para CredentialSchema.
    /// </summary>
    public static CredentialSchema? ParseSchema(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<CredentialSchema>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Serializa um CredentialSchema para JSON.
    /// </summary>
    public static string SerializeSchema(CredentialSchema schema)
    {
        return JsonSerializer.Serialize(schema, JsonOptions);
    }

    /// <summary>
    /// Cria um schema a partir de uma lista de definições de campos.
    /// </summary>
    public static string BuildSchema(params (string key, string label, CredentialFieldType type, bool required, string? placeholder, string? description)[] fields)
    {
        var schema = new CredentialSchema
        {
            Fields = fields.Select(f => new CredentialFieldSchema
            {
                Key = f.key,
                Label = f.label,
                Type = f.type == CredentialFieldType.Text ? "text" : "password",
                Required = f.required,
                Placeholder = f.placeholder,
                Description = f.description
            }).ToList()
        };
        return SerializeSchema(schema);
    }

    /// <summary>
    /// Mescla credenciais de MerchantAcquirer com fallback para Acquirer (strings JSON).
    /// </summary>
    public static Dictionary<string, string> MergeCredentials(
        string? acquirerCredentials,
        string? merchantCredentials)
    {
        var acquirerCreds = ParseCredentials(acquirerCredentials);
        var merchantCreds = ParseCredentials(merchantCredentials);

        // Merchant credentials override acquirer defaults (trim and filter empty/whitespace)
        foreach (var kvp in merchantCreds)
        {
            var trimmedValue = kvp.Value?.Trim();
            if (!string.IsNullOrEmpty(trimmedValue))
            {
                acquirerCreds[kvp.Key] = trimmedValue;
            }
        }

        return acquirerCreds;
    }

    /// <summary>
    /// Mescla credenciais de MerchantAcquirer com fallback para Acquirer (dicionários já parseados).
    /// </summary>
    public static Dictionary<string, string> MergeCredentials(
        Dictionary<string, string>? acquirerCredentials,
        Dictionary<string, string>? merchantCredentials)
    {
        var result = acquirerCredentials != null
            ? new Dictionary<string, string>(acquirerCredentials)
            : new Dictionary<string, string>();

        if (merchantCredentials == null)
            return result;

        // Merchant credentials override acquirer defaults (trim and filter empty/whitespace)
        foreach (var kvp in merchantCredentials)
        {
            var trimmedValue = kvp.Value?.Trim();
            if (!string.IsNullOrEmpty(trimmedValue))
            {
                result[kvp.Key] = trimmedValue;
            }
        }

        return result;
    }
}
