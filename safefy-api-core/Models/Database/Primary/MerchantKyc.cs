using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

public class MerchantKyc : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    
    // Legal Information
    public string? LegalName { get; set; }
    public MerchantKycDocumentType? DocumentType { get; set; }
    public string? DocumentNumber { get; set; }
    
    // Identity Document
    public MerchantIdentityDocumentType? IdentityDocumentType { get; set; }
    public string? IdentityDocumentNumber { get; set; }
    
    // Document File IDs (relationships with StoredFile)
    public Guid? ProofOfAddressFileId { get; set; }
    public Guid? DocumentFrontFileId { get; set; }
    public Guid? DocumentBackFileId { get; set; }
    public Guid? SelfieFileId { get; set; }
    public Guid? CnpjCardFileId { get; set; }
    public Guid? CompanyContractFileId { get; set; }
    
    // Business Information
    public MerchantKycOperationType? OperationType { get; set; }
    public string? BusinessDescription { get; set; }
    public string? Website { get; set; }
    public decimal? ExpectedMonthlyVolume { get; set; }
    public decimal? MonthlyRevenue { get; set; }
    public decimal? AverageTicket { get; set; }
    public bool UsesPix { get; set; } = false;
    public bool UsesBoleto { get; set; } = false;
    public bool UsesCreditCard { get; set; } = false;
    
    // Admin fields
    public string? AdminNotes { get; set; }
    public string? RejectionReason { get; set; }
    public string? ApprovalReason { get; set; }

    // Relationships
    public Merchant Merchant { get; set; } = null!;
    public StoredFile? ProofOfAddressFile { get; set; }
    public StoredFile? DocumentFrontFile { get; set; }
    public StoredFile? DocumentBackFile { get; set; }
    public StoredFile? SelfieFile { get; set; }
    public StoredFile? CnpjCardFile { get; set; }
    public StoredFile? CompanyContractFile { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantKycDocumentType
{
    CPF,
    CNPJ
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantIdentityDocumentType
{
    RG,
    CNH,
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantKycOperationType
{
    Black,
    White
}