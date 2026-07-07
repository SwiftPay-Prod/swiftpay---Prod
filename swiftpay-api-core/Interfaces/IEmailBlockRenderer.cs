using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Interfaces;

public interface IEmailBlockRenderer
{
    string RenderBlocks(
        List<EmailBlock> blocks,
        Dictionary<string, string> variables,
        EmailRenderConfig? config = null);

    string RenderPreview(
        List<EmailBlock> blocks,
        MerchantEmailTemplateType templateType,
        EmailRenderConfig? config = null);
}

public sealed class EmailRenderConfig
{
    public string PrimaryColor { get; set; } = "#6366f1";
    public string BackgroundColor { get; set; } = "#f4f4f5";
    public string ContainerBackgroundColor { get; set; } = "#ffffff";
    public string TextColor { get; set; } = "#111827";
    public string MutedColor { get; set; } = "#6b7280";
    public string? LogoUrl { get; set; }
    public string MerchantName { get; set; } = "Sua Loja";

    public string CardBackgroundColor => AdjustColorBrightness(ContainerBackgroundColor, -0.03);
    public string BorderColor => AdjustColorBrightness(ContainerBackgroundColor, -0.10);

    private static string AdjustColorBrightness(string hexColor, double factor)
    {
        if (string.IsNullOrEmpty(hexColor) || !hexColor.StartsWith('#') || hexColor.Length != 7)
            return "#f9fafb";

        try
        {
            var r = Convert.ToInt32(hexColor.Substring(1, 2), 16);
            var g = Convert.ToInt32(hexColor.Substring(3, 2), 16);
            var b = Convert.ToInt32(hexColor.Substring(5, 2), 16);

            r = Math.Clamp((int)(r + (255 * factor)), 0, 255);
            g = Math.Clamp((int)(g + (255 * factor)), 0, 255);
            b = Math.Clamp((int)(b + (255 * factor)), 0, 255);

            return $"#{r:X2}{g:X2}{b:X2}";
        }
        catch
        {
            return "#f9fafb";
        }
    }
}
