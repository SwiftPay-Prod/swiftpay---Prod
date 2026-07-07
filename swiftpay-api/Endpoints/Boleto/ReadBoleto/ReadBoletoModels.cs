using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Boleto.ReadBoleto;

public sealed class ReadBoletoResponse : BaseResponse<ReadBoletoData>;

public sealed class ReadBoletoData
{
    public Guid PaymentId { get; set; }
    public string MerchantName { get; set; } = string.Empty;
    public long Amount { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string? DigitableLine { get; set; }
    public string? PdfUrl { get; set; }
    public string? BoletoUrl { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsExpired { get; set; }
    public DateTime CreatedAt { get; set; }
}
