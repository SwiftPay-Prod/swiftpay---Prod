using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Acquirers.UpdateAcquirer;

public sealed class UpdateAcquirerRequest
{
    public Guid AcquirerId { get; set; }
    public string? DisplayName { get; set; }
    public string? Nominal { get; set; }
    public string? LogoUrl { get; set; }
    public bool? IsActive { get; set; }
    public bool? HideFromMerchantNominalSelection { get; set; }
    public List<AcquirerOperationType>? OperationTypes { get; set; }
    
    // Funcionalidades (o que a adquirente suporta tecnicamente)
    public bool? SupportsPix { get; set; }
    public bool? SupportsBoleto { get; set; }
    public bool? SupportsCreditCard { get; set; }
    public bool? SupportsWithdrawal { get; set; }
    
    // Operações habilitadas (operações ativas nesta instância)
    public bool? PixEnabled { get; set; }
    public bool? BoletoEnabled { get; set; }
    public bool? CreditCardEnabled { get; set; }

    // Settlement compensation configuration
    public bool? PixHasCompensation { get; set; }
    public int? PixCompensationDays { get; set; }
    public bool? BoletoHasCompensation { get; set; }
    public int? BoletoCompensationDays { get; set; }
    public bool? CreditCardHasCompensation { get; set; }
    public int? CreditCardCompensationDays { get; set; }
    
    public WebhookAuthMode? WebhookAuthMode { get; set; }
    public string? WebhookToken { get; set; }
    public string? WebhookAllowedIps { get; set; }
    public string? ApiBaseUrlProduction { get; set; }
    public string? ApiBaseUrlSandbox { get; set; }
    
    // Credential System (dynamic credentials based on schema)
    public Dictionary<string, string>? DefaultCredentials { get; set; }
    public Dictionary<string, string>? DefaultCredentialsSandbox { get; set; }

    // Access accounts in acquirer panel/site
    public List<AcquirerPortalAccessAccountInput>? AccessAccounts { get; set; }
    
    // PIX In Fees (Acquirer charges)
    public FeeChargeMode? PixInFeeMode { get; set; }
    public long? PixInFeeFixed { get; set; }
    public int? PixInFeePercentage { get; set; }

    // BOLETO In Fees (Acquirer charges)
    public FeeChargeMode? BoletoInFeeMode { get; set; }
    public long? BoletoInFeeFixed { get; set; }
    public int? BoletoInFeePercentage { get; set; }

    // CREDIT CARD In Fees (Acquirer charges)
    public FeeChargeMode? CreditCardInFeeMode { get; set; }
    public long? CreditCardInFeeFixed { get; set; }
    public int? CreditCardInFeePercentage { get; set; }
    
    // Payout Fees (Acquirer charges)
    public FeeChargeMode? PayoutFeeMode { get; set; }
    public long? PayoutFeeFixed { get; set; }
    public int? PayoutFeePercentage { get; set; }
    public PayoutFeeHandling? PayoutFeeHandling { get; set; }
    
    // Fee Split Handling (Auto split by acquirer)
    public PaymentFeeSplitHandling? PixFeeSplitHandling { get; set; }
    public PaymentFeeSplitHandling? BoletoFeeSplitHandling { get; set; }
    public PaymentFeeSplitHandling? CreditCardFeeSplitHandling { get; set; }
    
    // ==========================================
    // LIMITES DE TRANSAÇÃO
    // ==========================================
    
    // PIX Limits
    public long? MinPixAmount { get; set; }
    public long? MaxPixAmount { get; set; }
    
    // Boleto Limits
    public long? MinBoletoAmount { get; set; }
    public long? MaxBoletoAmount { get; set; }
    
    // Credit Card Limits
    public long? MinCreditCardAmount { get; set; }
    public long? MaxCreditCardAmount { get; set; }
    
    // Payout Limits
    public long? MinPayoutAmount { get; set; }
    public long? MaxPayoutAmount { get; set; }
    
