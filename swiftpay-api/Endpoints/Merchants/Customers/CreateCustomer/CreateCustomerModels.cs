using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Customers.CreateCustomer;

public sealed class CreateCustomerRequest
{
    public Guid MerchantId { get; set; }
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

public sealed class CreateCustomerRequestValidator : Validator<CreateCustomerRequest>
{
    public CreateCustomerRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.Name).NotEmpty().WithMessage("O nome do cliente é obrigatório.")
            .MaximumLength(200).WithMessage("O nome deve ter no máximo 200 caracteres.");
        RuleFor(x => x.Email).NotEmpty().WithMessage("O email do cliente é obrigatório.")
            .EmailAddress().WithMessage("O email deve ser válido.")
            .MaximumLength(200).WithMessage("O email deve ter no máximo 200 caracteres.");
        RuleFor(x => x.ExternalId).MaximumLength(100).WithMessage("O ID externo deve ter no máximo 100 caracteres.");
        RuleFor(x => x.Document).MaximumLength(20).WithMessage("O documento deve ter no máximo 20 caracteres.");
        RuleFor(x => x.Phone).MaximumLength(20).WithMessage("O telefone deve ter no máximo 20 caracteres.");
        RuleFor(x => x.Metadata).MaximumLength(2000).WithMessage("Os metadados devem ter no máximo 2000 caracteres.");
    }
}

public sealed class CreateCustomerResponse : BaseResponse<CustomerData>;
