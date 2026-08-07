namespace swiftpay_api.Endpoints.Models;

public class BaseResponse
{
    public string? Message { get; set; }

    public ErrorResponse? Error { get; set; }
}

public class BaseResponse<T>
{
    public T? Data { get; set; }

    public string? Message { get; set; }

    public ErrorResponse? Error { get; set; }
}
public class ErrorResponse(string? message = default)
{
    public string? Message { get; set; } = message;

    /// <summary>Machine-readable error code (e.g. EMAIL_NOT_VERIFIED, USER_NOT_FOUND).</summary>
    public string? Code { get; set; }
}
