namespace swiftpay_api_payment.Endpoints.Models;

/// <summary>
/// Resposta padrão da API sem dados.
/// </summary>
public class BaseResponse
{
    /// <summary>
    /// Mensagem informativa.
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// Detalhes do erro em caso de falha.
    /// </summary>
    public ApiErrorResponse? Error { get; set; }
}

/// <summary>
/// Resposta padrão da API com dados tipados.
/// </summary>
/// <typeparam name="T">Tipo dos dados retornados.</typeparam>
public class BaseResponse<T> 
{
    /// <summary>
    /// Dados da resposta em caso de sucesso.
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// Mensagem informativa.
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// Detalhes do erro em caso de falha.
    /// </summary>
    public ApiErrorResponse? Error { get; set; }
}

