using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.PlatformPayoutAccounts.CreatePlatformPayoutAccount;

public sealed class CreatePlatformPayoutAccountRequest
{
    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = null!;
    public string? HolderName { get; set; }
    public string? HolderDocument { get; set; }
    public string? BankName { get; set; }
    public string? BankIspb { get; set; }
}

public sealed class CreatePlatformPayoutAccountRequestValidator : Validator<CreatePlatformPayoutAccountRequest>
{
    public CreatePlatformPayoutAccountRequestValidator()
    {
        RuleFor(x => x.PixKey)
            .NotEmpty().WithMessage("A chave PIX é obrigatória.");

        RuleFor(x => x.PixKeyType)
            .IsInEnum().WithMessage("O tipo de chave PIX é inválido.");

        RuleFor(x => x.HolderName)
            .NotEmpty().WithMessage("O nome do titular é obrigatório.");

        RuleFor(x => x.HolderDocument)
            .NotEmpty().WithMessage("O documento do titular é obrigatório.");
    }
}

public sealed class CreatePlatformPayoutAccountResponse : BaseResponse<AdminPlatformPayoutAccountData>;

public sealed class AdminPlatformPayoutAccountData
{
    public Guid Id { get; set; }
    public string PixKeyType { get; set; } = null!;
    public string PixKey { get; set; } = null!;
    public string? HolderName { get; set; }
    public string? HolderDocument { get; set; }
    public string? BankName { get; set; }
    public string? BankIspb { get; set; }
    public bool IsActive { get; set; }
    public DateTime? DeactivatedAt { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
