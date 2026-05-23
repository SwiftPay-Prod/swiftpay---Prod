using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Mappings;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.PaymentLinks.DTOs;

namespace Swiftpay.Application.Features.PaymentLinks.Queries;

public record ListPaymentLinksQuery(int Page = 1, int Limit = 25) : IRequest<PagedResponse<PaymentLinkResponse>>;

public class ListPaymentLinksQueryHandler : IRequestHandler<ListPaymentLinksQuery, PagedResponse<PaymentLinkResponse>>
{
    private readonly IPaymentLinkRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public ListPaymentLinksQueryHandler(IPaymentLinkRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<PagedResponse<PaymentLinkResponse>> Handle(ListPaymentLinksQuery request, CancellationToken ct)
    {
        var links = await _repo.ListByCompanyAsync(_currentUser.CompanyId, request.Page, request.Limit, ct);
        var total = await _repo.CountByCompanyAsync(_currentUser.CompanyId, ct);

        return new PagedResponse<PaymentLinkResponse>
        {
            Items = links.ToResponseList(),
            Page = request.Page,
            Limit = request.Limit,
            Total = total,
        };
    }
}
