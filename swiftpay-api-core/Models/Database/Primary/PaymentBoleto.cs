using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Dados especificos de pagamento via boleto.
/// </summary>
public class PaymentBoleto : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid PaymentId { get; set; }

    /// <summary>
    /// Codigo de barras do boleto.
    /// </summary>
    public string? Barcode { get; set; }

    /// <summary>
    /// Linha digitavel do boleto.
    /// </summary>
    public string? DigitableLine { get; set; }

    /// <summary>
    /// URL para download do PDF do boleto.
    /// </summary>
    public string? PdfUrl { get; set; }

    /// <summary>
    /// Nome do beneficiario/destinatario do boleto.
    /// </summary>
    public string? RecipientName { get; set; }

    /// <summary>
    /// Documento do beneficiario/destinatario do boleto.
    /// </summary>
    public string? RecipientDocument { get; set; }

    /// <summary>
    /// Codigo PIX copia e cola vinculado ao boleto (quando disponivel).
    /// </summary>
    public string? PixCopyAndPaste { get; set; }

    /// <summary>
    /// Data de expiração do PIX vinculado ao boleto (quando disponivel).
    /// </summary>
    public DateTime? PixExpiresAt { get; set; }

    /// <summary>
    /// Data de vencimento do boleto.
    /// </summary>
    public DateTime? DueDate { get; set; }

    // Relationships
    public Payment Payment { get; set; } = null!;
}
