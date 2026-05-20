using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.Get;

public sealed class GetCheckoutHandler(PrimaryDbContext dbContext)
{
    public async Task<(GetCheckoutResponse Response, int StatusCode)> HandleAsync(GetCheckoutRequest req, CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var checkout = await dbContext.Checkouts
            .AsNoTracking()
            .Include(c => c.Merchant)
            .Include(c => c.CheckoutTemplate)
            .Include(c => c.Config)
            .Include(c => c.CheckoutProducts.Where(cp => cp.IsActive))
                .ThenInclude(cp => cp.Product)
            .Include(c => c.CheckoutProducts.Where(cp => cp.IsActive))
                .ThenInclude(cp => cp.Variant)
            .Include(c => c.Coupons.Where(coupon => coupon.Status == CouponStatus.Active &&
                (coupon.ValidFrom == null || coupon.ValidFrom <= now) &&
                (coupon.ValidUntil == null || coupon.ValidUntil >= now)))
            .FirstOrDefaultAsync(c => c.ShortId == req.ShortId, ct);

        if (checkout == null)
        {
            return (new GetCheckoutResponse
            {
                Error = new ApiErrorResponse("Checkout não encontrado.", "checkout_not_found")
            }, 404);
        }

        var isExpired = checkout.Status == CheckoutStatus.Expired;
        var expirationReason = isExpired
            ? "Este checkout não está mais disponível."
            : null;

        if (checkout.Status != CheckoutStatus.Active && checkout.Status != CheckoutStatus.Expired)
        {
            return (new GetCheckoutResponse
            {
                Error = new ApiErrorResponse("Checkout não encontrado.", "checkout_not_found")
            }, 404);
        }

        var data = MapToPublicData(checkout, isExpired, expirationReason);

        return (new GetCheckoutResponse
        {
            Data = data
        }, 200);
    }

    private static CheckoutPublicData MapToPublicData(
        safefy_api_core.Models.Database.Checkout checkout,
        bool isExpired,
        string? expirationReason)
    {
        return new CheckoutPublicData
        {
            ShortId = checkout.ShortId,
            Name = checkout.Name,
            Description = checkout.Description,
            Status = checkout.Status,
            IsExpired = isExpired,
            ExpirationReason = expirationReason,
            Environment = checkout.Environment,
            Template = MapTemplate(checkout.CheckoutTemplate),
            Config = MapConfig(checkout.Config),
            Merchant = MapMerchant(checkout.Merchant),
            Products = MapProducts(checkout.CheckoutProducts),
            Coupons = MapCoupons(checkout.Coupons, checkout.CheckoutTemplate?.SupportsCoupons ?? false)
        };
    }

    private static CheckoutPublicTemplateData MapTemplate(CheckoutTemplate? template)
    {
        if (template == null)
        {
            return new CheckoutPublicTemplateData
            {
                Code = "default",
                Type = CheckoutTemplateType.SingleOrder,
                Name = "Padrão"
            };
        }

        return new CheckoutPublicTemplateData
        {
            Code = template.Code,
            Type = template.Type,
            Name = template.Name,
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

    private static CheckoutPublicConfigData MapConfig(CheckoutConfig? config)
    {
        if (config == null)
        {
            return new CheckoutPublicConfigData
            {
                PixEnabled = true,
                PixExpirationMinutes = 30,
                ColorMode = CheckoutColorMode.Single,
                ShowTimer = false
            };
        }

        return new CheckoutPublicConfigData
        {
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
            SuccessUrl = config.SuccessUrl,
            CancelUrl = config.CancelUrl,
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
            SocialProof = MapSocialProof(config),
            Tracking = null,
            ContactWhatsAppEnabled = config.ContactWhatsAppEnabled,
            ContactWhatsAppNumber = config.ContactWhatsAppNumber,
            ContactTelegramEnabled = config.ContactTelegramEnabled,
            ContactTelegramUsername = config.ContactTelegramUsername,
            ContactEmailEnabled = config.ContactEmailEnabled,
            ContactEmail = config.ContactEmail
        };
    }

    private static CheckoutPublicSocialProofData? MapSocialProof(CheckoutConfig config)
    {
        return new CheckoutPublicSocialProofData
        {
            Enabled = config.SocialProofEnabled,
            IntervalSeconds = config.SocialProofSettings?.IntervalSeconds ?? 8,
            DurationSeconds = config.SocialProofSettings?.DurationSeconds ?? 4,
            Position = config.SocialProofSettings?.Position.ToString() ?? "BottomLeft",
            Notifications = config.SocialProofSettings?.Notifications
                .Select(n => new CheckoutPublicSocialProofNotification
                {
                    Name = n.Name,
                    Location = n.Location,
                    Action = n.Action
                })
                .ToList() ?? []
        };
    }

    private static CheckoutPublicMerchantData MapMerchant(Merchant merchant)
    {
        return new CheckoutPublicMerchantData
        {
            Name = merchant.Name ?? "Merchant",
            LogoUrl = null
        };
    }

    private static List<CheckoutPublicProductData> MapProducts(ICollection<CheckoutProduct> checkoutProducts)
    {
        return checkoutProducts
            .Where(cp => cp.IsActive)
            .OrderBy(cp => cp.DisplayOrder)
            .Select(cp => new CheckoutPublicProductData
            {
                ProductId = cp.ProductId,
                VariantId = cp.VariantId,
                Name = cp.Product?.Name ?? "Produto",
                Type = cp.Product?.Type ?? ProductType.Physical,
                Description = cp.Product?.Description,
                VariantName = cp.Variant?.Name,
                ImageUrl = cp.Variant?.ImageUrl ?? cp.Product?.ImageUrl,
                ImageUrls = cp.Product?.ImageUrls,
                Price = cp.CustomPrice ?? cp.Variant?.Price ?? cp.Product?.Price ?? 0,
                Quantity = 1,
                MaxQuantity = null,
                DisplayOrder = cp.DisplayOrder
            })
            .ToList();
    }

    private static List<CheckoutPublicCouponData> MapCoupons(ICollection<Coupon> coupons, bool supportsCoupons)
    {
        if (!supportsCoupons)
            return [];

        return coupons
            .Where(c => c.Status == CouponStatus.Active)
            .Select(c => new CheckoutPublicCouponData
            {
                Code = c.Code,
                Name = c.Name,
                DiscountType = c.DiscountType,
                DiscountPercentage = c.DiscountPercentage,
                DiscountFixedAmount = c.DiscountFixedAmount,
                MinOrderAmount = c.MinOrderAmount,
                MaxDiscountAmount = c.MaxDiscountAmount
            })
            .ToList();
    }
}
