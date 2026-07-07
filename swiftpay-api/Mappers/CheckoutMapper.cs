using swiftpay_api.Endpoints.Merchants.Checkouts;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Mappers;

public static class CheckoutMapper
{
    private static string? BuildCheckoutUrl(Checkout checkout, string checkoutBaseUrl)
    {
        if (checkout.Status != CheckoutStatus.Active || string.IsNullOrWhiteSpace(checkout.ShortId))
        {
            return null;
        }

        var sandboxPrefix = checkout.Environment == ApiEnvironment.Sandbox ? "/sandbox" : "";
        return $"{checkoutBaseUrl}{sandboxPrefix}/{checkout.ShortId}";
    }

    public static CheckoutData ToData(Checkout checkout, string checkoutBaseUrl)
    {
        var checkoutUrl = BuildCheckoutUrl(checkout, checkoutBaseUrl);
        var orders = checkout.Orders?.ToList() ?? [];
        var accessCount = orders
            .Select(o => o.SessionId)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.Ordinal)
            .Count();
        var revenueAmount = orders
            .Where(o => o.Payment?.Status == PaymentStatus.Completed)
            .Sum(o => o.TotalAmount);
        var transactionCount = orders.Count(o => o.Payment != null);
        var completedTransactions = orders.Count(o => o.Payment?.Status == PaymentStatus.Completed);
        var approvalRate = MathUtils.CalculatePercentage(completedTransactions, transactionCount);
        var customerCount = orders
            .Select(o => o.CustomerId)
            .Distinct()
            .Count();

