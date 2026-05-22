namespace Swiftpay.Application.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };
    public static ApiResponse<T> Fail(string message, List<string>? errors = null) =>
        new() { Success = false, Message = message, Errors = errors };
}

public class PagedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public int TotalPages => (int)Math.Ceiling(Total / (double)Limit);
}
