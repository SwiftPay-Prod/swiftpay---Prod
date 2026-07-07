using FastEndpoints;
using FluentValidation;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api_payment.Endpoints.Customers.Create;

public class CreateCustomerRequest
{
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Document { get; set; }
    public CustomerDocumentType? DocumentType { get; set; }
    public string? Phone { get; set; }
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

public class CreateCustomerRequestValidator : Validator<CreateCustomerRequest>
{
    public CreateCustomerRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("O nome é obrigatório.")
            .MaximumLength(255).WithMessage("O nome deve ter no máximo 255 caracteres.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("O e-mail é obrigatório.")
            .EmailAddress().WithMessage("E-mail inválido.")
            .MaximumLength(255).WithMessage("O e-mail deve ter no máximo 255 caracteres.");

        RuleFor(x => x.Document)
            .MaximumLength(14).WithMessage("O documento deve ter no máximo 14 caracteres.")
            .Matches(@"^\d+$").When(x => !string.IsNullOrEmpty(x.Document))
            .WithMessage("O documento deve conter apenas números.");

        RuleFor(x => x.Phone)
            .Must(BeValidPhone)
            .When(x => !string.IsNullOrWhiteSpace(x.Phone))
            .WithMessage("O telefone deve conter entre 10 e 15 dígitos, incluindo o código do país.");

        RuleFor(x => x.ExternalId)
            .MaximumLength(255).WithMessage("O external_id deve ter no máximo 255 caracteres.");
    }

    private static bool BeValidPhone(string? phone)
    {
        var normalizedPhone = SanitizeUtils.SanitizePhone(phone);
        return !string.IsNullOrEmpty(normalizedPhone) && normalizedPhone.Length is >= 10 and <= 15;
    }
}

public class CreateCustomerResponse : BaseResponse<CustomerData> { }

public class CustomerData
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Document { get; set; }
    public CustomerDocumentType? DocumentType { get; set; }
    public string? Phone { get; set; }
    public CustomerStatus Status { get; set; }
    public string? Metadata { get; set; }
    public CustomerAddressData? Address { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CustomerAddressData
{
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
}
