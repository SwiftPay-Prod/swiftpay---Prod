using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api.Mappers;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api.Endpoints.Merchants.Checkouts.UpdateCheckout;

public sealed class UpdateCheckoutEndpoint(
    PrimaryDbContext dbContext,
    IOptions<PlatformSettingsOptions> platformSettings
) : Endpoint<UpdateCheckoutRequest, UpdateCheckoutResponse>
{
    private const string DefaultCheckoutPrimaryColor = "#059669";

    private static bool CanActivateCheckout(Checkout checkout)
    {
        var config = checkout.Config;
        if (config == null)
        {
            return false;
        }

        var hasTemplate = checkout.CheckoutTemplateId.HasValue;
        var hasPaymentMethod = config.PixEnabled || config.CreditCardEnabled || config.BoletoEnabled;

        return hasTemplate && hasPaymentMethod;
    }

    public override void Configure()
    {
        Patch("{merchantId:guid}/checkouts/{checkoutId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateCheckoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateCheckoutResponse
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
            await Send.ResponseAsync(new UpdateCheckoutResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var checkout = await dbContext.Checkouts
            .Include(c => c.CheckoutTemplate)
            .Include(c => c.Config)
            .Include(c => c.CheckoutProducts)
                .ThenInclude(cp => cp.Product)
            .Include(c => c.CheckoutProducts)
                .ThenInclude(cp => cp.Variant)
            .Include(c => c.Coupons)
            .Include(c => c.Orders)
            .AsSplitQuery()
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CheckoutId && c.MerchantId == req.MerchantId, ct);

        if (checkout == null)
        {
            await Send.ResponseAsync(new UpdateCheckoutResponse
            {
                Error = new("Checkout não encontrado.")
            }, 404, ct);
            return;
        }

        if (checkout.Status == CheckoutStatus.Archived)
        {
            await Send.ResponseAsync(new UpdateCheckoutResponse
            {
                Error = new("Não é possível editar um checkout arquivado.")
            }, 400, ct);
            return;
        }

        if (req.ProductOperations is { Count: > 0 })
        {
            foreach (var operation in req.ProductOperations)
            {
                var normalizedOperation = operation.Operation.Trim().ToLowerInvariant();

                if (normalizedOperation == "add")
                {
                    var product = await dbContext.Products
                        .Include(p => p.Variants)
                        .OrderBy(p => p.Id)
                        .FirstOrDefaultAsync(p => p.Id == operation.ProductId && p.MerchantId == req.MerchantId, ct);

                    if (product == null)
                    {
                        await Send.ResponseAsync(new UpdateCheckoutResponse
                        {
                            Error = new("Produto não encontrado.")
                        }, 404, ct);
                        return;
                    }

                    if (product.Environment != checkout.Environment)
                    {
                        await Send.ResponseAsync(new UpdateCheckoutResponse
                        {
                            Error = new("O produto pertence a um ambiente diferente do checkout.")
                        }, 400, ct);
                        return;
                    }

                    if (product.Status != ProductStatus.Active)
                    {
                        await Send.ResponseAsync(new UpdateCheckoutResponse
                        {
                            Error = new("O produto está inativo.")
                        }, 400, ct);
                        return;
                    }

                    Variant? variant = null;
                    if (operation.VariantId.HasValue)
                    {
                        variant = product.Variants.FirstOrDefault(v => v.Id == operation.VariantId.Value);
                        if (variant == null)
                        {
                            await Send.ResponseAsync(new UpdateCheckoutResponse
                            {
                                Error = new("Variante não encontrada.")
                            }, 404, ct);
                            return;
                        }

                        if (variant.Status != VariantStatus.Active)
                        {
                            await Send.ResponseAsync(new UpdateCheckoutResponse
                            {
                                Error = new("A variante está inativa.")
                            }, 400, ct);
                            return;
                        }
                    }

                    var existingProduct = checkout.CheckoutProducts
                        .FirstOrDefault(cp => cp.ProductId == operation.ProductId && cp.VariantId == operation.VariantId);

                    if (existingProduct != null)
                    {
                        await Send.ResponseAsync(new UpdateCheckoutResponse
                        {
                            Error = new("Este produto já está adicionado ao checkout.")
                        }, 400, ct);
                        return;
                    }

                    var maxDisplayOrder = checkout.CheckoutProducts.Count > 0
                        ? checkout.CheckoutProducts.Max(cp => cp.DisplayOrder)
                        : 0;

                    var checkoutProduct = new CheckoutProduct
                    {
                        CheckoutId = checkout.Id,
                        ProductId = operation.ProductId!.Value,
                        VariantId = operation.VariantId,
                        DisplayOrder = operation.DisplayOrder ?? (maxDisplayOrder + 1),
                        Quantity = 1,
                        MaxQuantity = null,
                        IsActive = operation.IsActive ?? true,
                        Product = product,
                        Variant = variant
                    };

                    dbContext.CheckoutProducts.Add(checkoutProduct);
                    checkout.CheckoutProducts.Add(checkoutProduct);
                    continue;
                }

                var checkoutProductToUpdate = checkout.CheckoutProducts
                    .FirstOrDefault(cp => cp.Id == operation.CheckoutProductId && cp.CheckoutId == checkout.Id);

                if (checkoutProductToUpdate == null)
                {
                    await Send.ResponseAsync(new UpdateCheckoutResponse
                    {
                        Error = new("Produto do checkout não encontrado.")
                    }, 404, ct);
                    return;
                }

                if (normalizedOperation == "update")
                {
                    if (operation.DisplayOrder.HasValue) checkoutProductToUpdate.DisplayOrder = operation.DisplayOrder.Value;
                    if (operation.IsActive.HasValue) checkoutProductToUpdate.IsActive = operation.IsActive.Value;
                    continue;
                }

                if (normalizedOperation == "remove")
                {
                    dbContext.CheckoutProducts.Remove(checkoutProductToUpdate);
                    checkout.CheckoutProducts.Remove(checkoutProductToUpdate);
                }
            }
        }

        if (req.Name != null) checkout.Name = req.Name.Trim();
        if (req.Description != null) checkout.Description = req.Description.Trim();

        if (req.ClearCheckoutTemplate == true)
        {
            await Send.ResponseAsync(new UpdateCheckoutResponse
            {
                Error = new("Após selecionar um template, não é possível removê-lo. Selecione outro template para trocar.")
            }, 400, ct);
            return;
        }

        if (req.CheckoutTemplateId.HasValue)
        {
            var newTemplateId = req.CheckoutTemplateId.Value;
            var oldTemplateId = checkout.CheckoutTemplateId;
            
            // Se está mudando de template
            if (oldTemplateId != newTemplateId)
            {
                var template = await dbContext.CheckoutTemplates
                    .OrderBy(t => t.Id)
                    .FirstOrDefaultAsync(t => t.Id == newTemplateId && t.IsActive, ct);

                if (template == null)
                {
                    await Send.ResponseAsync(new UpdateCheckoutResponse
                    {
                        Error = new("Template de checkout não encontrado ou inativo.")
                    }, 404, ct);
                    return;
                }

                // Decrementar ActiveCheckouts do template antigo (se existia)
                if (oldTemplateId.HasValue && checkout.CheckoutTemplate != null)
                {
                    checkout.CheckoutTemplate.ActiveCheckouts = Math.Max(0, checkout.CheckoutTemplate.ActiveCheckouts - 1);
                }

                // Incrementar contadores do novo template
                template.UsageCount++;
                template.ActiveCheckouts++;

                checkout.CheckoutTemplateId = template.Id;
                checkout.CheckoutTemplate = template;

                if (checkout.Config != null)
                {
                    checkout.Config.CouponEnabled = template.SupportsCoupons && checkout.Config.CouponEnabled;
                    checkout.Config.ShippingEnabled = template.SupportsShipping && checkout.Config.ShippingEnabled;
                }
            }
        }

        var config = checkout.Config;
        if (config == null)
        {
            config = new CheckoutConfig
            {
                CheckoutId = checkout.Id,
                PrimaryColor = DefaultCheckoutPrimaryColor,
                ColorMode = CheckoutColorMode.Single
            };
            dbContext.CheckoutConfigs.Add(config);
            checkout.Config = config;
        }

        // Payment settings
        if (req.PixEnabled.HasValue) config.PixEnabled = req.PixEnabled.Value;
        if (req.CreditCardEnabled.HasValue) config.CreditCardEnabled = req.CreditCardEnabled.Value;
        if (req.BoletoEnabled.HasValue) config.BoletoEnabled = req.BoletoEnabled.Value;
        if (req.PixExpirationMinutes.HasValue) config.PixExpirationMinutes = req.PixExpirationMinutes.Value;
        if (req.ClearDefaultPaymentMethod == true)
            config.DefaultPaymentMethod = null;
        else if (req.DefaultPaymentMethod.HasValue)
            config.DefaultPaymentMethod = req.DefaultPaymentMethod.Value;

        // Feature settings
        if (req.CouponEnabled.HasValue)
        {
            if (req.CouponEnabled.Value && checkout.CheckoutTemplate != null && !checkout.CheckoutTemplate.SupportsCoupons)
            {
                await Send.ResponseAsync(new UpdateCheckoutResponse
                {
                    Error = new("Este template não suporta cupons de desconto.")
                }, 400, ct);
                return;
            }

            config.CouponEnabled = req.CouponEnabled.Value;
        }

        if (req.ShippingEnabled.HasValue)
        {
            if (req.ShippingEnabled.Value && checkout.CheckoutTemplate != null && !checkout.CheckoutTemplate.SupportsShipping)
            {
                await Send.ResponseAsync(new UpdateCheckoutResponse
                {
                    Error = new("Este template não suporta cálculo de frete.")
                }, 400, ct);
                return;
            }

            config.ShippingEnabled = req.ShippingEnabled.Value;
        }

        if (req.ClearFixedShippingAmount == true)
            config.FixedShippingAmount = null;
        else if (req.FixedShippingAmount.HasValue)
            config.FixedShippingAmount = req.FixedShippingAmount.Value;

        if (req.RequireCustomerPhone.HasValue) config.RequireCustomerPhone = req.RequireCustomerPhone.Value;
        if (req.RequireCustomerAddress.HasValue) config.RequireCustomerAddress = req.RequireCustomerAddress.Value;
        if (req.RequireCustomerDocument.HasValue) config.RequireCustomerDocument = req.RequireCustomerDocument.Value;
        if (req.ReservationExpirationMinutes.HasValue) config.ReservationExpirationMinutes = req.ReservationExpirationMinutes.Value;

        // URLs
        if (req.SuccessUrl != null) config.SuccessUrl = string.IsNullOrWhiteSpace(req.SuccessUrl) ? null : req.SuccessUrl;
        if (req.CancelUrl != null) config.CancelUrl = string.IsNullOrWhiteSpace(req.CancelUrl) ? null : req.CancelUrl;
        if (req.CallbackUrl != null) config.CallbackUrl = string.IsNullOrWhiteSpace(req.CallbackUrl) ? null : req.CallbackUrl;

        // Visual customization
        if (req.PrimaryColor != null) config.PrimaryColor = req.PrimaryColor;
        if (req.SecondaryColor != null) config.SecondaryColor = req.SecondaryColor;
        if (req.ColorMode.HasValue) config.ColorMode = req.ColorMode.Value;
        if (req.LogoUrl != null) config.LogoUrl = string.IsNullOrWhiteSpace(req.LogoUrl) ? null : req.LogoUrl;
        if (req.BackgroundImageUrl != null) config.BackgroundImageUrl = string.IsNullOrWhiteSpace(req.BackgroundImageUrl) ? null : req.BackgroundImageUrl;
        if (req.FaviconUrl != null) config.FaviconUrl = string.IsNullOrWhiteSpace(req.FaviconUrl) ? null : req.FaviconUrl;

        if (string.IsNullOrWhiteSpace(config.PrimaryColor))
        {
            config.PrimaryColor = DefaultCheckoutPrimaryColor;
        }

        // Messages
        if (req.HeaderMessage != null) config.HeaderMessage = req.HeaderMessage;
        if (req.SubHeaderMessage != null) config.SubHeaderMessage = req.SubHeaderMessage;
        if (req.FooterMessage != null) config.FooterMessage = req.FooterMessage;
        if (req.SuccessMessage != null) config.SuccessMessage = req.SuccessMessage;
        if (req.PageTitle != null) config.PageTitle = req.PageTitle;

        // Timer settings
        if (req.ShowTimer.HasValue) config.ShowTimer = req.ShowTimer.Value;
        if (req.TimerMinutes.HasValue) config.TimerMinutes = req.TimerMinutes.Value;
        if (req.TimerText != null) config.TimerText = req.TimerText;
        if (req.TimerExpiredText != null) config.TimerExpiredText = req.TimerExpiredText;

        // Social proof settings
        if (req.SocialProofEnabled.HasValue)
        {
            if (req.SocialProofEnabled.Value && checkout.CheckoutTemplate != null && !checkout.CheckoutTemplate.SupportsSocialProof)
            {
                await Send.ResponseAsync(new UpdateCheckoutResponse
                {
                    Error = new("Este template não suporta prova social.")
                }, 400, ct);
                return;
            }

            config.SocialProofEnabled = req.SocialProofEnabled.Value;
        }

        if (req.SocialProofSettings != null)
        {
            if (checkout.CheckoutTemplate != null && !checkout.CheckoutTemplate.SupportsSocialProof)
            {
                await Send.ResponseAsync(new UpdateCheckoutResponse
                {
                    Error = new("Este template não suporta prova social.")
                }, 400, ct);
                return;
            }

            config.SocialProofSettings = new SocialProofSettings
            {
                IntervalSeconds = req.SocialProofSettings.IntervalSeconds ?? 8,
                DurationSeconds = req.SocialProofSettings.DurationSeconds ?? 4,
                Position = Enum.TryParse<SocialProofPosition>(req.SocialProofSettings.Position, out var pos) ? pos : SocialProofPosition.BottomLeft,
                Notifications = req.SocialProofSettings.Notifications?.Select(n => new SocialProofNotification
                {
                    Name = n.Name,
                    Location = n.Location,
                    Action = n.Action
                }).ToList() ?? []
            };
        }

        if (req.TrackingSettings != null)
        {
            config.TrackingSettings = null;
        }

        // Contact settings
        if (req.ContactWhatsAppEnabled.HasValue) config.ContactWhatsAppEnabled = req.ContactWhatsAppEnabled.Value;
        if (req.ContactWhatsAppNumber != null) config.ContactWhatsAppNumber = string.IsNullOrWhiteSpace(req.ContactWhatsAppNumber) ? null : req.ContactWhatsAppNumber;
        if (req.ContactTelegramEnabled.HasValue) config.ContactTelegramEnabled = req.ContactTelegramEnabled.Value;
        if (req.ContactTelegramUsername != null) config.ContactTelegramUsername = string.IsNullOrWhiteSpace(req.ContactTelegramUsername) ? null : req.ContactTelegramUsername;
        if (req.ContactEmailEnabled.HasValue) config.ContactEmailEnabled = req.ContactEmailEnabled.Value;
        if (req.ContactEmail != null) config.ContactEmail = string.IsNullOrWhiteSpace(req.ContactEmail) ? null : req.ContactEmail;

        if (req.OnboardingStep.HasValue)
        {
            checkout.OnboardingStep = req.OnboardingStep.Value;
        }

        if (req.OnboardingCompleted.HasValue)
        {
            if (req.OnboardingCompleted.Value)
            {
                if (!CanActivateCheckout(checkout))
                {
                    await Send.ResponseAsync(new UpdateCheckoutResponse
                    {
                        Error = new("Preencha o template e ative ao menos um método de pagamento antes de concluir o checkout.")
                    }, 400, ct);
                    return;
                }

                checkout.OnboardingCompleted = true;
                checkout.Status = CheckoutStatus.Active;
            }
            else
            {
                checkout.OnboardingCompleted = false;
                checkout.Status = CheckoutStatus.Draft;
            }
        }
        else if (checkout.Status == CheckoutStatus.Active && !CanActivateCheckout(checkout))
        {
            checkout.OnboardingCompleted = false;
            checkout.Status = CheckoutStatus.Draft;
        }

        // SEO settings
        if (req.Seo != null)
        {
            config.Seo ??= new SeoConfig();

            if (req.Seo.MetaTitle != null) config.Seo.MetaTitle = string.IsNullOrWhiteSpace(req.Seo.MetaTitle) ? null : req.Seo.MetaTitle;
            if (req.Seo.MetaDescription != null) config.Seo.MetaDescription = string.IsNullOrWhiteSpace(req.Seo.MetaDescription) ? null : req.Seo.MetaDescription;
            if (req.Seo.MetaKeywords != null) config.Seo.MetaKeywords = string.IsNullOrWhiteSpace(req.Seo.MetaKeywords) ? null : req.Seo.MetaKeywords;
            if (req.Seo.CanonicalUrl != null) config.Seo.CanonicalUrl = string.IsNullOrWhiteSpace(req.Seo.CanonicalUrl) ? null : req.Seo.CanonicalUrl;
            if (req.Seo.Robots != null) config.Seo.Robots = string.IsNullOrWhiteSpace(req.Seo.Robots) ? null : req.Seo.Robots;

            if (req.Seo.OpenGraph != null)
            {
                config.Seo.OpenGraph ??= new OpenGraphConfig();
                if (req.Seo.OpenGraph.Title != null) config.Seo.OpenGraph.Title = string.IsNullOrWhiteSpace(req.Seo.OpenGraph.Title) ? null : req.Seo.OpenGraph.Title;
                if (req.Seo.OpenGraph.Description != null) config.Seo.OpenGraph.Description = string.IsNullOrWhiteSpace(req.Seo.OpenGraph.Description) ? null : req.Seo.OpenGraph.Description;
                if (req.Seo.OpenGraph.ImageUrl != null) config.Seo.OpenGraph.ImageUrl = string.IsNullOrWhiteSpace(req.Seo.OpenGraph.ImageUrl) ? null : req.Seo.OpenGraph.ImageUrl;
                if (req.Seo.OpenGraph.ImageAlt != null) config.Seo.OpenGraph.ImageAlt = string.IsNullOrWhiteSpace(req.Seo.OpenGraph.ImageAlt) ? null : req.Seo.OpenGraph.ImageAlt;
                if (req.Seo.OpenGraph.ImageWidth.HasValue) config.Seo.OpenGraph.ImageWidth = req.Seo.OpenGraph.ImageWidth.Value > 0 ? req.Seo.OpenGraph.ImageWidth : null;
                if (req.Seo.OpenGraph.ImageHeight.HasValue) config.Seo.OpenGraph.ImageHeight = req.Seo.OpenGraph.ImageHeight.Value > 0 ? req.Seo.OpenGraph.ImageHeight : null;
                if (req.Seo.OpenGraph.SiteName != null) config.Seo.OpenGraph.SiteName = string.IsNullOrWhiteSpace(req.Seo.OpenGraph.SiteName) ? null : req.Seo.OpenGraph.SiteName;
                if (req.Seo.OpenGraph.Locale != null) config.Seo.OpenGraph.Locale = string.IsNullOrWhiteSpace(req.Seo.OpenGraph.Locale) ? null : req.Seo.OpenGraph.Locale;
                if (req.Seo.OpenGraph.Type != null) config.Seo.OpenGraph.Type = string.IsNullOrWhiteSpace(req.Seo.OpenGraph.Type) ? null : req.Seo.OpenGraph.Type;
            }

            if (req.Seo.Twitter != null)
            {
                config.Seo.Twitter ??= new TwitterCardConfig();
                if (req.Seo.Twitter.Card != null) config.Seo.Twitter.Card = string.IsNullOrWhiteSpace(req.Seo.Twitter.Card) ? null : req.Seo.Twitter.Card;
                if (req.Seo.Twitter.Site != null) config.Seo.Twitter.Site = string.IsNullOrWhiteSpace(req.Seo.Twitter.Site) ? null : req.Seo.Twitter.Site;
                if (req.Seo.Twitter.Creator != null) config.Seo.Twitter.Creator = string.IsNullOrWhiteSpace(req.Seo.Twitter.Creator) ? null : req.Seo.Twitter.Creator;
                if (req.Seo.Twitter.Title != null) config.Seo.Twitter.Title = string.IsNullOrWhiteSpace(req.Seo.Twitter.Title) ? null : req.Seo.Twitter.Title;
                if (req.Seo.Twitter.Description != null) config.Seo.Twitter.Description = string.IsNullOrWhiteSpace(req.Seo.Twitter.Description) ? null : req.Seo.Twitter.Description;
                if (req.Seo.Twitter.ImageUrl != null) config.Seo.Twitter.ImageUrl = string.IsNullOrWhiteSpace(req.Seo.Twitter.ImageUrl) ? null : req.Seo.Twitter.ImageUrl;
            }
        }

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateCheckoutResponse
        {
            Data = CheckoutMapper.ToData(checkout, platformSettings.Value.CheckoutBaseUrl),
            Message = "Checkout atualizado com sucesso!"
        }, ct);
    }
}
