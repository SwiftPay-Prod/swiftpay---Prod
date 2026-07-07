namespace swiftpay_api.Endpoints.Models;

public interface IPaginatedRequest
{
    int Page { get; set; }
    int PageSize { get; set; }
}

public class Paginated<T> where T : class
{
    public List<T> Items { get; set; } = [];
    public long TotalItems { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
