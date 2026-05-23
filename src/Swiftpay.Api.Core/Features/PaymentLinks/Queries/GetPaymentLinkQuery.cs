using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Mappings;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.PaymentLinks.DTOs;

namespace Swiftpay.Application.Features.PaymentLinks.Queries;

public record GetPaymentLinkQuery(Guid Id) : IRequest<Result<PaymentLinkResponse>>;

public class GetPaymentLinkQueryHandler : IRequestHandler<GetPaymentLinkQuery, Result<PaymentLinkResponse>>
{
    private readonly IPaymentLinkRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public GetPaymentLinkQueryHandler(IPaymentLinkRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<Result<PaymentLinkResponse>> Handle(GetPaymentLinkQuery request, CancellationToken ct)
    {
        var link = await _repo.GetByIdAsync(request.Id, ct);
        if (link is null || link.CompanyId != _currentUser.CompanyId)
            return Result<PaymentLinkResponse>.Failure(Error.NotFound("Payment link not found"));

        return link.ToResponse();
    }
}
