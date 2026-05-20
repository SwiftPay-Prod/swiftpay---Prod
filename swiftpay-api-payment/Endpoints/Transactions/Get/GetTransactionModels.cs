using FastEndpoints;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Endpoints.Transactions.Create;

namespace safefy_api_payment.Endpoints.Transactions.Get;

/// <summary>
/// Request para obter uma transação por ID.
/// </summary>
public sealed class GetTransactionRequest
{
    /// <summary>
    /// ID da transação.
    /// </summary>
    public Guid TransactionId { get; set; }
}

/// <summary>
/// Response da transação.
/// </summary>
public sealed class GetTransactionResponse : BaseResponse<TransactionDetailData>;

/// <summary>
/// Dados detalhados de uma transação.
/// </summary>
public sealed class TransactionDetailData
{
    /// <summary>
    /// ID da transação.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// ID externo.
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// Método de pagamento.
    /// </summary>
    public PaymentMethod Method { get; set; }

    /// <summary>
    /// Valor em centavos.
    /// </summary>
    public long Amount { get; set; }

    /// <summary>
    /// Taxa em centavos.
    /// </summary>
    public long Fee { get; set; }

    /// <summary>
    /// Valor líquido em centavos.
    /// </summary>
    public long NetAmount { get; set; }

    /// <summary>
    /// Moeda.
    /// </summary>
    public string Currency { get; set; } = "BRL";

    /// <summary>
    /// Status da transação.
    /// </summary>
    public PaymentStatus Status { get; set; }

    /// <summary>
    /// Descrição.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Motivo da falha (se aplicável).
    /// </summary>
    public string? FailureReason { get; set; }

    /// <summary>
    /// Ambiente.
    /// </summary>
    public ApiEnvironment Environment { get; set; }

    /// <summary>
    /// Metadados adicionais.
    /// </summary>
    public string? Metadata { get; set; }

    /// <summary>
    /// URL de callback.
    /// </summary>
    public string? CallbackUrl { get; set; }

    /// <summary>
    /// ID do cliente.
    /// </summary>
    public Guid? CustomerId { get; set; }

    /// <summary>
    /// ID do pedido (se for transação via e-commerce/checkout).
    /// </summary>
    public Guid? OrderId { get; set; }

    /// <summary>
    /// ID do produto - Deprecado: use Order.Items.
    /// </summary>
    [Obsolete("Use Order.Items para e-commerce.")]
    public Guid? ProductId { get; set; }

    /// <summary>
    /// ID da variante.
    /// </summary>
    public Guid? VariantId { get; set; }

    /// <summary>
    /// Data de expiração.
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Data de conclusão.
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Data de estorno.
    /// </summary>
    public DateTime? RefundedAt { get; set; }

    /// <summary>
    /// Data de criação.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Data de atualização.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Dados específicos do PIX (se aplicável).
    /// </summary>
    public PixDetailData? Pix { get; set; }

    /// <summary>
    /// Dados específicos do boleto (se aplicável).
    /// </summary>
    public BoletoTransactionData? Boleto { get; set; }

    /// <summary>
    /// Dados do cliente (se vinculado).
    /// </summary>
    public TransactionCustomerDetailData? Customer { get; set; }

    /// <summary>
    /// Itens da transação (se houver).
    /// </summary>
    public List<TransactionItemDetailData>? Items { get; set; }
}

/// <summary>
/// Item detalhado da transação.
/// </summary>
public sealed class TransactionItemDetailData
{
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public long? ProductPrice { get; set; }
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }
    public long? VariantPrice { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalAmount { get; set; }
}

/// <summary>
/// Dados do cliente na transação.
/// </summary>
public sealed class TransactionCustomerDetailData
{
    /// <summary>
    /// ID do cliente.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Nome do cliente.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Email do cliente.
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Documento do cliente.
    /// </summary>
    public string? Document { get; set; }

    /// <summary>
    /// Telefone do cliente.
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// Indica se os dados de contato foram substituidos por fallback tecnico.
    /// </summary>
    public bool HasFallbackContactData { get; set; }
}

/// <summary>
/// Dados detalhados de PIX.
/// </summary>
public sealed class PixDetailData
{
    /// <summary>
    /// TxId do PIX.
    /// </summary>
    public string? TxId { get; set; }

    /// <summary>
    /// Identificador End-to-End.
    /// </summary>
    public string? EndToEndId { get; set; }

    /// <summary>
    /// QR Code em base64.
    /// </summary>
    public string? QrCode { get; set; }

    /// <summary>
    /// Código copia e cola.
    /// </summary>
    public string? CopyAndPaste { get; set; }

    /// <summary>
    /// Nome do pagador.
    /// </summary>
    public string? PayerName { get; set; }

    /// <summary>
    /// CPF/CNPJ do pagador (parcialmente mascarado).
    /// </summary>
    public string? PayerDocument { get; set; }

    /// <summary>
    /// Banco do pagador.
    /// </summary>
    public string? PayerBank { get; set; }

    /// <summary>
    /// Data de expiração do QR Code.
    /// </summary>
    public DateTime? ExpiresAt { get; set; }
}
