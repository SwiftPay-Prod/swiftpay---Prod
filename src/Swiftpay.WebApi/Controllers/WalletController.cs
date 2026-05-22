using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Wallet.DTOs;
using Swiftpay.Application.Features.Wallet.Queries;

namespace Swiftpay.WebApi.Controllers;

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
}
