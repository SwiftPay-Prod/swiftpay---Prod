using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Wallet.Commands;
using Swiftpay.Application.Features.Wallet.DTOs;
using Swiftpay.Application.Features.Wallet.Queries;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Tests.Features.Wallet;

public class RequestWithdrawalCommandTests
{
    private readonly Mock<IWithdrawalRepository> _repo;
    private readonly Mock<IUnitOfWork> _unitOfWork;
    private readonly Mock<ICurrentUserService> _currentUser;
    private readonly Mock<ILedgerService> _ledgerService;
    private readonly IRequestHandler<RequestWithdrawalCommand, Result<Guid>> _createHandler;
    private readonly IRequestHandler<ListWithdrawalsQuery, PagedResponse<WithdrawalResponse>> _listHandler;
    private readonly Guid _companyId = Guid.NewGuid();

    public RequestWithdrawalCommandTests()
    {
        _repo = new Mock<IWithdrawalRepository>();
        _unitOfWork = new Mock<IUnitOfWork>();
        _currentUser = new Mock<ICurrentUserService>();
        _ledgerService = new Mock<ILedgerService>();
        _currentUser.Setup(x => x.CompanyId).Returns(_companyId);
        _createHandler = new RequestWithdrawalCommandHandler(_repo.Object, _unitOfWork.Object, _currentUser.Object, _ledgerService.Object);
        _listHandler = new ListWithdrawalsQueryHandler(_repo.Object, _currentUser.Object);
    }

    [Fact]
    public async Task Handle_Should_CreateWithdrawal_When_ValidRequest()
    {
        _ledgerService.Setup(x => x.GetMerchantAvailableBalanceAsync(_companyId, "production", It.IsAny<CancellationToken>()))
            .ReturnsAsync(100000);

        var cmd = new RequestWithdrawalCommand(10000, "test@example.com", "EMAIL");

        var result = await _createHandler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();
        _repo.Verify(r => r.AddAsync(It.Is<Withdrawal>(w =>
            w.Amount.AmountInCents == 10000 &&
            w.PixKey == "test@example.com" &&
            w.PixKeyType == "EMAIL" &&
            w.CompanyId == _companyId), It.IsAny<CancellationToken>()));
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task Handle_Should_CreateWithdrawal_WithCPFKey()
    {
        _ledgerService.Setup(x => x.GetMerchantAvailableBalanceAsync(_companyId, "production", It.IsAny<CancellationToken>()))
            .ReturnsAsync(100000);

        var cmd = new RequestWithdrawalCommand(5000, "12345678901", "CPF");

        var result = await _createHandler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        _repo.Verify(r => r.AddAsync(It.Is<Withdrawal>(w =>
            w.Amount.AmountInCents == 5000 &&
            w.PixKey == "12345678901" &&
            w.PixKeyType == "CPF"), It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task Handle_Should_ReturnFailure_When_InsufficientBalance()
    {
        _ledgerService.Setup(x => x.GetMerchantAvailableBalanceAsync(_companyId, "production", It.IsAny<CancellationToken>()))
            .ReturnsAsync(1000);

        var cmd = new RequestWithdrawalCommand(5000, "test@example.com", "EMAIL");

        var result = await _createHandler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().NotBeNull();
        result.Error!.Code.Should().Be("VALIDATION");
        _repo.Verify(r => r.AddAsync(It.IsAny<Withdrawal>(), It.IsAny<CancellationToken>()), Times.Never);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ListWithdrawals_Should_ReturnPagedResults()
    {
        var withdrawals = new List<Withdrawal>
        {
            new() { Id = Guid.NewGuid(), CompanyId = _companyId, Amount = new Money(1000), Status = Swiftpay.Domain.Enums.WithdrawalStatus.Pending, PixKey = "key1", PixKeyType = "CPF", RequestedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), CompanyId = _companyId, Amount = new Money(2000), Status = Swiftpay.Domain.Enums.WithdrawalStatus.Completed, PixKey = "key2", PixKeyType = "EMAIL", RequestedAt = DateTime.UtcNow },
        };

        _repo.Setup(r => r.ListByCompanyAsync(_companyId, 1, 25, It.IsAny<CancellationToken>()))
            .ReturnsAsync(withdrawals);
        _repo.Setup(r => r.CountByCompanyAsync(_companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);

        var result = await _listHandler.Handle(new ListWithdrawalsQuery(), CancellationToken.None);

        result.Items.Should().HaveCount(2);
        result.Total.Should().Be(2);
        result.Page.Should().Be(1);
        result.Limit.Should().Be(25);
        result.Items[0].Amount.Should().Be(1000);
        result.Items[1].Amount.Should().Be(2000);
    }

    [Fact]
    public async Task Handle_ListWithdrawals_Should_RespectPagination()
    {
        _repo.Setup(r => r.ListByCompanyAsync(_companyId, 2, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Withdrawal>());
        _repo.Setup(r => r.CountByCompanyAsync(_companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(5);

        var result = await _listHandler.Handle(new ListWithdrawalsQuery(2, 10), CancellationToken.None);

        result.Items.Should().BeEmpty();
        result.Page.Should().Be(2);
        result.Limit.Should().Be(10);
        result.Total.Should().Be(5);
    }
}
