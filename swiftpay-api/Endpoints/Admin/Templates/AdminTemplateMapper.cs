using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Templates;

public static class AdminTemplateMapper
{
    public static AdminTemplateData ToData(CheckoutTemplate template)
    {
        var normalizedFee = TemplateFeeModeNormalizer.Normalize(template.FeeMode, template.FeeFixed, template.FeePercentage);

        return new AdminTemplateData
        {
            Id = template.Id,
            Code = template.Code,
            Type = template.Type,
            Name = template.Name,
            ShortDescription = template.ShortDescription,
            FullDescription = template.FullDescription,
            BestFor = template.BestFor,
            ThumbnailUrl = template.ThumbnailUrl,
            PreviewImages = template.PreviewImages,
            Features = template.Features,
            FeeMode = template.FeeMode,
            FeeFixed = normalizedFee.FeeFixed,
            FeePercentage = normalizedFee.FeePercentage,
            IsActive = template.IsActive,
            UsageCount = template.UsageCount,
            ActiveCheckouts = template.ActiveCheckouts,
            SupportsCoupons = template.SupportsCoupons,
            SupportsShipping = template.SupportsShipping,
            SupportsTimer = template.SupportsTimer,
            SupportsSocialProof = template.SupportsSocialProof,
            SupportsClarity = template.SupportsClarity,
            SupportsFacebookPixel = template.SupportsFacebookPixel,
            SupportsGoogleTagManager = template.SupportsGoogleTagManager,
            SupportsTikTok = template.SupportsTikTok,
            SupportsKwai = template.SupportsKwai,
            SupportsPinterest = template.SupportsPinterest,
            SupportsTaboola = template.SupportsTaboola,
            SupportsUtmify = template.SupportsUtmify,
            SupportsOtimizey = template.SupportsOtimizey,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt
        };
    }

    public static AdminMinimalTemplate ToMinimalData(CheckoutTemplate template)
    {
        var normalizedFee = TemplateFeeModeNormalizer.Normalize(template.FeeMode, template.FeeFixed, template.FeePercentage);

        return new AdminMinimalTemplate
        {
            Id = template.Id,
            Code = template.Code,
            Type = template.Type,
            Name = template.Name,
            ShortDescription = template.ShortDescription,
            ThumbnailUrl = template.ThumbnailUrl,
            FeeMode = template.FeeMode,
            FeeFixed = normalizedFee.FeeFixed,
            FeePercentage = normalizedFee.FeePercentage,
            IsActive = template.IsActive,
            UsageCount = template.UsageCount,
            ActiveCheckouts = template.ActiveCheckouts,
            SupportsCoupons = template.SupportsCoupons,
            SupportsTimer = template.SupportsTimer,
            SupportsSocialProof = template.SupportsSocialProof,
            SupportsClarity = template.SupportsClarity,
            SupportsFacebookPixel = template.SupportsFacebookPixel,
            SupportsGoogleTagManager = template.SupportsGoogleTagManager,
            SupportsTikTok = template.SupportsTikTok,
            SupportsKwai = template.SupportsKwai,
            SupportsPinterest = template.SupportsPinterest,
            SupportsTaboola = template.SupportsTaboola,
            SupportsUtmify = template.SupportsUtmify,
            SupportsOtimizey = template.SupportsOtimizey,
            CreatedAt = template.CreatedAt
        };
    }
}
