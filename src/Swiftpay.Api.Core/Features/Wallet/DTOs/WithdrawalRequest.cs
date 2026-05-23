using FluentValidation;

namespace Swiftpay.Application.Features.Wallet.DTOs;

public record WithdrawalRequest(long Amount, string PixKey, string PixKeyType);

public class WithdrawalRequestValidator : AbstractValidator<WithdrawalRequest>
{
    public WithdrawalRequestValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Amount must be greater than zero");
        RuleFor(x => x.PixKey).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PixKeyType).NotEmpty().MaximumLength(20)
            .Must(v => new[] { "CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM_KEY" }.Contains(v))
            .WithMessage("Invalid PIX key type");
    }
}
