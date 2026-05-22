using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Wallet.DTOs;

namespace Swiftpay.Application.Features.Wallet.Queries;

public record ListTransactionsQuery(int Page = 1, int Limit = 25) : IRequest<PagedResponse<TransactionResponse>>;

public class ListTransactionsQueryHandler : IRequestHandler<ListTransactionsQuery, PagedResponse<TransactionResponse>>
{
    private readonly ITransactionRepository _txRepo;
    private readonly ICurrentUserService _currentUser;

    public ListTransactionsQueryHandler(ITransactionRepository txRepo, ICurrentUserService currentUser)
    {
        _txRepo = txRepo;
        _currentUser = currentUser;
    }

    public async Task<PagedResponse<TransactionResponse>> Handle(ListTransactionsQuery request, CancellationToken ct)
    {
        var transactions = await _txRepo.ListByCompanyAsync(_currentUser.CompanyId, request.Page, request.Limit, ct);
        var total = await _txRepo.CountByCompanyAsync(_currentUser.CompanyId, ct);

        return new PagedResponse<TransactionResponse>
        {
            Items = transactions.Select(t => new TransactionResponse
            {
                Id = t.Id,
                Amount = t.Amount.AmountInCents,
                Type = t.Type.ToString(),
                Status = t.Status.ToString(),
                Method = t.Method.ToString(),
                CreatedAt = t.CreatedAt,
            }).ToList(),
            Page = request.Page,
            Limit = request.Limit,
            Total = total,
        };
    }
}
