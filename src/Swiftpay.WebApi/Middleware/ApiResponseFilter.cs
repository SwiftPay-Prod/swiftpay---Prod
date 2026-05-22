using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Swiftpay.WebApi.Middleware;

public class ApiResponseFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context) { }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        if (context.Result is ObjectResult objectResult)
        {
            var statusCode = objectResult.StatusCode ?? 200;

            if (objectResult.Value is not ApiResponse<object> && objectResult.Value is not ProblemDetails)
            {
                var response = statusCode >= 400
                    ? ApiResponse<object>.Fail(objectResult.Value?.ToString() ?? "Error")
                    : ApiResponse<object>.Ok(objectResult.Value!);

                context.Result = new ObjectResult(response)
                {
                    StatusCode = statusCode
                };
            }
        }
    }
}
