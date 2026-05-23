using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Models;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Features.Wallet.Commands;

public record RequestWithdrawalCommand(long Amount, string PixKey, string PixKeyType) : IRequest<Result<Guid>>;

public class RequestWithdrawalCommandHandler : IRequestHandler<RequestWithdrawalCommand, Result<Guid>>
{
    private readonly IWithdrawalRepository _repo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public RequestWithdrawalCommandHandler(
        IWithdrawalRepository repo,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(RequestWithdrawalCommand request, CancellationToken ct)
    {
        var withdrawal = new Withdrawal
        {
            Id = Guid.NewGuid(),
            CompanyId = _currentUser.CompanyId,
            Amount = new Money(request.Amount),
            Status = WithdrawalStatus.Pending,
            PixKey = request.PixKey,
            PixKeyType = request.PixKeyType,
            RequestedAt = DateTime.UtcNow,
        };

        await _repo.AddAsync(withdrawal, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(withdrawal.Id);
    }
}
