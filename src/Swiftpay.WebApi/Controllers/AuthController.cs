using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Auth.Commands;
using Swiftpay.Application.Features.Auth.DTOs;

namespace Swiftpay.WebApi.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register(
        [FromBody] RegisterRequest request, CancellationToken ct)
    {
        var command = new RegisterCommand(
            request.Name,
            request.Email,
            request.Password,
            request.CompanyName,
            request.Document);

        var result = await _mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<AuthResponse>.Ok(result.Value!))
            : BadRequest(ApiResponse<AuthResponse>.Fail(result.Error!.Message));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login(
        [FromBody] LoginRequest request, CancellationToken ct)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var result = await _mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<AuthResponse>.Ok(result.Value!))
            : Unauthorized(ApiResponse<AuthResponse>.Fail(result.Error!.Message));
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var companyId = User.FindFirst("company_id")?.Value;

        return Ok(ApiResponse<object>.Ok(new
        {
            UserId = userId,
            Email = email,
            CompanyId = companyId
        }));
    }
}
