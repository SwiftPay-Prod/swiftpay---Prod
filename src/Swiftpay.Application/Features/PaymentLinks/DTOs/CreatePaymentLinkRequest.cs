using FluentValidation;

namespace Swiftpay.Application.Features.PaymentLinks.DTOs;

public record CreatePaymentLinkRequest(
    string Title,
    string? Description,
    long Amount,
    long? AmountMin,
    long? AmountMax,
    bool RequireDocument,
    bool RequirePhone,
    string? Theme,
    string? PrimaryColor,
    string? CtaText,
    string? SuccessMessage,
    DateTime? ExpiresAt,
    int? MaxUses);

public class CreatePaymentLinkValidator : AbstractValidator<CreatePaymentLinkRequest>
{
    public CreatePaymentLinkValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.AmountMin).GreaterThan(0).When(x => x.AmountMin.HasValue);
        RuleFor(x => x.AmountMax).GreaterThan(0).When(x => x.AmountMax.HasValue);
        RuleFor(x => x.CtaText).MaximumLength(100);
        RuleFor(x => x.SuccessMessage).MaximumLength(500);
        RuleFor(x => x.Theme).MaximumLength(50);
        RuleFor(x => x.PrimaryColor).MaximumLength(7);
    }
}
