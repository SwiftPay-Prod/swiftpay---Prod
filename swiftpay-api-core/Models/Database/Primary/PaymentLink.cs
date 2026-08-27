using swiftpay_api_core.Models.Enum;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace swiftpay_api_core.Models.Database;

public class PaymentLink : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid MerchantId { get; set; }
    public Guid? PaymentId { get; set; }
    public string Token { get; set; } = string.Empty;
    public long Amount { get; set; }
    public string Currency { get; set; } = "BRL";
    public string? Description { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CallbackUrl { get; set; }
    public string EnabledMethods { get; set; } = string.Empty;
    public int? PixExpirationMinutes { get; set; }
    public DateTime? BoletoDueDate { get; set; }
    public string? BoletoInstructions { get; set; }
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;
    public DateTime? ExpiresAt { get; set; }
    public string? RedirectUrl { get; set; }
    public string? RequiredBuyerFields { get; set; }
    public bool ShowFees { get; set; }
    public bool PassFeeToCustomer { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? LogoUrl { get; set; }
    public string? ColorMode { get; set; }
    public string? ThemeMode { get; set; }
    public string? ProductName { get; set; }
    public string? ProductImageUrl { get; set; }
    // Modo do Pix Link — define estático vs dinâmico (sem expiração, reutilizável)
    public PixLinkMode PixLinkMode { get; set; } = PixLinkMode.Dynamic;

    public Merchant Merchant { get; set; } = null!;
    public Payment? Payment { get; set; }
}