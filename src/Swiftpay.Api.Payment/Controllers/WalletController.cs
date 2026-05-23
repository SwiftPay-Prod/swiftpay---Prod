using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Wallet.Commands;
using Swiftpay.Application.Features.Wallet.DTOs;
using Swiftpay.Application.Features.Wallet.Queries;

namespace Swiftpay.Api.Payment.Controllers;

[ApiController]
[Route("api/v1/wallet")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IMediator _mediator;

    public WalletController(IMediator mediator)
    {
        _mediator = mediator;
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
}
