using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.EmailTemplates.Shared.Models;

public sealed class EmailTemplateData
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public MerchantEmailTemplateType Type { get; set; }
    public ApiEnvironment Environment { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public string Subject { get; set; } = string.Empty;
    public List<EmailBlock> Blocks { get; set; } = [];
    public string PrimaryColor { get; set; } = string.Empty;
    public string BackgroundColor { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public string ContainerBackgroundColor { get; set; } = string.Empty;
    public string TextColorMode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class MinimalEmailTemplateData
{
    public Guid Id { get; set; }
    public MerchantEmailTemplateType Type { get; set; }
    public ApiEnvironment Environment { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public string Subject { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
