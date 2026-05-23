using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Wallet.DTOs;
using Swiftpay.Domain.Enums;

namespace Swiftpay.Application.Features.Wallet.Queries;

public record GetBalanceQuery : IRequest<Result<BalanceResponse>>;

public class GetBalanceQueryHandler : IRequestHandler<GetBalanceQuery, Result<BalanceResponse>>
{
    private readonly ITransactionRepository _txRepo;
    private readonly ICurrentUserService _currentUser;

    public GetBalanceQueryHandler(ITransactionRepository txRepo, ICurrentUserService currentUser)
    {
        _txRepo = txRepo;
        _currentUser = currentUser;
    }

    public async Task<Result<BalanceResponse>> Handle(GetBalanceQuery request, CancellationToken ct)
    {
        var transactions = await _txRepo.ListByCompanyAsync(_currentUser.CompanyId, 1, int.MaxValue, ct);

        long available = 0, pending = 0;
        foreach (var t in transactions)
        {
            if (t.Status == TransactionStatus.Paid)
                available += t.Amount.AmountInCents;
            else if (t.Status == TransactionStatus.Pending)
                pending += t.Amount.AmountInCents;
        }

        return new BalanceResponse(available, pending);
    }
}
