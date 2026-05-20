using FastEndpoints;
using FluentValidation;
using safefy_api_payment.Endpoints.Customers.Create;
using safefy_api_payment.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api_payment.Endpoints.Customers.Update;

public class UpdateCustomerRequest
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Document { get; set; }
    public CustomerDocumentType? DocumentType { get; set; }
    public string? Phone { get; set; }
    public CustomerStatus? Status { get; set; }
    public string? Metadata { get; set; }
    
    // Address fields
    public string? AddressStreet { get; set; }
    public string? AddressNumber { get; set; }
    public string? AddressComplement { get; set; }
    public string? AddressNeighborhood { get; set; }
    public string? AddressCity { get; set; }
    public string? AddressState { get; set; }
    public string? AddressPostalCode { get; set; }
    public string? AddressCountry { get; set; }
}

public class UpdateCustomerRequestValidator : Validator<UpdateCustomerRequest>
{
    public UpdateCustomerRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(255).When(x => !string.IsNullOrEmpty(x.Name))
            .WithMessage("O nome deve ter no m�ximo 255 caracteres.");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("E-mail inv�lido.")
            .MaximumLength(255).When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("O e-mail deve ter no m�ximo 255 caracteres.");

        RuleFor(x => x.Document)
            .MaximumLength(14).When(x => !string.IsNullOrEmpty(x.Document))
            .WithMessage("O documento deve ter no m�ximo 14 caracteres.")
            .Matches(@"^\d+$").When(x => !string.IsNullOrEmpty(x.Document))
            .WithMessage("O documento deve conter apenas n�meros.");

        RuleFor(x => x.Phone)
            .Must(BeValidPhone)
            .When(x => !string.IsNullOrWhiteSpace(x.Phone))
            .WithMessage("O telefone deve conter entre 10 e 15 d�gitos, incluindo o c�digo do pa�s.");
    }

    private static bool BeValidPhone(string? phone)
    {
        var normalizedPhone = SanitizeUtils.SanitizePhone(phone);
        return !string.IsNullOrEmpty(normalizedPhone) && normalizedPhone.Length is >= 10 and <= 15;
    }
}

public class UpdateCustomerResponse : BaseResponse<CustomerData> { }
