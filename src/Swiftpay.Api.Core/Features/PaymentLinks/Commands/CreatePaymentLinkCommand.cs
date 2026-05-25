using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Models;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Features.PaymentLinks.Commands;

public class CreatePaymentLinkCommand : IRequest<Result<Guid>>
{
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public long Amount { get; init; }
    public long? AmountMin { get; init; }
    public long? AmountMax { get; init; }
    public bool IsSandbox { get; init; }
    public bool RequireDocument { get; init; }
    public bool RequirePhone { get; init; }
    public string? Theme { get; init; }
    public string? PrimaryColor { get; init; }
    public string? CtaText { get; init; }
    public string? SuccessMessage { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public int? MaxUses { get; init; }
}

public class CreatePaymentLinkCommandHandler : IRequestHandler<CreatePaymentLinkCommand, Result<Guid>>
{
    private readonly IPaymentLinkRepository _repo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private static readonly Random _random = new();

    public CreatePaymentLinkCommandHandler(IPaymentLinkRepository repo, IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(CreatePaymentLinkCommand request, CancellationToken ct)
    {
        var link = new PaymentLink
        {
            Id = Guid.NewGuid(),
            CompanyId = _currentUser.CompanyId,
            Title = request.Title,
            Description = request.Description,
            Amount = new Money(request.Amount),
            AmountMin = request.AmountMin.HasValue ? new Money(request.AmountMin.Value) : null,
            AmountMax = request.AmountMax.HasValue ? new Money(request.AmountMax.Value) : null,
            Slug = GenerateSlug(),
            IsActive = true,
            IsSandbox = request.IsSandbox,
            RequireDocument = request.RequireDocument,
            RequirePhone = request.RequirePhone,
            Theme = request.Theme,
            PrimaryColor = request.PrimaryColor,
            CtaText = request.CtaText,
            SuccessMessage = request.SuccessMessage,
            ExpiresAt = request.ExpiresAt,
            MaxUses = request.MaxUses,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _repo.AddAsync(link, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        return Result<Guid>.Success(link.Id);
    }

    private static string GenerateSlug()
    {
        const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        return new string(Enumerable.Range(0, 8).Select(_ => chars[_random.Next(chars.Length)]).ToArray());
    }
}
