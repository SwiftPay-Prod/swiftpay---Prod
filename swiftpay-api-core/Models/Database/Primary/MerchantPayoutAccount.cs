using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

public class MerchantPayoutAccount : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }

    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = null!;

    public string? HolderName { get; set; }
    public string? HolderDocument { get; set; }
    public string? BankName { get; set; }
    public string? BankIspb { get; set; }

    public PayoutAccountStatus Status { get; set; } = PayoutAccountStatus.Pending;
    public bool IsDefault { get; set; } = false;

    // Relationships
    public Merchant Merchant { get; set; } = null!;
    public ICollection<Payout> Payouts { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PixKeyType
{
    Cpf,
    Cnpj,
    Email,
    Phone,
    Random
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PayoutAccountStatus
{
    Pending,
    Active,
    Inactive,
    Rejected
}
