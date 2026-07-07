using System.Text;
using System.Web;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Services;

public sealed class EmailBlockRenderer : IEmailBlockRenderer
{
    public string RenderBlocks(
        List<EmailBlock> blocks,
        Dictionary<string, string> variables,
        EmailRenderConfig? config = null)
    {
        config ??= new EmailRenderConfig();
        var sb = new StringBuilder();

        sb.AppendLine(GenerateEmailWrapper(config, true));

        foreach (var block in blocks.OrderBy(b => b.Order))
        {
            var blockHtml = RenderBlock(block, config);
            sb.AppendLine(blockHtml);
        }

        sb.AppendLine(GenerateEmailWrapper(config, false));

        var html = sb.ToString();
        return ReplaceVariables(html, variables);
    }

    public string RenderPreview(
        List<EmailBlock> blocks,
        MerchantEmailTemplateType templateType,
        EmailRenderConfig? config = null)
    {
        config ??= new EmailRenderConfig();
        var previewVariables = GetPreviewVariables(templateType, config);
        return RenderBlocks(blocks, previewVariables, config);
    }

    private string RenderBlock(EmailBlock block, EmailRenderConfig config)
    {
        return block.Type switch
        {
            EmailBlockType.Header => RenderHeaderBlock(block, config),
            EmailBlockType.Text => RenderTextBlock(block, config),
            EmailBlockType.Button => RenderButtonBlock(block, config),
            EmailBlockType.Image => RenderImageBlock(block),
            EmailBlockType.Banner => RenderBannerBlock(block),
            EmailBlockType.ProductList => RenderProductListBlock(block, config),
            EmailBlockType.DigitalItemsList => RenderDigitalItemsListBlock(block, config),
            EmailBlockType.TrackingInfo => RenderTrackingInfoBlock(block, config),
            EmailBlockType.Divider => RenderDividerBlock(block, config),
            EmailBlockType.Spacer => RenderSpacerBlock(block),
            EmailBlockType.Footer => RenderFooterBlock(block, config),
            EmailBlockType.Columns => RenderColumnsBlock(block, config),
            EmailBlockType.OrderSummary => RenderOrderSummaryBlock(block, config),
            _ => string.Empty
        };
    }

    private string GenerateEmailWrapper(EmailRenderConfig config, bool isStart)
    {
        if (isStart)
        {
            return $"""
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: {config.BackgroundColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: {config.BackgroundColor};">
                        <tr>
                            <td align="center" style="padding: 40px 20px;">
                                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: {config.ContainerBackgroundColor}; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                    <tr>
                                        <td style="padding: 0;">
                """;
        }

        return """
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """;
    }

