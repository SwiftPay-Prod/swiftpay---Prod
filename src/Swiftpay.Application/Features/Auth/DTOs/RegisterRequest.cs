using FluentValidation;

namespace Swiftpay.Application.Features.Auth.DTOs;

public record RegisterRequest(
    string Name,
    string Email,
    string Password,
    string CompanyName,
    string Document);

public class RegisterValidator : AbstractValidator<RegisterRequest>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.CompanyName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Document).NotEmpty().MaximumLength(20);
    }
}
