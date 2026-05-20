namespace safefy_api_core.Constants;

/// <summary>
/// Códigos de erro da API de Pagamentos (safefy-api-payment).
/// Estes códigos são utilizados para identificação programática de erros.
/// </summary>
public static class PaymentApiErrorCodes
{
    /// <summary>
    /// Token de autenticação inválido ou expirado.
    /// </summary>
    public const string InvalidToken = "invalid_token";

    /// <summary>
    /// Operação disponível apenas em ambiente Sandbox.
    /// </summary>
    public const string SandboxOnly = "sandbox_only";

    /// <summary>
    /// Saques não são permitidos em ambiente Sandbox.
    /// </summary>
    public const string SandboxWithdrawalNotAllowed = "sandbox_withdrawal_not_allowed";

    /// <summary>
    /// Pagamento não encontrado.
    /// </summary>
    public const string PaymentNotFound = "payment_not_found";

    /// <summary>
    /// Status inválido para a operação solicitada.
    /// </summary>
    public const string InvalidStatus = "invalid_status";

    /// <summary>
    /// Erro ao registrar transação no ledger.
    /// </summary>
    public const string LedgerError = "ledger_error";

    /// <summary>
    /// Cobrança PIX não encontrada.
    /// </summary>
    public const string PixNotFound = "pix_not_found";

    /// <summary>
    /// Limite de requisições excedido.
    /// </summary>
    public const string RateLimitExceeded = "rate_limit_exceeded";

    /// <summary>
    /// Limite de geração de tokens excedido. Aguarde antes de tentar novamente.
    /// </summary>
    public const string AuthRateLimitExceeded = "auth_rate_limit_exceeded";

    /// <summary>
    /// Credenciais de API inválidas.
    /// </summary>
    public const string InvalidCredentials = "invalid_credentials";

    /// <summary>
    /// Credencial de API não encontrada.
    /// </summary>
    public const string CredentialNotFound = "credential_not_found";

    /// <summary>
    /// Credencial de API inativa ou revogada.
    /// </summary>
    public const string CredentialInactive = "credential_inactive";

    /// <summary>
    /// Conta do merchant está inativa.
    /// </summary>
    public const string MerchantInactive = "merchant_inactive";

    /// <summary>
    /// Acesso não autorizado a partir deste endereço IP.
    /// </summary>
    public const string IpNotAllowed = "ip_not_allowed";

    /// <summary>
    /// Cliente não encontrado.
    /// </summary>
    public const string CustomerNotFound = "customer_not_found";

    /// <summary>
    /// Já existe um registro com este external_id.
    /// </summary>
    public const string DuplicateExternalId = "duplicate_external_id";

    /// <summary>
    /// Já existe um cliente com este CPF/CNPJ.
    /// </summary>
    public const string DuplicateDocument = "duplicate_document";

    /// <summary>
    /// Nenhum adquirente configurado para o merchant.
    /// </summary>
    public const string NoAcquirerConfigured = "no_acquirer_configured";

    /// <summary>
    /// A nominal/adquirente atribuida ao merchant esta desabilitada.
    /// </summary>
    public const string NominalDisabled = "nominal_disabled";

    /// <summary>
    /// Método de pagamento não está habilitado para esta conta.
    /// </summary>
    public const string PaymentMethodDisabled = "payment_method_disabled";

    /// <summary>
    /// Subconta externa da organização não está ativa para operação.
    /// </summary>
    public const string ExternalSubmerchantNotActive = "external_submerchant_not_active";

    /// <summary>
    /// Falha na geração do PIX.
    /// </summary>
    public const string PixGenerationFailed = "pix_generation_failed";

    /// <summary>
    /// Método de pagamento não suportado.
    /// </summary>
    public const string UnsupportedPaymentMethod = "unsupported_payment_method";

    /// <summary>
    /// Método de pagamento inválido para os dados enviados.
    /// </summary>
    public const string InvalidPaymentMethod = "invalid_payment_method";

    /// <summary>
    /// Data de vencimento de boleto inválida.
    /// </summary>
    public const string InvalidBoletoDueDate = "invalid_boleto_due_date";

    /// <summary>
    /// Produto não encontrado.
    /// </summary>
    public const string ProductNotFound = "product_not_found";

    /// <summary>
    /// Variante não encontrada.
    /// </summary>
    public const string VariantNotFound = "variant_not_found";

    /// <summary>
    /// Produto sem preço definido.
    /// </summary>
    public const string ProductPriceNotSet = "product_price_not_set";

    /// <summary>
    /// Itens inválidos.
    /// </summary>
    public const string InvalidItems = "invalid_items";

    /// <summary>
    /// Erro interno no servidor.
    /// </summary>
    public const string InternalError = "internal_error";

    /// <summary>
    /// Chave de API interna ausente.
    /// </summary>
    public const string InternalApiKeyMissing = "internal_api_key_missing";

    /// <summary>
    /// Chave de API interna inválida.
    /// </summary>
    public const string InternalApiKeyInvalid = "internal_api_key_invalid";

    /// <summary>
    /// Saque não encontrado.
    /// </summary>
    public const string CashoutNotFound = "cashout_not_found";

    /// <summary>
    /// Conta de saque não encontrada.
    /// </summary>
    public const string PayoutAccountNotFound = "payout_account_not_found";

    /// <summary>
    /// Saldo insuficiente para saque.
    /// </summary>
    public const string InsufficientBalance = "insufficient_balance";

    /// <summary>
    /// Valor abaixo do mínimo permitido.
    /// </summary>
    public const string AmountBelowMinimum = "amount_below_minimum";

    /// <summary>
    /// Saque deve ser exatamente o valor disponível no ciclo atual.
    /// </summary>
    public const string FullWithdrawalRequired = "full_withdrawal_required";

    /// <summary>
    /// Valor acima do máximo permitido.
    /// </summary>
    public const string AmountAboveMaximum = "amount_above_maximum";

    /// <summary>
    /// Valor informado é inválido (erro genérico para limite de adquirente).
    /// </summary>
    public const string InvalidAmount = "invalid_amount";
}