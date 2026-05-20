using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.EmailTemplates.SendTestEmail;

public sealed class SendTestEmailEndpoint(
    PrimaryDbContext dbContext,
    IEmailBlockRenderer emailBlockRenderer,
    IEmailService emailService
) : Endpoint<SendTestEmailRequest, SendTestEmailResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/email-templates/{type}/send-test");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(SendTestEmailRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new SendTestEmailResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId.Value, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new SendTestEmailResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var blocks = req.Blocks ?? MerchantEmailTemplate.GetDefaultBlocks(req.Type);

        var config = new EmailRenderConfig
        {
            PrimaryColor = req.PrimaryColor ?? "#6366f1",
            BackgroundColor = req.BackgroundColor ?? "#f4f4f5",
            ContainerBackgroundColor = req.ContainerBackgroundColor ?? "#ffffff",
            TextColor = req.TextColor ?? "#111827",
            MutedColor = req.MutedColor ?? "#6b7280",
            MerchantName = merchant.Name ?? "Minha Loja",
            LogoUrl = null
        };

        var htmlContent = emailBlockRenderer.RenderPreview(blocks, req.Type, config);

        var subject = $"[TESTE] {req.Subject}";

        await emailService.SendHtmlAsync(
            to: req.Email,
            subject: subject,
            htmlContent: htmlContent,
            userId: userId.Value,
            merchantId: merchant.Id,
            templateName: $"Test_{req.Type}");

        await Send.OkAsync(new SendTestEmailResponse
        {
            Message = $"Email de teste enviado para {req.Email}!"
        }, ct);
    }
}
