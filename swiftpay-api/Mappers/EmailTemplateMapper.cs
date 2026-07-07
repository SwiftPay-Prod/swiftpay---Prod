using swiftpay_api.Endpoints.Merchants.EmailTemplates.Shared.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Mappers;

public static class EmailTemplateMapper
{
    public static EmailTemplateData ToData(MerchantEmailTemplate template)
    {
        return new EmailTemplateData
        {
            Id = template.Id,
            MerchantId = template.MerchantId,
            Type = template.Type,
            Environment = template.Environment,
            Name = template.Name,
            Enabled = template.Enabled,
            Subject = template.Subject,
            Blocks = template.Blocks ?? [],
            PrimaryColor = template.PrimaryColor,
            BackgroundColor = template.BackgroundColor,
            IsDefault = template.IsDefault,
            ContainerBackgroundColor = template.ContainerBackgroundColor,
            TextColorMode = template.TextColorMode,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt
        };
    }

    public static MinimalEmailTemplateData ToMinimalData(MerchantEmailTemplate template)
    {
        return new MinimalEmailTemplateData
        {
            Id = template.Id,
            Type = template.Type,
            Environment = template.Environment,
            Name = template.Name,
            Enabled = template.Enabled,
            Subject = template.Subject,
            IsDefault = template.IsDefault,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt
        };
    }
}