    // Sync to MerchantAcquirers
    public bool SyncToMerchantAcquirers { get; set; } = false;
}

public sealed class UpdateAcquirerRequestValidator : Validator<UpdateAcquirerRequest>
{
    public UpdateAcquirerRequestValidator()
    {
        RuleFor(x => x.AcquirerId)
            .NotEmpty()
            .WithMessage("O identificador da adquirente é obrigatório.");

        RuleFor(x => x.OperationTypes)
            .Must(types => types == null || types.All(t => Enum.IsDefined(typeof(AcquirerOperationType), t)))
            .WithMessage("Tipos de operação inválidos.");

        RuleFor(x => x.WebhookAuthMode)
            .IsInEnum()
            .When(x => x.WebhookAuthMode.HasValue)
            .WithMessage("Modo de autenticação inválido.");

        RuleFor(x => x.WebhookAllowedIps)
            .Must(BeValidIpList)
            .When(x => !string.IsNullOrEmpty(x.WebhookAllowedIps))
            .WithMessage("Lista de IPs inválida. Use IPs separados por vírgula (ex: 192.168.1.1,10.0.0.0/24).");

        RuleFor(x => x.AccessAccounts)
            .Must(accounts => accounts == null || accounts.Count <= 20)
            .WithMessage("Informe no máximo 20 contas de acesso.");

        RuleForEach(x => x.AccessAccounts)
            .ChildRules(account =>
            {
                account.RuleFor(a => a.Login)
                    .NotEmpty()
                    .WithMessage("O login da conta de acesso é obrigatório.")
                    .MaximumLength(150)
                    .WithMessage("O login da conta de acesso deve ter no máximo 150 caracteres.");

                account.RuleFor(a => a.Password)
                    .NotEmpty()
                    .WithMessage("A senha da conta de acesso é obrigatória.")
                    .MaximumLength(150)
                    .WithMessage("A senha da conta de acesso deve ter no máximo 150 caracteres.");

                account.RuleFor(a => a.Description)
                    .MaximumLength(500)
                    .When(a => !string.IsNullOrWhiteSpace(a.Description))
                    .WithMessage("A descrição da conta de acesso deve ter no máximo 500 caracteres.");
            });

        RuleFor(x => x.PixInFeeMode)
            .IsInEnum()
            .When(x => x.PixInFeeMode.HasValue)
            .WithMessage("Modo de cobrança de taxa PIX In inválido.");

        RuleFor(x => x.PixInFeeFixed)
            .GreaterThanOrEqualTo(0)
            .When(x => x.PixInFeeFixed.HasValue)
            .WithMessage("A taxa fixa de PIX In não pode ser negativa.");

        RuleFor(x => x.PixInFeePercentage)
            .InclusiveBetween(0, 10000)
            .When(x => x.PixInFeePercentage.HasValue)
            .WithMessage("A taxa percentual de PIX In deve estar entre 0 e 10000 (0% a 100%).");

        RuleFor(x => x.BoletoInFeeMode)
            .IsInEnum()
            .When(x => x.BoletoInFeeMode.HasValue)
            .WithMessage("Modo de cobrança de taxa BOLETO In inválido.");

        RuleFor(x => x.BoletoInFeeFixed)
            .GreaterThanOrEqualTo(0)
            .When(x => x.BoletoInFeeFixed.HasValue)
            .WithMessage("A taxa fixa de BOLETO In não pode ser negativa.");

        RuleFor(x => x.BoletoInFeePercentage)
            .InclusiveBetween(0, 10000)
            .When(x => x.BoletoInFeePercentage.HasValue)
            .WithMessage("A taxa percentual de BOLETO In deve estar entre 0 e 10000 (0% a 100%).");

        RuleFor(x => x.CreditCardInFeeMode)
            .IsInEnum()
            .When(x => x.CreditCardInFeeMode.HasValue)
            .WithMessage("Modo de cobrança de taxa CARTÃO In inválido.");

        RuleFor(x => x.CreditCardInFeeFixed)
            .GreaterThanOrEqualTo(0)
            .When(x => x.CreditCardInFeeFixed.HasValue)
            .WithMessage("A taxa fixa de CARTÃO In não pode ser negativa.");

        RuleFor(x => x.CreditCardInFeePercentage)
            .InclusiveBetween(0, 10000)
            .When(x => x.CreditCardInFeePercentage.HasValue)
            .WithMessage("A taxa percentual de CARTÃO In deve estar entre 0 e 10000 (0% a 100%).");

        RuleFor(x => x.PayoutFeeMode)
            .IsInEnum()
            .When(x => x.PayoutFeeMode.HasValue)
            .WithMessage("Modo de cobrança de taxa de saque inválido.");

        RuleFor(x => x.PayoutFeeFixed)
            .GreaterThanOrEqualTo(0)
            .When(x => x.PayoutFeeFixed.HasValue)
            .WithMessage("A taxa fixa de saque não pode ser negativa.");

        RuleFor(x => x.PayoutFeePercentage)
            .InclusiveBetween(0, 10000)
            .When(x => x.PayoutFeePercentage.HasValue)
            .WithMessage("A taxa percentual de saque deve estar entre 0 e 10000 (0% a 100%).");

        RuleFor(x => x.PixCompensationDays)
            .GreaterThanOrEqualTo(0)
            .When(x => x.PixCompensationDays.HasValue)
            .WithMessage("A quantidade de dias de compensação do PIX não pode ser negativa.");

        RuleFor(x => x)
            .Must(x => x.PixHasCompensation != true || x.PixCompensationDays is >= 1)
            .WithMessage("Informe pelo menos 1 dia de compensação para PIX quando a compensação estiver habilitada.");

        RuleFor(x => x.BoletoCompensationDays)
            .GreaterThanOrEqualTo(0)
            .When(x => x.BoletoCompensationDays.HasValue)
            .WithMessage("A quantidade de dias de compensação do boleto não pode ser negativa.");

        RuleFor(x => x)
            .Must(x => x.BoletoHasCompensation != true || x.BoletoCompensationDays is >= 1)
            .WithMessage("Informe pelo menos 1 dia de compensação para boleto quando a compensação estiver habilitada.");

        RuleFor(x => x.CreditCardCompensationDays)
            .GreaterThanOrEqualTo(0)
            .When(x => x.CreditCardCompensationDays.HasValue)
            .WithMessage("A quantidade de dias de compensação do cartão não pode ser negativa.");

        RuleFor(x => x)
            .Must(x => x.CreditCardHasCompensation != true || x.CreditCardCompensationDays is >= 1)
            .WithMessage("Informe pelo menos 1 dia de compensação para cartão quando a compensação estiver habilitada.");

        // PIX Limits
        RuleFor(x => x.MinPixAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MinPixAmount.HasValue)
            .WithMessage("O valor mínimo de PIX não pode ser negativo.");

        RuleFor(x => x.MaxPixAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MaxPixAmount.HasValue)
            .WithMessage("O valor máximo de PIX não pode ser negativo.");

        RuleFor(x => x)
            .Must(x => !x.MinPixAmount.HasValue || !x.MaxPixAmount.HasValue || x.MaxPixAmount == 0 || x.MinPixAmount <= x.MaxPixAmount)
            .WithMessage("O valor mínimo de PIX não pode ser maior que o valor máximo.");

        // Boleto Limits
        RuleFor(x => x.MinBoletoAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MinBoletoAmount.HasValue)
            .WithMessage("O valor mínimo de Boleto não pode ser negativo.");

        RuleFor(x => x.MaxBoletoAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MaxBoletoAmount.HasValue)
            .WithMessage("O valor máximo de Boleto não pode ser negativo.");

        RuleFor(x => x)
            .Must(x => !x.MinBoletoAmount.HasValue || !x.MaxBoletoAmount.HasValue || x.MaxBoletoAmount == 0 || x.MinBoletoAmount <= x.MaxBoletoAmount)
            .WithMessage("O valor mínimo de Boleto não pode ser maior que o valor máximo.");

        // Credit Card Limits
        RuleFor(x => x.MinCreditCardAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MinCreditCardAmount.HasValue)
            .WithMessage("O valor mínimo de Cartão não pode ser negativo.");

        RuleFor(x => x.MaxCreditCardAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MaxCreditCardAmount.HasValue)
            .WithMessage("O valor máximo de Cartão não pode ser negativo.");

        RuleFor(x => x)
            .Must(x => !x.MinCreditCardAmount.HasValue || !x.MaxCreditCardAmount.HasValue || x.MaxCreditCardAmount == 0 || x.MinCreditCardAmount <= x.MaxCreditCardAmount)
            .WithMessage("O valor mínimo de Cartão não pode ser maior que o valor máximo.");

        // Payout Limits
        RuleFor(x => x.MinPayoutAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MinPayoutAmount.HasValue)
            .WithMessage("O valor mínimo de saque não pode ser negativo.");

        RuleFor(x => x.MaxPayoutAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MaxPayoutAmount.HasValue)
            .WithMessage("O valor máximo de saque não pode ser negativo.");

        RuleFor(x => x)
            .Must(x => !x.MinPayoutAmount.HasValue || !x.MaxPayoutAmount.HasValue || x.MaxPayoutAmount == 0 || x.MinPayoutAmount <= x.MaxPayoutAmount)
            .WithMessage("O valor mínimo de saque não pode ser maior que o valor máximo.");
    }

