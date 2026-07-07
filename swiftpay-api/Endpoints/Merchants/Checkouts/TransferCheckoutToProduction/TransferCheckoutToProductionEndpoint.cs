using System.Text.RegularExpressions;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.Checkouts.TransferCheckoutToProduction;

public sealed class TransferCheckoutToProductionEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<TransferCheckoutToProductionRequest, TransferCheckoutToProductionResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/checkouts/{checkoutId:guid}/transfer-to-production");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(TransferCheckoutToProductionRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new TransferCheckoutToProductionResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new TransferCheckoutToProductionResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var sourceCheckout = await dbContext.Checkouts
            .Include(c => c.CheckoutTemplate)
            .Include(c => c.Config)
            .Include(c => c.CheckoutProducts)
            .Include(c => c.Coupons)
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CheckoutId && c.MerchantId == req.MerchantId, ct);

        if (sourceCheckout == null)
        {
            await Send.ResponseAsync(new TransferCheckoutToProductionResponse
            {
                Error = new("Checkout não encontrado.")
            }, 404, ct);
            return;
        }

        if (sourceCheckout.Environment != ApiEnvironment.Sandbox)
        {
            await Send.ResponseAsync(new TransferCheckoutToProductionResponse
            {
                Error = new("A transferência para produção é permitida apenas a partir de checkouts Sandbox.")
            }, 400, ct);
            return;
        }

        if (sourceCheckout.Status == CheckoutStatus.Archived)
        {
            await Send.ResponseAsync(new TransferCheckoutToProductionResponse
            {
                Error = new("Não é possível transferir um checkout arquivado.")
            }, 400, ct);
            return;
        }

        var templateId = sourceCheckout.CheckoutTemplateId;
        if (templateId.HasValue)
        {
            var templateExists = await dbContext.CheckoutTemplates
                .AnyAsync(t => t.Id == templateId.Value && t.IsActive, ct);

            if (!templateExists)
            {
                templateId = null;
            }
        }

        var baseSlug = GenerateSlug(sourceCheckout.Name);
        var targetSlug = await EnsureUniqueSlugAsync(baseSlug, ct);
        var targetShortId = await GenerateUniqueShortIdAsync(ct);

        var targetCheckout = new Checkout
        {
            MerchantId = sourceCheckout.MerchantId,
            CheckoutTemplateId = templateId,
            Name = sourceCheckout.Name,
            Description = sourceCheckout.Description,
            Slug = targetSlug,
            ShortId = targetShortId,
            Status = CheckoutStatus.Draft,
            Environment = ApiEnvironment.Production,
            OnboardingCompleted = false,
            OnboardingStep = 1,
            Config = CloneConfig(sourceCheckout.Config)
        };

        dbContext.Checkouts.Add(targetCheckout);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new TransferCheckoutToProductionResponse
        {
            Data = new TransferCheckoutToProductionData
            {
                SourceCheckoutId = sourceCheckout.Id,
                TargetCheckoutId = targetCheckout.Id,
                TargetEnvironment = ApiEnvironment.Production,
                SkippedProductsCount = sourceCheckout.CheckoutProducts.Count,
                SkippedCouponsCount = sourceCheckout.Coupons.Count
            },
            Message = "Checkout transferido para Produção com sucesso. Produtos e cupons devem ser vinculados no ambiente de produção."
        }, ct);
    }

    private static CheckoutConfig CloneConfig(CheckoutConfig? source)
    {
        if (source == null)
        {
            return new CheckoutConfig
            {
                PixEnabled = true,
                CreditCardEnabled = false,
                BoletoEnabled = false,
                PixExpirationMinutes = 30,
                CouponEnabled = false,
                ShippingEnabled = false,
                RequireCustomerAddress = false,
                RequireCustomerDocument = false,
                ReservationExpirationMinutes = 15,
                ColorMode = CheckoutColorMode.Single
            };
        }

        return new CheckoutConfig
        {
            PixEnabled = source.PixEnabled,
            CreditCardEnabled = source.CreditCardEnabled,
            BoletoEnabled = source.BoletoEnabled,
            PixExpirationMinutes = source.PixExpirationMinutes,
            DefaultPaymentMethod = source.DefaultPaymentMethod,
            CouponEnabled = source.CouponEnabled,
            ShippingEnabled = source.ShippingEnabled,
            FixedShippingAmount = source.FixedShippingAmount,
            RequireCustomerInfo = source.RequireCustomerInfo,
            RequireCustomerPhone = source.RequireCustomerPhone,
            RequireCustomerAddress = source.RequireCustomerAddress,
            RequireCustomerDocument = source.RequireCustomerDocument,
            ReservationExpirationMinutes = source.ReservationExpirationMinutes,
            SuccessUrl = source.SuccessUrl,
            CancelUrl = source.CancelUrl,
            CallbackUrl = source.CallbackUrl,
            PrimaryColor = source.PrimaryColor,
            SecondaryColor = source.SecondaryColor,
            ColorMode = source.ColorMode,
            LogoUrl = source.LogoUrl,
            BackgroundImageUrl = source.BackgroundImageUrl,
            FaviconUrl = source.FaviconUrl,
            HeaderMessage = source.HeaderMessage,
            SubHeaderMessage = source.SubHeaderMessage,
            FooterMessage = source.FooterMessage,
            SuccessMessage = source.SuccessMessage,
            PageTitle = source.PageTitle,
            ShowTimer = source.ShowTimer,
            TimerMinutes = source.TimerMinutes,
            TimerText = source.TimerText,
            TimerExpiredText = source.TimerExpiredText,
            SocialProofEnabled = source.SocialProofEnabled,
            SocialProofSettings = source.SocialProofSettings,
            TrackingSettings = source.TrackingSettings,
            ContactWhatsAppEnabled = source.ContactWhatsAppEnabled,
            ContactWhatsAppNumber = source.ContactWhatsAppNumber,
            ContactTelegramEnabled = source.ContactTelegramEnabled,
            ContactTelegramUsername = source.ContactTelegramUsername,
            ContactEmailEnabled = source.ContactEmailEnabled,
            ContactEmail = source.ContactEmail,
            Seo = source.Seo
        };
    }

    private static string GenerateSlug(string name)
    {
        var slug = name.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[áàâãäå]", "a");
        slug = Regex.Replace(slug, @"[éèêë]", "e");
        slug = Regex.Replace(slug, @"[íìîï]", "i");
        slug = Regex.Replace(slug, @"[óòôõö]", "o");
        slug = Regex.Replace(slug, @"[úùûü]", "u");
        slug = Regex.Replace(slug, @"[ç]", "c");
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        slug = slug.Trim('-');
        return slug;
    }

    private async Task<string> EnsureUniqueSlugAsync(string baseSlug, CancellationToken ct)
    {
        var slug = string.IsNullOrWhiteSpace(baseSlug) ? "checkout" : baseSlug;
        var exists = await dbContext.Checkouts.AnyAsync(c => c.Slug == slug, ct);
        if (!exists)
        {
            return slug;
        }

        var counter = 2;
        while (true)
        {
            var candidate = $"{slug}-{counter}";
            exists = await dbContext.Checkouts.AnyAsync(c => c.Slug == candidate, ct);
            if (!exists)
            {
                return candidate;
            }

            counter++;
        }
    }

    private async Task<string> GenerateUniqueShortIdAsync(CancellationToken ct)
    {
        while (true)
        {
            var shortId = CryptoUtils.GenerateShortId();
            var exists = await dbContext.Checkouts.AnyAsync(c => c.ShortId == shortId, ct);
            if (!exists)
            {
                return shortId;
            }
        }
    }
}
