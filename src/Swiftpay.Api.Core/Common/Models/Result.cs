namespace Swiftpay.Application.Common.Models;

public class Result<T>
{
    public bool IsSuccess { get; protected set; }
    public T? Value { get; protected set; }
    public Error? Error { get; protected set; }

    public static Result<T> Success(T value) => new() { IsSuccess = true, Value = value };
    public static Result<T> Failure(Error error) => new() { IsSuccess = false, Error = error };

    public static implicit operator Result<T>(T value) => Success(value);
}

public record Error(string Code, string Message)
{
    public static Error NotFound(string message) => new("NOT_FOUND", message);
    public static Error Validation(string message) => new("VALIDATION", message);
    public static Error Unauthorized(string message = "Unauthorized") => new("UNAUTHORIZED", message);
    public static Error Conflict(string message) => new("CONFLICT", message);
}
