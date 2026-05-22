using FluentValidation;

namespace Swiftpay.Application.Features.Auth.DTOs;

public record LoginRequest(
    string Email,
    string Password);

public class LoginValidator : AbstractValidator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}
