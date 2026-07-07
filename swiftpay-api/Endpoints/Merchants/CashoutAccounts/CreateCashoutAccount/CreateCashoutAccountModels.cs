using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.CashoutAccounts.CreateCashoutAccount;

public sealed class CreateCashoutAccountRequest
{
    public Guid MerchantId { get; set; }
    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = string.Empty;
    public string HolderName { get; set; } = string.Empty;
    public string? BankName { get; set; }
    public bool IsDefault { get; set; } = false;
}

public sealed class CreateCashoutAccountRequestValidator : Validator<CreateCashoutAccountRequest>
{
    public CreateCashoutAccountRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.PixKeyType)
            .IsInEnum()
            .WithMessage("Tipo de chave PIX inválido.");

        RuleFor(x => x.PixKey)
            .NotEmpty()
            .WithMessage("A chave PIX é obrigatória.")
            .MaximumLength(100)
            .WithMessage("A chave PIX deve ter no máximo 100 caracteres.");

        RuleFor(x => x.PixKey)
            .Matches(@"^\d{11}$")
            .When(x => x.PixKeyType == PixKeyType.Cpf)
            .WithMessage("CPF deve conter exatamente 11 dígitos.");

        RuleFor(x => x.PixKey)
            .Matches(@"^\d{14}$")
            .When(x => x.PixKeyType == PixKeyType.Cnpj)
            .WithMessage("CNPJ deve conter exatamente 14 dígitos.");

        RuleFor(x => x.PixKey)
            .EmailAddress()
            .When(x => x.PixKeyType == PixKeyType.Email)
            .WithMessage("E-mail inválido.");

        RuleFor(x => x.PixKey)
            .Matches(@"^\+55\d{10,11}$")
            .When(x => x.PixKeyType == PixKeyType.Phone)
            .WithMessage("Telefone deve estar no formato +55XXXXXXXXXXX.");

        RuleFor(x => x.PixKey)
            .Matches(@"^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$", System.Text.RegularExpressions.RegexOptions.IgnoreCase)
            .When(x => x.PixKeyType == PixKeyType.Random)
            .WithMessage("Chave aleatória deve ser um UUID válido.");

        RuleFor(x => x.HolderName)
            .NotEmpty()
            .WithMessage("O nome do titular é obrigatório.")
            .MaximumLength(100)
            .WithMessage("O nome do titular deve ter no máximo 100 caracteres.");

        RuleFor(x => x.BankName)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.BankName))
            .WithMessage("O nome do banco deve ter no máximo 100 caracteres.");
    }
}

public sealed class CreateCashoutAccountResponse : BaseResponse<CashoutAccountData>;

public sealed class CashoutAccountData
{
    public Guid Id { get; set; }
    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = string.Empty;
    public string? HolderName { get; set; }
    public PayoutAccountStatus Status { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
}
