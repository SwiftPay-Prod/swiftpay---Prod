using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

public class MerchantKycPendingItem : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public Guid RequestedByUserId { get; set; }
    public MerchantKycPendingItemType Type { get; set; }
    public MerchantKycPendingField? FieldKey { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public MerchantKycPendingItemStatus Status { get; set; } = MerchantKycPendingItemStatus.Pending;
    public string? Response { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime? EvaluatedAt { get; set; }
    public string? AdminNotes { get; set; }

    public Merchant Merchant { get; set; } = null!;
    public User RequestedByUser { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantKycPendingItemType
{
    Document,
    Information,
    Clarification,
    Correction,
    Other
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantKycPendingField
{
    Name,
    Email,
    PhoneNumber,
    WhatsApp,
    Address,
    AddressNumber,
    AddressComplement,
    Neighborhood,
    City,
    State,
    PostalCode,
    Country,
    LegalName,
    DocumentType,
    DocumentNumber,
    IdentityDocumentType,
    IdentityDocumentNumber,
    OperationType,
    BusinessDescription,
    Website,
    MonthlyRevenue,
    AverageTicket,
    UsesPix,
    UsesBoleto,
    UsesCreditCard,
    ProofOfAddressFileId,
    DocumentFrontFileId,
    DocumentBackFileId,
    SelfieFileId,
    CnpjCardFileId,
    CompanyContractFileId
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantKycPendingItemStatus
{
    Pending,
    Responded,
    Approved,
    Rejected
}
