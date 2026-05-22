using FluentValidation;
using Swiftpay.Application.Features.Auth.Commands;

namespace Swiftpay.Application.Features.Auth.DTOs;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
            .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
            .Matches(@"[0-9]").WithMessage("Password must contain at least one number");

        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Company name is required")
            .MaximumLength(200).WithMessage("Company name must not exceed 200 characters");

        RuleFor(x => x.Document)
            .NotEmpty().WithMessage("Document is required")
            .MaximumLength(20).WithMessage("Document must not exceed 20 characters");
    }
}
