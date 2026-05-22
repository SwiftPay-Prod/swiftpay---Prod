using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.PaymentLinks.Commands;
using Swiftpay.Application.Features.PaymentLinks.DTOs;
using Swiftpay.Application.Features.PaymentLinks.Queries;

namespace Swiftpay.WebApi.Controllers;

[ApiController]
[Route("api/v1/payment-links")]
[Authorize]
public class PaymentLinksController : ControllerBase
{
    private readonly IMediator _mediator;

    public PaymentLinksController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(
        [FromBody] CreatePaymentLinkRequest request, CancellationToken ct)
    {
        var command = new CreatePaymentLinkCommand
        {
            Title = request.Title,
            Description = request.Description,
            Amount = request.Amount,
            AmountMin = request.AmountMin,
            AmountMax = request.AmountMax,
            RequireDocument = request.RequireDocument,
            RequirePhone = request.RequirePhone,
            Theme = request.Theme,
            PrimaryColor = request.PrimaryColor,
            CtaText = request.CtaText,
            SuccessMessage = request.SuccessMessage,
            ExpiresAt = request.ExpiresAt,
            MaxUses = request.MaxUses,
        };

        var result = await _mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<Guid>.Ok(result.Value!))
            : BadRequest(ApiResponse<Guid>.Fail(result.Error!.Message));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<PaymentLinkResponse>>> GetById(
        Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPaymentLinkQuery(id), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<PaymentLinkResponse>.Ok(result.Value!))
            : NotFound(ApiResponse<PaymentLinkResponse>.Fail(result.Error!.Message));
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<PaymentLinkResponse>>> List(
        [FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new ListPaymentLinksQuery(page, limit), ct);
        return Ok(result);
    }
}
