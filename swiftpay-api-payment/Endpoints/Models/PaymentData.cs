using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_payment.Endpoints.Models;

/// <summary>
/// Dados de um pagamento (genérico para todos os métodos).
/// </summary>
public class PaymentData
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public long Amount { get; set; }
    public long Fee { get; set; }
    public long NetAmount { get; set; }
    public CurrencyType Currency { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }
    public string? Description { get; set; }
    public ApiEnvironment Environment { get; set; }
    public Guid? CustomerId { get; set; }
    public PixData? Pix { get; set; }
    public string? Metadata { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

/// <summary>
/// Dados específicos do PIX.
/// </summary>
public class PixData
{
    public string? TxId { get; set; }
    public string? EndToEndId { get; set; }
    public string? QrCode { get; set; }
    public string? CopyAndPaste { get; set; }
    public string? PayerName { get; set; }
    public string? PayerDocument { get; set; }
    public string? PayerBank { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
