namespace swiftpay_api_payment.Endpoints.Models;

/// <summary>
/// Detalhes de erro da API.
/// </summary>
public class ApiErrorResponse(string? message = default, string? code = default)
{
    /// <summary>
    /// Mensagem de erro descritiva.
    /// </summary>
    public string? Message { get; set; } = message;

    /// <summary>
    /// Código de erro para identificação programática.
    /// </summary>
    public string? Code { get; set; } = code;
}
