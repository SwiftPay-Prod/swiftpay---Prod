using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.PaymentLinks.Commands;
using Swiftpay.Application.Features.PaymentLinks.DTOs;
using Swiftpay.Application.Features.PaymentLinks.Queries;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Tests.Features.PaymentLinks;

public class CreatePaymentLinkCommandTests
{
    private readonly Mock<IPaymentLinkRepository> _repo;
    private readonly Mock<IUnitOfWork> _unitOfWork;
    private readonly Mock<ICurrentUserService> _currentUser;
    private readonly IRequestHandler<CreatePaymentLinkCommand, Result<Guid>> _createHandler;
    private readonly IRequestHandler<GetPaymentLinkQuery, Result<PaymentLinkResponse>> _getHandler;
    private readonly IRequestHandler<ListPaymentLinksQuery, PagedResponse<PaymentLinkResponse>> _listHandler;
    private readonly Guid _companyId = Guid.NewGuid();

    public CreatePaymentLinkCommandTests()
    {
        _repo = new Mock<IPaymentLinkRepository>();
        _unitOfWork = new Mock<IUnitOfWork>();
        _currentUser = new Mock<ICurrentUserService>();
        _currentUser.Setup(x => x.CompanyId).Returns(_companyId);
        _createHandler = new CreatePaymentLinkCommandHandler(_repo.Object, _unitOfWork.Object, _currentUser.Object);
        _getHandler = new GetPaymentLinkQueryHandler(_repo.Object, _currentUser.Object);
        _listHandler = new ListPaymentLinksQueryHandler(_repo.Object, _currentUser.Object);
    }

    [Fact]
    public async Task Handle_Should_CreatePaymentLink_When_ValidCommand()
    {
        var cmd = new CreatePaymentLinkCommand
        {
            Title = "Test Link",
            Amount = 3000,
            RequireDocument = true,
        };

        var result = await _createHandler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();
        _repo.Verify(r => r.AddAsync(It.Is<PaymentLink>(l =>
            l.Title == "Test Link" &&
            l.Amount.AmountInCents == 3000 &&
            l.CompanyId == _companyId), It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task Handle_Should_GenerateSlug()
    {
        var cmd = new CreatePaymentLinkCommand { Title = "Slug Test", Amount = 1000 };

        var result = await _createHandler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        _repo.Verify(r => r.AddAsync(It.Is<PaymentLink>(l =>
            l.Slug.Length == 8 && l.Slug.All(char.IsLetterOrDigit)), It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task Handle_Should_CreatePaymentLink_WithOptionalFields()
    {
        var expiresAt = DateTime.UtcNow.AddDays(30);
        var cmd = new CreatePaymentLinkCommand
        {
            Title = "Full Link",
            Description = "A description",
            Amount = 5000,
            AmountMin = 1000,
            AmountMax = 10000,
            RequireDocument = false,
            RequirePhone = true,
            Theme = "dark",
            PrimaryColor = "#FF5733",
            CtaText = "Pay Now",
            SuccessMessage = "Thanks!",
            ExpiresAt = expiresAt,
            MaxUses = 10,
        };

        var result = await _createHandler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        _repo.Verify(r => r.AddAsync(It.Is<PaymentLink>(l =>
            l.Title == "Full Link" &&
            l.Description == "A description" &&
            l.Amount.AmountInCents == 5000 &&
            l.AmountMin!.Value.AmountInCents == 1000 &&
            l.AmountMax!.Value.AmountInCents == 10000 &&
            l.RequireDocument == false &&
            l.RequirePhone == true &&
            l.Theme == "dark" &&
            l.PrimaryColor == "#FF5733" &&
            l.CtaText == "Pay Now" &&
            l.SuccessMessage == "Thanks!" &&
            l.ExpiresAt == expiresAt &&
            l.MaxUses == 10), It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task Handle_GetPaymentLink_Should_ReturnLink_When_FoundAndOwned()
    {
        var linkId = Guid.NewGuid();
        var link = new PaymentLink
        {
            Id = linkId,
            CompanyId = _companyId,
            Title = "My Link",
            Amount = new Money(2000),
            Slug = "abc12345",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _repo.Setup(r => r.GetByIdAsync(linkId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(link);

        var result = await _getHandler.Handle(new GetPaymentLinkQuery(linkId), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Id.Should().Be(linkId);
        result.Value.Title.Should().Be("My Link");
        result.Value.Amount.Should().Be(2000);
    }

    [Fact]
    public async Task Handle_GetPaymentLink_Should_ReturnNotFound_When_NotOwned()
    {
        var linkId = Guid.NewGuid();
        var link = new PaymentLink
        {
            Id = linkId,
            CompanyId = Guid.NewGuid(),
            Title = "Other Link",
            Amount = new Money(2000),
            Slug = "xyz98765",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _repo.Setup(r => r.GetByIdAsync(linkId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(link);

        var result = await _getHandler.Handle(new GetPaymentLinkQuery(linkId), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().NotBeNull();
        result.Error!.Code.Should().Be("NOT_FOUND");
    }

    [Fact]
    public async Task Handle_GetPaymentLink_Should_ReturnNotFound_When_Missing()
    {
        var linkId = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(linkId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PaymentLink?)null);

        var result = await _getHandler.Handle(new GetPaymentLinkQuery(linkId), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().NotBeNull();
        result.Error!.Code.Should().Be("NOT_FOUND");
    }

    [Fact]
    public async Task Handle_ListPaymentLinks_Should_ReturnPagedResults()
    {
        var links = new List<PaymentLink>
        {
            new() { Id = Guid.NewGuid(), CompanyId = _companyId, Title = "Link 1", Amount = new Money(1000), Slug = "aaa11111", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), CompanyId = _companyId, Title = "Link 2", Amount = new Money(2000), Slug = "bbb22222", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
        };

        _repo.Setup(r => r.ListByCompanyAsync(_companyId, 1, 25, It.IsAny<CancellationToken>()))
            .ReturnsAsync(links);
        _repo.Setup(r => r.CountByCompanyAsync(_companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);

        var result = await _listHandler.Handle(new ListPaymentLinksQuery(), CancellationToken.None);

        result.Items.Should().HaveCount(2);
        result.Total.Should().Be(2);
        result.Page.Should().Be(1);
        result.Limit.Should().Be(25);
        result.Items[0].Title.Should().Be("Link 1");
        result.Items[1].Title.Should().Be("Link 2");
    }

    [Fact]
    public async Task Handle_ListPaymentLinks_Should_RespectPagination()
    {
        _repo.Setup(r => r.ListByCompanyAsync(_companyId, 2, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PaymentLink>());
        _repo.Setup(r => r.CountByCompanyAsync(_companyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(15);

        var result = await _listHandler.Handle(new ListPaymentLinksQuery(2, 10), CancellationToken.None);

        result.Items.Should().BeEmpty();
        result.Page.Should().Be(2);
        result.Limit.Should().Be(10);
        result.Total.Should().Be(15);
        result.TotalPages.Should().Be(2);
    }
}
