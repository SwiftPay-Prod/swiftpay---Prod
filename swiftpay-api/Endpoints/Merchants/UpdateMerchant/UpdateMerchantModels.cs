using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Merchants.Shared.Models;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.UpdateMerchant;

public sealed class UpdateMerchantRequest
{
    public Guid Id { get; set; }

    // Basic Info (Step 1)
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? WhatsApp { get; set; }

    // Address (Step 2)
    public string? Address { get; set; }
    public string? AddressNumber { get; set; }
    public string? AddressComplement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }

    // KYC Documents (Step 3)
    public string? LegalName { get; set; }
    public MerchantKycDocumentType? DocumentType { get; set; }
    public string? DocumentNumber { get; set; }
    public MerchantIdentityDocumentType? IdentityDocumentType { get; set; }
    public string? IdentityDocumentNumber { get; set; }
    public MerchantKycOperationType? OperationType { get; set; }
    public string? BusinessDescription { get; set; }
    public string? Website { get; set; }
    public bool? UsesPix { get; set; }
    public bool? UsesBoleto { get; set; }
    public bool? UsesCreditCard { get; set; }

    // Billing (Step 4)
    public decimal? MonthlyRevenue { get; set; }
    public decimal? AverageTicket { get; set; }

    // Document File IDs (retornados pelo endpoint de upload)
    public Guid? ProofOfAddressFileId { get; set; }
    public Guid? DocumentFrontFileId { get; set; }
    public Guid? DocumentBackFileId { get; set; }
    public Guid? CnpjCardFileId { get; set; }
    public Guid? CompanyContractFileId { get; set; }
    public Guid? SelfieFileId { get; set; }
}

public sealed class UpdateMerchantValidator : Validator<UpdateMerchantRequest>
{
    public UpdateMerchantValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        // Basic Info
        RuleFor(x => x.Name)
            .NotEmpty()
            .When(x => x.Name != null)
            .WithMessage("O nome não pode estar vazio.")
            .MaximumLength(200)
            .When(x => x.Name != null)
            .WithMessage("O nome deve ter no máximo 200 caracteres.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .When(x => x.Email != null)
            .WithMessage("O e-mail não pode estar vazio.")
            .EmailAddress()
            .When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("E-mail inválido.");

        RuleFor(x => x.WhatsApp)
            .NotEmpty()
            .When(x => x.WhatsApp != null)
            .WithMessage("O WhatsApp não pode estar vazio.")
            .Must(phone => phone == null || phone.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "").Length >= 10)
            .When(x => !string.IsNullOrEmpty(x.WhatsApp))
            .WithMessage("O WhatsApp deve ter pelo menos 10 dígitos.");

        // Address
        RuleFor(x => x.Address)
            .NotEmpty()
            .When(x => x.Address != null)
            .WithMessage("O logradouro não pode estar vazio.");

        RuleFor(x => x.AddressNumber)
            .NotEmpty()
            .When(x => x.AddressNumber != null)
            .WithMessage("O número do endereço não pode estar vazio.");

        RuleFor(x => x.Neighborhood)
            .NotEmpty()
            .When(x => x.Neighborhood != null)
            .WithMessage("O bairro não pode estar vazio.");

        RuleFor(x => x.City)
            .NotEmpty()
            .When(x => x.City != null)
            .WithMessage("A cidade não pode estar vazia.");

        RuleFor(x => x.State)
            .NotEmpty()
            .When(x => x.State != null)
            .WithMessage("O estado não pode estar vazio.");

        RuleFor(x => x.PostalCode)
            .NotEmpty()
            .When(x => x.PostalCode != null)
            .WithMessage("O CEP não pode estar vazio.")
            .Must(cep =>
            {
                if (string.IsNullOrEmpty(cep)) return true;
                var sanitized = cep.Replace("-", "").Replace(".", "");
                return sanitized.Length == 8 && sanitized.All(char.IsDigit);
            })
            .When(x => !string.IsNullOrEmpty(x.PostalCode))
            .WithMessage("O CEP deve ter 8 dígitos.");

        // KYC - Legal Info
        RuleFor(x => x.LegalName)
            .NotEmpty()
            .When(x => x.LegalName != null)
            .WithMessage("A razão social não pode estar vazia.");

        RuleFor(x => x.DocumentNumber)
            .NotEmpty()
            .When(x => x.DocumentNumber != null)
            .WithMessage("O número do documento não pode estar vazio.")
            .Must((req, docNumber) =>
            {
                if (string.IsNullOrEmpty(docNumber)) return true;
                if (req.DocumentType == MerchantKycDocumentType.CPF)
                    return DocumentUtils.IsValidCpf(docNumber);
                if (req.DocumentType == MerchantKycDocumentType.CNPJ)
                    return DocumentUtils.IsValidCnpj(docNumber);
                return DocumentUtils.IsValidCpf(docNumber) || DocumentUtils.IsValidCnpj(docNumber);
            })
            .When(x => !string.IsNullOrEmpty(x.DocumentNumber))
            .WithMessage("O CPF ou CNPJ informado é inválido.");

        // KYC - Identity Document
        RuleFor(x => x.IdentityDocumentNumber)
            .NotEmpty()
            .When(x => x.IdentityDocumentNumber != null)
            .WithMessage("O número do documento de identidade não pode estar vazio.");

        // KYC - Business Info
        RuleFor(x => x.BusinessDescription)
            .NotEmpty()
            .When(x => x.BusinessDescription != null)
            .WithMessage("A descrição do negócio não pode estar vazia.")
            .MinimumLength(10)
            .When(x => !string.IsNullOrEmpty(x.BusinessDescription))
            .WithMessage("A descrição do negócio deve ter pelo menos 10 caracteres.");

        RuleFor(x => x.Website)
            .NotEmpty()
            .When(x => x.Website != null)
            .WithMessage("O website não pode estar vazio.")
            .MaximumLength(200)
            .When(x => x.Website != null)
            .WithMessage("O website deve ter no máximo 200 caracteres.");

        RuleFor(x => x.MonthlyRevenue)
            .GreaterThan(0)
            .When(x => x.MonthlyRevenue.HasValue)
            .WithMessage("A receita mensal deve ser maior que zero.");

        RuleFor(x => x.AverageTicket)
            .GreaterThan(0)
            .When(x => x.AverageTicket.HasValue)
            .WithMessage("O ticket médio deve ser maior que zero.");
    }
}

public sealed class UpdateMerchantResponse : BaseResponse<MerchantData>;
