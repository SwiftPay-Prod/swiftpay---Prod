using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Mappers;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.EmailTemplates.UpsertEmailTemplate;

public sealed class UpsertEmailTemplateEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider
) : Endpoint<UpsertEmailTemplateRequest, UpsertEmailTemplateResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/email-templates/{type}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpsertEmailTemplateRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpsertEmailTemplateResponse
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
            await Send.ResponseAsync(new UpsertEmailTemplateResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var template = await dbContext.MerchantEmailTemplates
            .OrderBy(t => t.Id)
            .FirstOrDefaultAsync(t => t.MerchantId == req.MerchantId && t.Type == req.Type, ct);

        if (template == null)
        {
            template = new MerchantEmailTemplate
            {
                MerchantId = req.MerchantId,
                Type = req.Type,
                Environment = environmentProvider.CurrentEnvironment,
                Name = req.Name?.Trim() ?? MerchantEmailTemplate.GetDefaultName(req.Type),
                Subject = req.Subject?.Trim() ?? MerchantEmailTemplate.GetDefaultSubject(req.Type),
                Blocks = NormalizeBlocks(req.Blocks, req.Type),
                PrimaryColor = req.PrimaryColor?.Trim() ?? "#6366F1",
                BackgroundColor = req.BackgroundColor?.Trim() ?? "#F3F4F6",
                ContainerBackgroundColor = req.ContainerBackgroundColor?.Trim() ?? "#FFFFFF",
                TextColorMode = req.TextColorMode?.Trim() ?? "dark",
                Enabled = req.Enabled ?? true,
                IsDefault = req.IsDefault ?? true
            };

            dbContext.MerchantEmailTemplates.Add(template);
        }
        else
        {
            if (req.Name != null && !string.IsNullOrWhiteSpace(req.Name))
                template.Name = req.Name.Trim();

            if (req.Subject != null && !string.IsNullOrWhiteSpace(req.Subject))
                template.Subject = req.Subject.Trim();

            if (req.Blocks != null)
                template.Blocks = NormalizeBlocks(req.Blocks, req.Type);

            if (req.PrimaryColor != null && !string.IsNullOrWhiteSpace(req.PrimaryColor))
                template.PrimaryColor = req.PrimaryColor.Trim();

            if (req.BackgroundColor != null && !string.IsNullOrWhiteSpace(req.BackgroundColor))
                template.BackgroundColor = req.BackgroundColor.Trim();

            if (req.ContainerBackgroundColor != null && !string.IsNullOrWhiteSpace(req.ContainerBackgroundColor))
                template.ContainerBackgroundColor = req.ContainerBackgroundColor.Trim();

            if (req.TextColorMode != null && !string.IsNullOrWhiteSpace(req.TextColorMode))
                template.TextColorMode = req.TextColorMode.Trim();

            if (req.Enabled.HasValue)
                template.Enabled = req.Enabled.Value;

            if (req.IsDefault.HasValue)
                template.IsDefault = req.IsDefault.Value;
        }

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpsertEmailTemplateResponse
        {
            Data = EmailTemplateMapper.ToData(template),
            Message = "Template de email atualizado com sucesso!"
        }, ct);
    }

    private static List<EmailBlock> NormalizeBlocks(List<EmailBlock>? blocks, MerchantEmailTemplateType type)
    {
        if (blocks == null || blocks.Count == 0)
            return MerchantEmailTemplate.GetDefaultBlocks(type);

        var normalized = new List<EmailBlock>(blocks.Count);
        for (var index = 0; index < blocks.Count; index++)
        {
            var block = blocks[index];
            block.Settings ??= new EmailBlockSettings();
            block.Order = index;
            normalized.Add(block);
        }

        return normalized;
    }
}
