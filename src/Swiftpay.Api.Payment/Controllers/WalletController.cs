using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swiftpay.Api.Core.Providers;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Wallet.Commands;
using Swiftpay.Application.Features.Wallet.DTOs;
using Swiftpay.Application.Features.Wallet.Queries;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Payment.Controllers;

[ApiController]
[Route("api/v1/wallet")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly AppDbContext _context;
    private readonly PixProviderFactory _providerFactory;

    public WalletController(IMediator mediator, AppDbContext context, PixProviderFactory providerFactory)
    {
        _mediator = mediator;
        _context = context;
        _providerFactory = providerFactory;
    }

    [HttpGet("balance")]
    public async Task<ActionResult<ApiResponse<BalanceResponse>>> GetBalance(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetBalanceQuery(), ct);
        return Ok(ApiResponse<BalanceResponse>.Ok(result.Value!));
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<PagedResponse<TransactionResponse>>> GetTransactions(
        [FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new ListTransactionsQuery(page, limit), ct);
        return Ok(result);
    }

    [HttpPost("withdrawals")]
    public async Task<ActionResult<ApiResponse<Guid>>> RequestWithdrawal(
        [FromBody] WithdrawalRequest request, CancellationToken ct)
    {
        var command = new RequestWithdrawalCommand(request.Amount, request.PixKey, request.PixKeyType);
        var result = await _mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<Guid>.Ok(result.Value!))
            : BadRequest(ApiResponse<Guid>.Fail(result.Error!.Message));
    }

    [HttpGet("withdrawals")]
    public async Task<ActionResult<PagedResponse<WithdrawalResponse>>> GetWithdrawals(
        [FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new ListWithdrawalsQuery(page, limit), ct);
        return Ok(result);
    }

    [HttpPost("refund")]
    public async Task<ActionResult<ApiResponse<object>>> Refund(
        [FromBody] RefundRequest request, CancellationToken ct)
    {
        var payment = await _context.Payments
            .FirstOrDefaultAsync(p => p.ExternalId == request.ExternalId, ct);
        if (payment == null) return NotFound(ApiResponse<object>.Fail("Payment not found"));
        if (payment.Status != "PAID") return BadRequest(ApiResponse<object>.Fail("Payment is not paid"));

        var provider = _providerFactory.GetProvider("MagicPay");
        var result = await provider.RefundAsync(payment.AcquirerPaymentId!, payment.Amount, ct);

        if (!result.Success) return BadRequest(ApiResponse<object>.Fail(result.ErrorMessage!));

        payment.Status = "REFUNDED";
        payment.RefundedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { status = "REFUNDED" }));
    }
}

public record RefundRequest(string ExternalId);
