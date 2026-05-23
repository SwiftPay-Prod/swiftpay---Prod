using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swiftpay.Api.Core.Services;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.PaymentLinks.Commands;
using Swiftpay.Application.Features.PaymentLinks.DTOs;
using Swiftpay.Application.Features.PaymentLinks.Queries;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Payment.Controllers;

[ApiController]
[Route("api/v1/payment-links")]
[Authorize]
public class PaymentLinksController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly AppDbContext _context;
    private readonly PixTransactionService _pixTransactionService;

    public PaymentLinksController(
        IMediator mediator,
        AppDbContext context,
        PixTransactionService pixTransactionService)
    {
        _mediator = mediator;
        _context = context;
        _pixTransactionService = pixTransactionService;
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

    [AllowAnonymous]
    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<ApiResponse<object>>> GetBySlug(string slug, CancellationToken ct)
    {
        var link = await _context.PaymentLinks
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive && p.DeletedAt == null, ct);
        if (link == null) return NotFound(ApiResponse<object>.Fail("Payment link not found"));
        if (link.IsExpired) return BadRequest(ApiResponse<object>.Fail("Payment link expired"));
        return Ok(ApiResponse<object>.Ok(new
        {
            title = link.Title,
            description = link.Description,
            amount = link.Amount.AmountInCents,
            amountFormatted = link.Amount.ToString(),
            requireDocument = link.RequireDocument,
            requirePhone = link.RequirePhone,
            theme = link.Theme ?? "dark",
            primaryColor = link.PrimaryColor ?? "#000000",
            ctaText = link.CtaText ?? "Pagar com PIX",
            successMessage = link.SuccessMessage ?? "Pagamento confirmado!",
        }));
    }

    [HttpPost("{slug}/pay")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> PayBySlug(
        string slug, [FromBody] PayPaymentLinkRequest request, CancellationToken ct)
    {
        var link = await _context.PaymentLinks.FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive, ct);
        if (link == null) return NotFound(ApiResponse<object>.Fail("Payment link not found"));
        if (link.IsExpired) return BadRequest(ApiResponse<object>.Fail("Payment link expired"));

        var externalRef = $"{link.Slug}-{Guid.NewGuid():N}"[..20];
        var result = await _pixTransactionService.CreatePixPaymentAsync(
            link.CompanyId, link.Amount.AmountInCents, externalRef,
            $"{Request.Scheme}://{Request.Host}/api/v1/internal/magicpay/webhook",
            request.PayerName ?? "Cliente", request.PayerTaxId ?? "00000000000",
            request.PayerEmail ?? "cliente@email.com", request.PayerPhone ?? "11999999999", ct);

        if (!result.Success) return BadRequest(ApiResponse<object>.Fail(result.ErrorMessage!));
        return Ok(ApiResponse<object>.Ok(new
        {
            paymentId = externalRef,
            qrCode = result.QrCodePayload,
            copyPaste = result.CopyAndPaste,
        }));
    }

    [AllowAnonymous]
    [HttpGet("status/{externalId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetPaymentStatus(string externalId, CancellationToken ct)
    {
        var payment = await _context.Payments
            .FirstOrDefaultAsync(p => p.ExternalId == externalId, ct);
        if (payment == null)
            return NotFound(ApiResponse<object>.Fail("Payment not found"));
        return Ok(ApiResponse<object>.Ok(new { status = payment.Status }));
    }
}

public record PayPaymentLinkRequest(string? PayerName, string? PayerTaxId, string? PayerEmail, string? PayerPhone);