    private static bool BeValidIpList(string? ips)
    {
        if (string.IsNullOrEmpty(ips))
            return true;

        var ipList = ips.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        
        foreach (var ip in ipList)
        {
            if (ip == "*")
                continue;

            if (ip.Contains('/'))
            {
                var parts = ip.Split('/');
                if (parts.Length != 2)
                    return false;

                if (!System.Net.IPAddress.TryParse(parts[0], out _))
                    return false;

                if (!int.TryParse(parts[1], out var prefix) || prefix < 0 || prefix > 128)
                    return false;
            }
            else
            {
                if (!System.Net.IPAddress.TryParse(ip, out _))
                    return false;
            }
        }

        return true;
    }
}

public sealed class UpdateAcquirerResponse : BaseResponse<UpdateAcquirerData>;

public sealed class UpdateAcquirerData
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string? DisplayName { get; set; }
    public bool IsActive { get; set; }
    public bool HideFromMerchantNominalSelection { get; set; }
    public List<string> OperationTypes { get; set; } = [];
    
    // Funcionalidades (Capabilities)
    public bool SupportsPix { get; set; }
    public bool SupportsBoleto { get; set; }
    public bool SupportsCreditCard { get; set; }
    public bool SupportsWithdrawal { get; set; }
    
    // Operações Habilitadas
    public bool PixEnabled { get; set; }
    public bool BoletoEnabled { get; set; }
    public bool CreditCardEnabled { get; set; }

    // Settlement compensation configuration
    public bool PixHasCompensation { get; set; }
    public int PixCompensationDays { get; set; }
    public bool BoletoHasCompensation { get; set; }
    public int BoletoCompensationDays { get; set; }
    public bool CreditCardHasCompensation { get; set; }
    public int CreditCardCompensationDays { get; set; }
    
    public string WebhookAuthMode { get; set; } = null!;
    public bool HasWebhookToken { get; set; }
    public bool HasWebhookAllowedIps { get; set; }

    public List<AcquirerPortalAccessAccount> AccessAccounts { get; set; } = [];
}

public sealed class AcquirerPortalAccessAccountInput
{
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Description { get; set; }
}
