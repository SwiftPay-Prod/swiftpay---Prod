namespace swiftpay_api_payment.Endpoints.Models;

/// <summary>
/// Resposta paginada.
/// </summary>
/// <typeparam name="T">Tipo dos itens.</typeparam>
public class PaginatedResponse<T>
{
    /// <summary>
    /// Lista de itens.
    /// </summary>
    public IEnumerable<T> Items { get; set; } = [];

    /// <summary>
    /// Página atual.
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// Itens por página.
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total de itens.
    /// </summary>
    public int TotalItems { get; set; }

    /// <summary>
    /// Total de páginas.
    /// </summary>
    public int TotalPages => (int)Math.Ceiling(TotalItems / (double)PageSize);

    /// <summary>
    /// Indica se há próxima página.
    /// </summary>
    public bool HasNextPage => Page < TotalPages;

    /// <summary>
    /// Indica se há página anterior.
    /// </summary>
    public bool HasPreviousPage => Page > 1;
}

/// <summary>
/// Resposta paginada com totalizadores monetários.
/// </summary>
/// <typeparam name="T">Tipo dos itens.</typeparam>
public class PaginatedResponseWithTotals<T> : PaginatedResponse<T>
{
    /// <summary>
    /// Soma total dos valores (em centavos).
    /// </summary>
    public long TotalAmount { get; set; }

    /// <summary>
    /// Soma total das taxas (em centavos).
    /// </summary>
    public long TotalFees { get; set; }

    /// <summary>
    /// Soma total dos valores líquidos (em centavos).
    /// </summary>
    public long TotalNetAmount { get; set; }
}
