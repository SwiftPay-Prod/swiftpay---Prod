namespace safefy_api_payment.Endpoints.Models;

/// <summary>
/// Interface para requisições paginadas.
/// </summary>
public interface IPaginatedRequest
{
    int Page { get; set; }
    int PageSize { get; set; }
}
