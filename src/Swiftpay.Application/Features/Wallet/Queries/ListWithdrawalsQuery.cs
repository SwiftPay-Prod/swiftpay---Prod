using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Wallet.DTOs;

namespace Swiftpay.Application.Features.Wallet.Queries;

public record ListWithdrawalsQuery(int Page = 1, int Limit = 25) : IRequest<PagedResponse<WithdrawalResponse>>;

public class ListWithdrawalsQueryHandler : IRequestHandler<ListWithdrawalsQuery, PagedResponse<WithdrawalResponse>>
{
    private readonly IWithdrawalRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public ListWithdrawalsQueryHandler(IWithdrawalRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<PagedResponse<WithdrawalResponse>> Handle(ListWithdrawalsQuery request, CancellationToken ct)
    {
        var withdrawals = await _repo.ListByCompanyAsync(_currentUser.CompanyId, request.Page, request.Limit, ct);
        var total = await _repo.CountByCompanyAsync(_currentUser.CompanyId, ct);

        return new PagedResponse<WithdrawalResponse>
        {
            Items = withdrawals.Select(w => new WithdrawalResponse
            {
                Id = w.Id,
                Amount = w.Amount.AmountInCents,
                Status = w.Status.ToString(),
                PixKey = w.PixKey,
                PixKeyType = w.PixKeyType,
                RequestedAt = w.RequestedAt,
            }).ToList(),
            Page = request.Page,
            Limit = request.Limit,
            Total = total,
        };
    }
}