    private string RenderHeaderBlock(EmailBlock block, EmailRenderConfig config)
    {
        var settings = block.Settings ?? new EmailBlockSettings();
        var textColor = settings.TextColor ?? config.TextColor;
        var fontSize = settings.FontSize ?? 24;
        var textAlign = GetTextAlign(settings.TextAlign);
        var content = block.Content ?? "";

        var sb = new StringBuilder();

        if (!string.IsNullOrWhiteSpace(config.LogoUrl))
        {
            sb.AppendLine($"""
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center" style="padding: 30px 40px 20px 40px;">
                            <img src="{HttpUtility.HtmlEncode(config.LogoUrl)}" alt="{HttpUtility.HtmlEncode(config.MerchantName)}" style="max-width: 180px; max-height: 60px; height: auto;">
                        </td>
                    </tr>
                </table>
                """);
        }

        var fontWeight = settings.Bold == true ? "700" : "600";
        var fontStyle = settings.Italic == true ? "italic" : "normal";

        sb.AppendLine($"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="{textAlign}" style="padding: 20px 40px;">
                        <h1 style="margin: 0; color: {textColor}; font-size: {fontSize}px; font-weight: {fontWeight}; font-style: {fontStyle}; line-height: 1.3;">
                            {HttpUtility.HtmlEncode(content)}
                        </h1>
                    </td>
                </tr>
            </table>
            """);

        return sb.ToString();
    }

    private static string RenderTextBlock(EmailBlock block, EmailRenderConfig config)
    {
        var settings = block.Settings ?? new EmailBlockSettings();
        var textColor = settings.TextColor ?? config.MutedColor;
        var fontSize = settings.FontSize ?? 16;
        var textAlign = GetTextAlign(settings.TextAlign);
        var content = block.Content ?? "";

        var fontWeight = settings.Bold == true ? "700" : "400";
        var fontStyle = settings.Italic == true ? "italic" : "normal";

        var htmlContent = HttpUtility.HtmlEncode(content).Replace("\n", "<br>");

        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="{textAlign}" style="padding: 10px 40px;">
                        <p style="margin: 0; color: {textColor}; font-size: {fontSize}px; font-weight: {fontWeight}; font-style: {fontStyle}; line-height: 1.6;">
                            {htmlContent}
                        </p>
                    </td>
                </tr>
            </table>
            """;
    }

    private static string RenderButtonBlock(EmailBlock block, EmailRenderConfig config)
    {
        var settings = block.Settings ?? new EmailBlockSettings();
        var buttonUrl = settings.ButtonUrl ?? "#";
        var buttonColor = settings.ButtonBackgroundColor ?? config.PrimaryColor;
        var buttonTextColor = settings.ButtonTextColor ?? "#ffffff";
        var content = block.Content ?? "Clique aqui";
        var textAlign = GetTextAlign(settings.TextAlign);

        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="{textAlign}" style="padding: 20px 40px;">
                        <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                                <td style="border-radius: 6px; background-color: {buttonColor};">
                                    <a href="{HttpUtility.HtmlEncode(buttonUrl)}" target="_blank" style="display: inline-block; padding: 14px 28px; color: {buttonTextColor}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                                        {HttpUtility.HtmlEncode(content)}
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            """;
    }

    private static string RenderImageBlock(EmailBlock block)
    {
        var settings = block.Settings ?? new EmailBlockSettings();
        var imageUrl = settings.ImageUrl ?? block.Content ?? "";
        var imageAlt = settings.ImageAlt ?? "Imagem";
        var imageWidth = settings.ImageWidth ?? "100%";
        var textAlign = GetTextAlign(settings.TextAlign);

        if (string.IsNullOrWhiteSpace(imageUrl))
            return string.Empty;

        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="{textAlign}" style="padding: 20px 40px;">
                        <img src="{HttpUtility.HtmlEncode(imageUrl)}" alt="{HttpUtility.HtmlEncode(imageAlt)}" style="max-width: {imageWidth}; height: auto; border-radius: 8px;">
                    </td>
                </tr>
            </table>
            """;
    }

    private static string RenderBannerBlock(EmailBlock block)
    {
        var settings = block.Settings ?? new EmailBlockSettings();
        var imageUrl = settings.ImageUrl ?? block.Content ?? "";
        var imageAlt = settings.ImageAlt ?? "Banner";
        var imageLink = settings.ImageLink;

        if (string.IsNullOrWhiteSpace(imageUrl))
            return string.Empty;

        var imgHtml = $"""<img src="{HttpUtility.HtmlEncode(imageUrl)}" alt="{HttpUtility.HtmlEncode(imageAlt)}" style="display: block; width: 100%; height: auto;">""";

        if (!string.IsNullOrWhiteSpace(imageLink))
        {
            imgHtml = $"""<a href="{HttpUtility.HtmlEncode(imageLink)}" target="_blank" style="display: block;">{imgHtml}</a>""";
        }

        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 0;">
                        {imgHtml}
                    </td>
                </tr>
            </table>
            """;
    }

    private static string RenderProductListBlock(EmailBlock block, EmailRenderConfig config)
    {
        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 20px 40px;">
                        <div style="background-color: {config.CardBackgroundColor}; border-radius: 8px; padding: 20px; border: 1px solid {config.BorderColor}; color: {config.TextColor};">
                            <p style="color: {config.PrimaryColor}; font-weight: 600; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                                Itens do Pedido
                            </p>
                            [[product_list]]
                        </div>
                    </td>
                </tr>
            </table>
            """;
    }

    private static string RenderDigitalItemsListBlock(EmailBlock block, EmailRenderConfig config)
    {
        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 20px 40px;">
                        <div style="background-color: {config.CardBackgroundColor}; border-radius: 8px; padding: 20px; border: 1px solid {config.BorderColor}; color: {config.TextColor};">
                            <p style="color: {config.PrimaryColor}; font-weight: 600; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                                Seus Itens Digitais
                            </p>
                            [[digital_items_list]]
                        </div>
                    </td>
                </tr>
            </table>
            """;
    }

    private static string RenderTrackingInfoBlock(EmailBlock block, EmailRenderConfig config)
    {
        var settings = block.Settings ?? new EmailBlockSettings();
        var title = block.Content ?? "Informações de Rastreio";

        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 20px 40px;">
                        <div style="background-color: {config.PrimaryColor}10; border: 2px solid {config.PrimaryColor}30; border-radius: 8px; padding: 20px;">
                            <p style="color: {config.PrimaryColor}; font-weight: 600; font-size: 14px; margin: 0 0 10px 0;">
                                {HttpUtility.HtmlEncode(title)}
                            </p>
                            <p style="color: {config.TextColor}; font-size: 14px; margin: 0 0 5px 0;">
                                <strong>Transportadora:</strong> [[carrier_name]]
                            </p>
                            <p style="color: {config.TextColor}; font-size: 14px; margin: 0 0 15px 0;">
                                <strong>Código:</strong> <code style="background-color: #ffffff; padding: 4px 8px; border-radius: 4px; font-family: monospace;">[[tracking_code]]</code>
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="border-radius: 6px; background-color: {config.PrimaryColor};">
                                        <a href="[[tracking_url]]" target="_blank" style="display: inline-block; padding: 10px 20px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                                            Rastrear Pedido
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>
            """;
    }

    private static string RenderDividerBlock(EmailBlock block, EmailRenderConfig config)
    {
        var settings = block.Settings ?? new EmailBlockSettings();
        var dividerColor = settings.DividerColor ?? config.BorderColor;
        var dividerThickness = settings.DividerThickness ?? 1;

        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 20px 40px;">
                        <hr style="border: none; border-top: {dividerThickness}px solid {dividerColor}; margin: 0;">
                    </td>
                </tr>
            </table>
            """;
    }

    private static string RenderSpacerBlock(EmailBlock block)
    {
        var settings = block.Settings ?? new EmailBlockSettings();
        var spacerHeight = settings.SpacerHeight ?? 20;

        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="height: {spacerHeight}px; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
            </table>
            """;
    }

    private static string RenderFooterBlock(EmailBlock block, EmailRenderConfig config)
    {
        var settings = block.Settings ?? new EmailBlockSettings();
        var content = block.Content ?? $"© {DateTime.UtcNow.Year} {config.MerchantName}. Todos os direitos reservados.";
        var textColor = settings.TextColor ?? config.MutedColor;
        var textAlign = GetTextAlign(settings.TextAlign ?? EmailTextAlignment.Center);

        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 30px 40px; border-top: 1px solid {config.BorderColor};">
                        <p style="margin: 0; color: {textColor}; font-size: 13px; text-align: {textAlign}; line-height: 1.5;">
                            {HttpUtility.HtmlEncode(content)}
                        </p>
                    </td>
                </tr>
            </table>
            """;
    }

    private string RenderColumnsBlock(EmailBlock block, EmailRenderConfig config)
    {
        var settings = block.Settings ?? new EmailBlockSettings();
        var columns = settings.Columns ?? [];

        if (columns.Count == 0)
            return string.Empty;

        var columnWidth = 100 / columns.Count;

        var sb = new StringBuilder();
        sb.AppendLine("""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 20px 40px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
            """);

        foreach (var column in columns)
        {
            sb.AppendLine($"""
                                <td style="width: {columnWidth}%; vertical-align: top; padding: 0 10px;">
                """);

            foreach (var childBlock in column.Blocks)
            {
                var childHtml = RenderBlock(childBlock, config);
                var strippedHtml = StripOuterPadding(childHtml);
                sb.AppendLine(strippedHtml);
            }

            sb.AppendLine("                </td>");
        }

        sb.AppendLine("""
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            """);

        return sb.ToString();
    }

    private static string RenderOrderSummaryBlock(EmailBlock block, EmailRenderConfig config)
    {
        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 20px 40px;">
                        <div style="background-color: {config.CardBackgroundColor}; border-radius: 8px; padding: 20px; border: 1px solid {config.BorderColor};">
                            <p style="color: {config.TextColor}; font-weight: 600; font-size: 16px; margin: 0 0 15px 0;">
                                Resumo do Pedido
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="padding: 8px 0; color: {config.MutedColor}; font-size: 14px;">Subtotal</td>
                                    <td align="right" style="padding: 8px 0; color: {config.TextColor}; font-size: 14px;">[[order_subtotal]]</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: {config.MutedColor}; font-size: 14px;">Frete</td>
                                    <td align="right" style="padding: 8px 0; color: {config.TextColor}; font-size: 14px;">[[order_shipping]]</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: {config.MutedColor}; font-size: 14px;">Desconto</td>
                                    <td align="right" style="padding: 8px 0; color: #10b981; font-size: 14px;">-[[order_discount]]</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 10px 0 0 0;">
                                        <hr style="border: none; border-top: 1px solid {config.BorderColor}; margin: 0;">
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0 0 0; color: {config.TextColor}; font-size: 16px; font-weight: 700;">Total</td>
                                    <td align="right" style="padding: 10px 0 0 0; color: {config.TextColor}; font-size: 16px; font-weight: 700;">[[order_total]]</td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>
            """;
    }

    private static string GetTextAlign(EmailTextAlignment? alignment)
    {
        return alignment switch
        {
            EmailTextAlignment.Left => "left",
            EmailTextAlignment.Center => "center",
            EmailTextAlignment.Right => "right",
            _ => "left"
        };
    }

    private static readonly HashSet<string> RawHtmlVariables = new(StringComparer.OrdinalIgnoreCase)
    {
        "product_list",
        "digital_items_list",
        "cart_items"
    };

    private static string ReplaceVariables(string html, Dictionary<string, string> variables)
    {
        foreach (var (key, value) in variables)
        {
            var replacement = RawHtmlVariables.Contains(key) ? value : HttpUtility.HtmlEncode(value);
            html = html.Replace($"[[{key}]]", replacement);
        }
        return html;
    }

    private static string StripOuterPadding(string html)
    {
        return html
            .Replace("padding: 20px 40px;", "padding: 10px 0;")
            .Replace("padding: 10px 40px;", "padding: 5px 0;")
            .Replace("padding: 30px 40px;", "padding: 15px 0;");
    }

    private static Dictionary<string, string> GetPreviewVariables(MerchantEmailTemplateType templateType, EmailRenderConfig config)
    {
        var common = new Dictionary<string, string>
        {
            { "customer_name", "João Silva" },
            { "customer_email", "joao.silva@exemplo.com" },
            { "merchant_name", "Minha Loja" },
            { "merchant_logo", "https://placehold.co/180x60?text=Logo" },
            { "order_number", "#12345" },
            { "order_date", DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm") },
            { "order_total", "R$ 199,90" },
            { "order_subtotal", "R$ 179,90" },
            { "order_shipping", "R$ 25,00" },
            { "order_discount", "R$ 5,00" },
            { "payment_method", "PIX" },
            { "support_email", "suporte@minhaloja.com" },
            { "support_phone", "(11) 99999-9999" },
            { "store_url", "https://minhaloja.com" }
        };

        var templateSpecific = templateType switch
        {
            MerchantEmailTemplateType.DigitalDelivery => new Dictionary<string, string>
            {
                { "digital_items_list", GeneratePreviewDigitalItems(config) }
            },
            MerchantEmailTemplateType.OrderShipped => new Dictionary<string, string>
            {
                { "carrier_name", "Correios - SEDEX" },
                { "tracking_code", "BR123456789BR" },
                { "tracking_url", "https://rastreamento.correios.com.br/app/index.php" },
                { "estimated_delivery", "25/01/2025" }
            },
            MerchantEmailTemplateType.OrderDelivered => new Dictionary<string, string>
            {
                { "delivery_date", DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm") }
            },
            MerchantEmailTemplateType.Welcome => new Dictionary<string, string>
            {
                { "registration_date", DateTime.UtcNow.ToString("dd/MM/yyyy") }
            },
            MerchantEmailTemplateType.AbandonedCart => new Dictionary<string, string>
            {
                { "cart_items", GeneratePreviewCartItems(config) },
                { "cart_total", "R$ 299,90" },
                { "cart_items_count", "3" },
                { "checkout_url", "https://minhaloja.com/checkout/abc123" }
            },
            _ => new Dictionary<string, string>()
        };

        foreach (var (key, value) in templateSpecific)
        {
            common[key] = value;
        }

        common["product_list"] = GeneratePreviewProductList(config);

        return common;
    }

    private static string GeneratePreviewDigitalItems(EmailRenderConfig config)
    {
        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid {config.BorderColor};">
                        <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">Curso Completo de Marketing</p>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: {config.MutedColor};">Acesso imediato ao portal do curso.</p>
                        <p style="margin: 0; font-size: 12px; color: {config.TextColor};">
                            <strong>Link:</strong> <span style="color: {config.PrimaryColor};">https://minhaloja.com/acesso/abc123</span>
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0;">
                        <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">Chave de Ativação</p>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: {config.MutedColor};">Use a chave abaixo para liberar o produto.</p>
                        <p style="margin: 0; font-size: 13px; font-family: monospace; background-color: {config.ContainerBackgroundColor}; padding: 8px 10px; border-radius: 6px; border: 1px solid {config.BorderColor}; display: inline-block;">
                            KEY-9F3J-82LK-PP21
                        </p>
                    </td>
                </tr>
            </table>
            """;
    }

    private static string GeneratePreviewProductList(EmailRenderConfig config)
    {
        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid {config.BorderColor};">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                <td style="width: 64px; padding-right: 12px;">
                                    <div style="width: 56px; height: 56px; border-radius: 8px; background-color: {config.BorderColor}; text-align: center; line-height: 56px; color: #9ca3af; font-size: 12px;">
                                        Foto
                                    </div>
                                </td>
                                <td style="vertical-align: top;">
                                    <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">Camiseta Premium</p>
                                    <p style="margin: 0; font-size: 12px; color: {config.MutedColor};">Tamanho M • Cor Preta</p>
                                    <p style="margin: 6px 0 0 0; font-size: 12px; color: {config.MutedColor};">Quantidade: 1</p>
                                </td>
                                <td align="right" style="vertical-align: top;">
                                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">R$ 89,90</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                <td style="width: 64px; padding-right: 12px;">
                                    <div style="width: 56px; height: 56px; border-radius: 8px; background-color: {config.BorderColor}; text-align: center; line-height: 56px; color: #9ca3af; font-size: 12px;">
                                        Foto
                                    </div>
                                </td>
                                <td style="vertical-align: top;">
                                    <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">Tênis Runner</p>
                                    <p style="margin: 0; font-size: 12px; color: {config.MutedColor};">Tamanho 42</p>
                                    <p style="margin: 6px 0 0 0; font-size: 12px; color: {config.MutedColor};">Quantidade: 2</p>
                                </td>
                                <td align="right" style="vertical-align: top;">
                                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">R$ 209,90</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            """;
    }

    private static string GeneratePreviewCartItems(EmailRenderConfig config)
    {
        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid {config.BorderColor};">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                <td style="width: 64px; padding-right: 12px;">
                                    <div style="width: 56px; height: 56px; border-radius: 8px; background-color: {config.BorderColor}; text-align: center; line-height: 56px; color: #9ca3af; font-size: 12px;">
                                        Foto
                                    </div>
                                </td>
                                <td style="vertical-align: top;">
                                    <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">Produto Abandonado 1</p>
                                </td>
                                <td align="right" style="vertical-align: top;">
                                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">R$ 149,90</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                <td style="width: 64px; padding-right: 12px;">
                                    <div style="width: 56px; height: 56px; border-radius: 8px; background-color: {config.BorderColor}; text-align: center; line-height: 56px; color: #9ca3af; font-size: 12px;">
                                        Foto
                                    </div>
                                </td>
                                <td style="vertical-align: top;">
                                    <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">Produto Abandonado 2</p>
                                </td>
                                <td align="right" style="vertical-align: top;">
                                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: {config.TextColor};">R$ 150,00</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            """;
    }
}