        return new CheckoutData
        {
            Id = checkout.Id,
            Name = checkout.Name,
            Description = checkout.Description,
            Slug = checkout.Slug,
            ShortId = checkout.ShortId,
            Status = checkout.Status,
            Environment = checkout.Environment,
            OnboardingCompleted = checkout.OnboardingCompleted,
            OnboardingStep = checkout.OnboardingStep,
            Template = checkout.CheckoutTemplate != null ? ToTemplateData(checkout.CheckoutTemplate) : null,
            Config = checkout.Config != null ? ToConfigData(checkout.Config) : null,
            Products = checkout.CheckoutProducts?.Select(ToProductData).ToList() ?? [],
            Coupons = checkout.Coupons?.Select(ToCouponData).ToList() ?? [],
            Kpis = new CheckoutKpisData
            {
                AccessCount = accessCount,
                RevenueAmount = revenueAmount,
                OrderCount = orders.Count,
                TransactionCount = transactionCount,
                CompletedTransactions = completedTransactions,
                ApprovalRate = approvalRate,
                CustomerCount = customerCount
            },
            CheckoutUrl = checkoutUrl,
            CreatedAt = checkout.CreatedAt,
            UpdatedAt = checkout.UpdatedAt
        };
    }

    public static MinimalCheckout ToMinimalData(Checkout checkout, string checkoutBaseUrl)
    {
        var checkoutUrl = BuildCheckoutUrl(checkout, checkoutBaseUrl);

        return new MinimalCheckout
        {
            Id = checkout.Id,
            Name = checkout.Name,
            Description = checkout.Description,
            Slug = checkout.Slug,
            ShortId = checkout.ShortId,
            Status = checkout.Status,
            Environment = checkout.Environment,
            OnboardingCompleted = checkout.OnboardingCompleted,
            OnboardingStep = checkout.OnboardingStep,
            Template = checkout.CheckoutTemplate != null ? ToTemplateMinimal(checkout.CheckoutTemplate) : null,
            ProductCount = checkout.CheckoutProducts?.Count ?? 0,
            CouponCount = checkout.Coupons?.Count ?? 0,
            PaymentCount = checkout.Orders?.Count ?? 0,
            CheckoutUrl = checkoutUrl,
            CreatedAt = checkout.CreatedAt
        };
    }

    public static CheckoutTemplateData ToTemplateData(CheckoutTemplate template)
    {
        return new CheckoutTemplateData
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
            FeeFixed = template.FeeFixed,
            FeePercentage = template.FeePercentage,
            IsActive = template.IsActive,
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
            SupportsOtimizey = template.SupportsOtimizey
        };
    }

    public static CheckoutTemplateMinimal ToTemplateMinimal(CheckoutTemplate template)
    {
        return new CheckoutTemplateMinimal
        {
            Id = template.Id,
            Type = template.Type,
            Name = template.Name,
            ThumbnailUrl = template.ThumbnailUrl
        };
    }

    public static CheckoutConfigData ToConfigData(CheckoutConfig config)
    {
        return new CheckoutConfigData
        {
            Id = config.Id,
            PixEnabled = config.PixEnabled,
            CreditCardEnabled = config.CreditCardEnabled,
            BoletoEnabled = config.BoletoEnabled,
            PixExpirationMinutes = config.PixExpirationMinutes,
            DefaultPaymentMethod = config.DefaultPaymentMethod,
            CouponEnabled = config.CouponEnabled,
            ShippingEnabled = config.ShippingEnabled,
            FixedShippingAmount = config.FixedShippingAmount,
            RequireCustomerPhone = config.RequireCustomerPhone,
            RequireCustomerAddress = config.RequireCustomerAddress,
            RequireCustomerDocument = config.RequireCustomerDocument,
            ReservationExpirationMinutes = config.ReservationExpirationMinutes,
            SuccessUrl = config.SuccessUrl,
            CancelUrl = config.CancelUrl,
            CallbackUrl = config.CallbackUrl,
            PrimaryColor = config.PrimaryColor,
            SecondaryColor = config.SecondaryColor,
            ColorMode = config.ColorMode,
            LogoUrl = config.LogoUrl,
            BackgroundImageUrl = config.BackgroundImageUrl,
            FaviconUrl = config.FaviconUrl,
            HeaderMessage = config.HeaderMessage,
            SubHeaderMessage = config.SubHeaderMessage,
            FooterMessage = config.FooterMessage,
            SuccessMessage = config.SuccessMessage,
            PageTitle = config.PageTitle,
            ShowTimer = config.ShowTimer,
            TimerMinutes = config.TimerMinutes,
            TimerText = config.TimerText,
            TimerExpiredText = config.TimerExpiredText,
            SocialProofEnabled = config.SocialProofEnabled,
            SocialProofSettings = config.SocialProofSettings,
            TrackingSettings = config.TrackingSettings,
            ContactWhatsAppEnabled = config.ContactWhatsAppEnabled,
            ContactWhatsAppNumber = config.ContactWhatsAppNumber,
            ContactTelegramEnabled = config.ContactTelegramEnabled,
            ContactTelegramUsername = config.ContactTelegramUsername,
            ContactEmailEnabled = config.ContactEmailEnabled,
            ContactEmail = config.ContactEmail,
            Seo = config.Seo != null ? new SeoConfigData
            {
                MetaTitle = config.Seo.MetaTitle,
                MetaDescription = config.Seo.MetaDescription,
                MetaKeywords = config.Seo.MetaKeywords,
                CanonicalUrl = config.Seo.CanonicalUrl,
                Robots = config.Seo.Robots,
                OpenGraph = config.Seo.OpenGraph != null ? new OpenGraphConfigData
                {
                    Title = config.Seo.OpenGraph.Title,
                    Description = config.Seo.OpenGraph.Description,
                    ImageUrl = config.Seo.OpenGraph.ImageUrl,
                    ImageWidth = config.Seo.OpenGraph.ImageWidth,
                    ImageHeight = config.Seo.OpenGraph.ImageHeight,
                    ImageAlt = config.Seo.OpenGraph.ImageAlt,
                    SiteName = config.Seo.OpenGraph.SiteName,
                    Locale = config.Seo.OpenGraph.Locale,
                    Type = config.Seo.OpenGraph.Type
                } : null,
                Twitter = config.Seo.Twitter != null ? new TwitterCardConfigData
                {
                    Card = config.Seo.Twitter.Card,
                    Site = config.Seo.Twitter.Site,
                    Creator = config.Seo.Twitter.Creator,
                    Title = config.Seo.Twitter.Title,
                    Description = config.Seo.Twitter.Description,
                    ImageUrl = config.Seo.Twitter.ImageUrl
                } : null
            } : null
        };
    }

    public static CheckoutProductData ToProductData(CheckoutProduct checkoutProduct)
    {
        var product = checkoutProduct.Product;
        var variant = checkoutProduct.Variant;
        
        return new CheckoutProductData
        {
            Id = checkoutProduct.Id,
            ProductId = checkoutProduct.ProductId,
            VariantId = checkoutProduct.VariantId,
            ProductName = product?.Name ?? string.Empty,
            ProductImageUrl = variant?.ImageUrl ?? product?.ImageUrl,
            VariantName = variant?.Name,
            DisplayOrder = checkoutProduct.DisplayOrder,
            CustomPrice = checkoutProduct.CustomPrice,
            OriginalPrice = variant?.Price ?? product?.Price ?? 0,
            Quantity = checkoutProduct.Quantity,
            MaxQuantity = checkoutProduct.MaxQuantity,
            IsActive = checkoutProduct.IsActive
        };
    }

    public static CheckoutCouponData ToCouponData(Coupon coupon)
    {
        return new CheckoutCouponData
        {
            Id = coupon.Id,
            Code = coupon.Code,
            Name = coupon.Name,
            DiscountType = coupon.DiscountType,
            DiscountFixedAmount = coupon.DiscountFixedAmount,
            DiscountPercentage = coupon.DiscountPercentage,
            Status = coupon.Status,
            ApplyToAllCheckouts = coupon.ApplyToAllCheckouts,
            CurrentUses = coupon.CurrentUses,
            MaxUses = coupon.MaxUses
        };
    }
}
