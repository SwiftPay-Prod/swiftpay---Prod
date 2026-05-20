using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Customers.UpdateCustomer;

public sealed class UpdateCustomerRequest
{
    public Guid MerchantId { get; set; }
    public Guid CustomerId { get; set; }
    public string? ExternalId { get; set; }
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

public sealed class UpdateCustomerRequestValidator : Validator<UpdateCustomerRequest>
{
    public UpdateCustomerRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.CustomerId).NotEmpty().WithMessage("O identificador do cliente é obrigatório.");
        RuleFor(x => x.Name).MaximumLength(200).WithMessage("O nome deve ter no máximo 200 caracteres.");
        RuleFor(x => x.Email).EmailAddress().WithMessage("O email deve ser válido.").When(x => !string.IsNullOrEmpty(x.Email))
            .MaximumLength(200).WithMessage("O email deve ter no máximo 200 caracteres.");
        RuleFor(x => x.ExternalId).MaximumLength(100).WithMessage("O ID externo deve ter no máximo 100 caracteres.");
        RuleFor(x => x.Document).MaximumLength(20).WithMessage("O documento deve ter no máximo 20 caracteres.");
        RuleFor(x => x.Phone).MaximumLength(20).WithMessage("O telefone deve ter no máximo 20 caracteres.");
        RuleFor(x => x.Metadata).MaximumLength(2000).WithMessage("Os metadados devem ter no máximo 2000 caracteres.");
    }
}

public sealed class UpdateCustomerResponse : BaseResponse<CustomerData>;
