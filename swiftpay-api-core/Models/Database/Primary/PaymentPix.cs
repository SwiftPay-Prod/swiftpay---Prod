using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Dados especificos de pagamento PIX.
/// Armazena informacoes do QR Code e dados do pagador.
/// </summary>
public class PaymentPix : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    
    public Guid PaymentId { get; set; }
    
    /// <summary>
    /// TxId do PIX (identificador unico da transacao PIX)
    /// </summary>
    public string? TxId { get; set; }
    
    /// <summary>
    /// EndToEndId do PIX (ID de ponta a ponta gerado pelo BACEN)
    /// </summary>
    public string? EndToEndId { get; set; }
    
    /// <summary>
    /// Payload do QR Code PIX (EMV)
    /// </summary>
    public string? QrCodePayload { get; set; }
    
    /// <summary>
    /// QR Code em Base64 (imagem PNG)
    /// </summary>
    public string? QrCodeBase64 { get; set; }
    
    /// <summary>
    /// QR Code string para exibicao
    /// </summary>
    public string? QrCode { get; set; }
    
    /// <summary>
    /// Codigo copia e cola do PIX
    /// </summary>
    public string? CopyAndPaste { get; set; }
    
    /// <summary>
    /// Chave PIX utilizada para recebimento
    /// </summary>
    public string? PixKey { get; set; }
    
    /// <summary>
    /// Tipo da chave PIX (CPF, CNPJ, EMAIL, PHONE, EVP)
    /// </summary>
    public string? PixKeyType { get; set; }
    
    /// <summary>
    /// Nome do pagador
    /// </summary>
    public string? PayerName { get; set; }
    
    /// <summary>
    /// CPF/CNPJ do pagador (mascarado para LGPD)
    /// </summary>
    public string? PayerDocument { get; set; }
    
    /// <summary>
    /// Banco do pagador
    /// </summary>
    public string? PayerBank { get; set; }
    
    /// <summary>
    /// Agencia do pagador
    /// </summary>
    public string? PayerBranch { get; set; }
    
    /// <summary>
    /// Conta do pagador (mascarada)
    /// </summary>
    public string? PayerAccount { get; set; }
    
    /// <summary>
    /// Data/hora do pagamento informado pelo PSP
    /// </summary>
    public DateTime? PaidAt { get; set; }
    
    /// <summary>
    /// Data/hora de expiracao do QR Code
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    // Relationships
    public Payment Payment { get; set; } = null!;
}
