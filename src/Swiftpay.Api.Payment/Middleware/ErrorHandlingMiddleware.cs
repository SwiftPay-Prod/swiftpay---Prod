using System.Net;
using FluentValidation;

namespace Swiftpay.Api.Payment.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;

    public ErrorHandlingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";

            var response = ApiResponse<object>.Fail("Validation failed",
                ex.Errors.Select(e => e.ErrorMessage).ToList());

            await context.Response.WriteAsJsonAsync(response);
        }
        catch (KeyNotFoundException)
        {
            context.Response.StatusCode = (int)HttpStatusCode.NotFound;
            context.Response.ContentType = "application/json";

            var response = ApiResponse<object>.Fail("Resource not found");
            await context.Response.WriteAsJsonAsync(response);
        }
        catch (UnauthorizedAccessException)
        {
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            context.Response.ContentType = "application/json";

            var response = ApiResponse<object>.Fail("Unauthorized");
            await context.Response.WriteAsJsonAsync(response);
        }
        catch (Exception)
        {
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var response = ApiResponse<object>.Fail("An unexpected error occurred");
            await context.Response.WriteAsJsonAsync(response);
        }
    }
}
