using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Email;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Services;

/// <summary>
/// Serviço para renderização e envio de emails usando templates de blocos
/// </summary>
public sealed class EmailTemplateService(
    PrimaryDbContext dbContext,
    IEmailBlockRenderer blockRenderer,
    IEmailService emailService
) : IEmailTemplateService
{
    public async Task<EmailSendResult> SendAsync(
        MerchantEmailTemplateType type,
        EmailTemplateContext context,
        CancellationToken ct = default)
    {
        var template = await GetTemplateAsync(
            context.MerchantId,
            type,
            context.Environment,
            ct);

        if (template == null)
            return EmailSendResult.NotFound();

        if (!template.Enabled)
            return EmailSendResult.Disabled();

        var merchant = await GetMerchantAsync(context.MerchantId, ct);
        var variables = BuildCommonVariables(context, merchant);
        var config = GetRenderConfig(template, merchant);

        AddTypeSpecificVariables(type, context, template, variables, config);

        return await RenderAndSendAsync(template, variables, context.CustomerEmail, merchant?.Id, ct);
    }

    public async Task<bool> IsNewCustomerAsync(
        Guid merchantId,
        string customerEmail,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(customerEmail))
            return false;

        var existingCustomer = await dbContext.Customers
            .Where(c => c.MerchantId == merchantId)
            .Where(c => c.Email == customerEmail)
            .FirstOrDefaultAsync(ct);

        if (existingCustomer == null)
            return true;

        var completedPaymentsCount = await dbContext.Payments
            .Where(p => p.MerchantId == merchantId)
            .Where(p => p.CustomerId == existingCustomer.Id)
            .Where(p => p.Status == PaymentStatus.Completed)
            .CountAsync(ct);

        return completedPaymentsCount <= 1;
    }

    private void AddTypeSpecificVariables(
        MerchantEmailTemplateType type,
        EmailTemplateContext context,
        MerchantEmailTemplate template,
        Dictionary<string, string> variables,
        EmailRenderConfig config)
    {
        switch (type)
        {
            case MerchantEmailTemplateType.PaymentConfirmation:
                AddPaymentConfirmationVariables(context, template, variables, config);
                break;

            case MerchantEmailTemplateType.DigitalDelivery:
                AddDigitalDeliveryVariables(context, template, variables, config);
                break;

            case MerchantEmailTemplateType.Welcome:
                AddWelcomeVariables(variables);
                break;

            case MerchantEmailTemplateType.OrderShipped:
                AddOrderShippedVariables(context, variables);
                break;

            case MerchantEmailTemplateType.OrderDelivered:
                AddOrderDeliveredVariables(context, template, variables, config);
                break;

            case MerchantEmailTemplateType.AbandonedCart:
                AddAbandonedCartVariables(context, template, variables, config);
                break;
        }
    }

    private void AddPaymentConfirmationVariables(
        EmailTemplateContext context,
        MerchantEmailTemplate template,
        Dictionary<string, string> variables,
        EmailRenderConfig config)
    {
        if (context.OrderItems is { Count: > 0 })
        {
            var productListBlock = template.Blocks.FirstOrDefault(b => b.Type == EmailBlockType.ProductList);
            var settings = productListBlock?.Settings ?? new EmailBlockSettings();

            variables["product_list"] = BuildProductListHtml(
                context.OrderItems,
                config,
                settings.ShowProductImages ?? true,
                settings.ShowPrices ?? true,
                settings.ShowQuantity ?? true);
        }
    }

    private void AddDigitalDeliveryVariables(
        EmailTemplateContext context,
        MerchantEmailTemplate template,
        Dictionary<string, string> variables,
        EmailRenderConfig config)
    {
        if (context.DigitalItems is { Count: > 0 })
        {
            var digitalItemsBlock = template.Blocks.FirstOrDefault(b => b.Type == EmailBlockType.DigitalItemsList);
            var settings = digitalItemsBlock?.Settings ?? new EmailBlockSettings();

            variables["digital_items_list"] = BuildDigitalItemsListHtml(
                context.DigitalItems,
                config,
                settings.ShowProductImages ?? true,
                settings.ShowPrices ?? true,
                settings.ShowQuantity ?? true);
        }
    }

    private static void AddWelcomeVariables(Dictionary<string, string> variables)
    {
        variables["registration_date"] = DateTime.UtcNow.ToString("dd/MM/yyyy");
    }

    private static void AddOrderShippedVariables(
        EmailTemplateContext context,
        Dictionary<string, string> variables)
    {
        if (context.Tracking == null) return;

        variables["carrier_name"] = context.Tracking.CarrierName;
        variables["tracking_code"] = context.Tracking.TrackingCode;
        variables["tracking_url"] = context.Tracking.TrackingUrl ?? "#";
        variables["estimated_delivery"] = context.Tracking.EstimatedDelivery?.ToString("dd/MM/yyyy") ?? "A definir";
    }

    private void AddOrderDeliveredVariables(
        EmailTemplateContext context,
        MerchantEmailTemplate template,
        Dictionary<string, string> variables,
        EmailRenderConfig config)
    {
        if (context.DeliveryDate.HasValue)
        {
            variables["delivery_date"] = context.DeliveryDate.Value.ToString("dd/MM/yyyy HH:mm");
        }

        if (context.OrderItems is { Count: > 0 })
        {
            var productListBlock = template.Blocks.FirstOrDefault(b => b.Type == EmailBlockType.ProductList);
            var settings = productListBlock?.Settings ?? new EmailBlockSettings();

            variables["product_list"] = BuildProductListHtml(
                context.OrderItems,
                config,
                settings.ShowProductImages ?? true,
                settings.ShowPrices ?? true,
                settings.ShowQuantity ?? true);
        }
    }

    private void AddAbandonedCartVariables(
        EmailTemplateContext context,
        MerchantEmailTemplate template,
        Dictionary<string, string> variables,
        EmailRenderConfig config)
    {
        variables["checkout_url"] = context.CheckoutUrl ?? "#";
        variables["cart_items_count"] = (context.CartItemsCount ?? 0).ToString();

        if (context.OrderItems is { Count: > 0 })
        {
            var productListBlock = template.Blocks.FirstOrDefault(b => b.Type == EmailBlockType.ProductList);
            var settings = productListBlock?.Settings ?? new EmailBlockSettings();

            variables["product_list"] = BuildProductListHtml(
                context.OrderItems,
                config,
                settings.ShowProductImages ?? true,
                settings.ShowPrices ?? true,
                settings.ShowQuantity ?? true);
        }
    }

    private async Task<MerchantEmailTemplate?> GetTemplateAsync(
        Guid merchantId,
        MerchantEmailTemplateType type,
        ApiEnvironment environment,
        CancellationToken ct)
    {
        var template = await dbContext.MerchantEmailTemplates
            .FirstOrDefaultAsync(t =>
                t.MerchantId == merchantId &&
                t.Type == type &&
                t.Environment == environment,
                ct);

        if (template != null) return template;

        template = MerchantEmailTemplate.CreateDefault(merchantId, type, environment);
        dbContext.MerchantEmailTemplates.Add(template);
        await dbContext.SaveChangesAsync(ct);

        return template;
    }

    private async Task<Merchant?> GetMerchantAsync(Guid merchantId, CancellationToken ct)
    {
        return await dbContext.Merchants
            .FirstOrDefaultAsync(m => m.Id == merchantId, ct);
    }

    private static Dictionary<string, string> BuildCommonVariables(EmailTemplateContext context, Merchant? merchant)
    {
        var merchantName = context.MerchantName ?? merchant?.Name ?? merchant?.MerchantKyc?.LegalName ?? "Loja";
        var merchantLogo = context.MerchantLogoUrl ?? "";

        var variables = new Dictionary<string, string>
        {
            ["customer_name"] = context.CustomerName ?? "Cliente",
            ["customer_email"] = context.CustomerEmail,
            ["merchant_name"] = merchantName,
            ["merchant_logo"] = merchantLogo,
            ["order_number"] = context.OrderNumber ?? "",
            ["order_date"] = context.OrderDate?.ToString("dd/MM/yyyy HH:mm") ?? DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm"),
            ["order_total"] = FormatCurrency(context.OrderTotal ?? 0),
            ["order_subtotal"] = FormatCurrency(context.OrderSubtotal ?? 0),
            ["order_shipping"] = FormatCurrency(context.OrderShipping ?? 0),
            ["order_discount"] = FormatCurrency(context.OrderDiscount ?? 0),
            ["payment_method"] = context.PaymentMethod ?? "PIX",
            ["support_email"] = merchant?.Email ?? "",
            ["support_phone"] = merchant?.PhoneNumber ?? "",
            ["store_url"] = ""
        };

        return variables;
    }

    private static EmailRenderConfig GetRenderConfig(MerchantEmailTemplate template, Merchant? merchant)
    {
        return new EmailRenderConfig
        {
            PrimaryColor = template.PrimaryColor,
            BackgroundColor = template.BackgroundColor,
            ContainerBackgroundColor = template.ContainerBackgroundColor,
            TextColor = template.TextColorMode == "light" ? "#ffffff" : "#111827",
            MutedColor = template.TextColorMode == "light" ? "#d1d5db" : "#6b7280",
            LogoUrl = null,
            MerchantName = merchant?.Name ?? "Loja"
        };
    }

    private async Task<EmailSendResult> RenderAndSendAsync(
        MerchantEmailTemplate template,
        Dictionary<string, string> variables,
        string recipientEmail,
        Guid? merchantId,
        CancellationToken ct)
    {
        try
        {
            var config = GetRenderConfig(template, null);
            var html = blockRenderer.RenderBlocks(template.Blocks, variables, config);

            var subject = ReplaceSubjectVariables(template.Subject, variables);

            await emailService.SendHtmlAsync(
                recipientEmail,
                subject,
                html,
                merchantId: merchantId,
                templateName: template.Type.ToString());

            return EmailSendResult.Ok();
        }
        catch (Exception ex)
        {
            return EmailSendResult.Error(ex.Message);
        }
    }

    private static string ReplaceSubjectVariables(string subject, Dictionary<string, string> variables)
    {
        foreach (var (key, value) in variables)
        {
            subject = subject.Replace($"[[{key}]]", value);
        }
        return subject;
    }

    private static string FormatCurrency(long valueInCents)
    {
        var value = valueInCents / 100.0m;
        return value.ToString("C", new System.Globalization.CultureInfo("pt-BR"));
    }

    private static string BuildProductListHtml(
        List<OrderItemInfo> items,
        EmailRenderConfig config,
        bool showProductImages = true,
        bool showPrices = true,
        bool showQuantity = true)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">""");

        for (var i = 0; i < items.Count; i++)
        {
            var item = items[i];
            var isLast = i == items.Count - 1;
            var borderStyle = isLast ? "" : $"border-bottom: 1px solid {config.BorderColor};";

            var imageCell = showProductImages
                ? $"""
                                <td style="width: 64px; padding-right: 12px;">
                                    {GetProductImageHtml(item.ImageUrl, config)}
                                </td>
                """
                : "";

            var quantityLine = showQuantity
                ? $"""<p style="margin: 6px 0 0 0; font-size: 12px; color: {config.MutedColor};">Quantidade: {item.Quantity}</p>"""
                : "";

            var priceCell = showPrices
                ? $"""
                                <td align="right" style="vertical-align: top;">
                                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">{FormatCurrency(item.TotalPrice)}</p>
                                </td>
                """
                : "";

            sb.AppendLine($"""
                <tr>
                    <td style="padding: 12px 0; {borderStyle}">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                {imageCell}
                                <td style="vertical-align: top;">
                                    <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">{System.Web.HttpUtility.HtmlEncode(item.ProductName)}</p>
                                    {(!string.IsNullOrWhiteSpace(item.VariantName) ? $"""<p style="margin: 0; font-size: 12px; color: {config.MutedColor};">{System.Web.HttpUtility.HtmlEncode(item.VariantName)}</p>""" : "")}
                                    {quantityLine}
                                </td>
                                {priceCell}
                            </tr>
                        </table>
                    </td>
                </tr>
            """);
        }

        sb.AppendLine("</table>");
        return sb.ToString();
    }

    private static string BuildDigitalItemsListHtml(
        List<DigitalDeliveryItem> items,
        EmailRenderConfig config,
        bool showProductImages = true,
        bool showPrices = true,
        bool showQuantity = true)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">""");

        for (var i = 0; i < items.Count; i++)
        {
            var item = items[i];
            var isLast = i == items.Count - 1;
            var borderStyle = isLast ? "" : $"border-bottom: 1px solid {config.BorderColor};";

            var imageCell = showProductImages && !string.IsNullOrWhiteSpace(item.ImageUrl)
                ? $"""
                                <td style="width: 64px; padding-right: 12px; vertical-align: top;">
                                    <img src="{System.Web.HttpUtility.HtmlAttributeEncode(item.ImageUrl)}" alt="{System.Web.HttpUtility.HtmlAttributeEncode(item.ProductName)}" style="width: 56px; height: 56px; border-radius: 8px; object-fit: cover;">
                                </td>
                                """
                : "";

            var quantityPriceInfo = "";
            if (showQuantity && showPrices)
            {
                quantityPriceInfo = $"""<p style="margin: 0 0 8px 0; font-size: 12px; color: {config.MutedColor};">Quantidade: {item.Quantity} &bull; {FormatCurrency(item.TotalPrice)}</p>""";
            }
            else if (showQuantity)
            {
                quantityPriceInfo = $"""<p style="margin: 0 0 8px 0; font-size: 12px; color: {config.MutedColor};">Quantidade: {item.Quantity}</p>""";
            }
            else if (showPrices)
            {
                quantityPriceInfo = $"""<p style="margin: 0 0 8px 0; font-size: 12px; color: {config.MutedColor};">{FormatCurrency(item.TotalPrice)}</p>""";
            }

            sb.AppendLine($"""
                <tr>
                    <td style="padding: 16px 0; {borderStyle}">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                {imageCell}
                                <td style="vertical-align: top;">
                                    <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">{System.Web.HttpUtility.HtmlEncode(item.ProductName)}</p>
                                    {(!string.IsNullOrWhiteSpace(item.VariantName) ? $"""<p style="margin: 0 0 6px 0; font-size: 12px; color: {config.MutedColor};">{System.Web.HttpUtility.HtmlEncode(item.VariantName)}</p>""" : "")}
                                    {quantityPriceInfo}
                                    {GetDigitalItemsContentHtml(item.Items, config)}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            """);
        }

        sb.AppendLine("</table>");
        return sb.ToString();
    }

    private static string GetDigitalItemsContentHtml(List<DigitalItemContent> items, EmailRenderConfig config)
    {
        if (items.Count == 0) return "";

        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"""<div style="background-color: {config.ContainerBackgroundColor}; border-radius: 8px; padding: 12px; border: 1px solid {config.BorderColor};">""");

        for (var i = 0; i < items.Count; i++)
        {
            var content = items[i];
            var label = content.Label ?? "Conteúdo";
            var marginBottom = i == items.Count - 1 ? "0" : "10px";

            if (content.Content.StartsWith("http://") || content.Content.StartsWith("https://"))
            {
                sb.AppendLine($"""
                    <div style="margin-bottom: {marginBottom};">
                        <p style="margin: 0 0 2px 0; font-size: 11px; color: {config.MutedColor}; text-transform: uppercase;">{System.Web.HttpUtility.HtmlEncode(label)}</p>
                        <a href="{System.Web.HttpUtility.HtmlAttributeEncode(content.Content)}" style="color: {config.PrimaryColor}; font-size: 13px; word-break: break-all;">{System.Web.HttpUtility.HtmlEncode(content.Content)}</a>
                    </div>
                """);
            }
            else
            {
                sb.AppendLine($"""
                    <div style="margin-bottom: {marginBottom};">
                        <p style="margin: 0 0 2px 0; font-size: 11px; color: {config.MutedColor}; text-transform: uppercase;">{System.Web.HttpUtility.HtmlEncode(label)}</p>
                        <p style="margin: 0; font-size: 13px; font-family: 'SF Mono', SFMono-Regular, Consolas, monospace; color: {config.TextColor}; word-break: break-all;">{System.Web.HttpUtility.HtmlEncode(content.Content)}</p>
                    </div>
                """);
            }
        }

        sb.AppendLine("</div>");
        return sb.ToString();
    }

    private static string GetProductImageHtml(string? imageUrl, EmailRenderConfig config)
    {
        if (!string.IsNullOrWhiteSpace(imageUrl))
        {
            return $"""
                <img src="{System.Web.HttpUtility.HtmlAttributeEncode(imageUrl)}" alt="Produto" style="width: 56px; height: 56px; border-radius: 8px; object-fit: cover;">
            """;
        }

        return $"""
            <div style="width: 56px; height: 56px; border-radius: 8px; background-color: {config.BorderColor}; text-align: center; line-height: 56px; color: #9ca3af; font-size: 12px;">
                Foto
            </div>
        """;
    }
}
