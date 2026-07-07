using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Templates.UpdateTemplate;

public sealed class UpdateTemplateEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdateTemplateRequest, UpdateTemplateResponse>
{
    public override void Configure()
    {
        Patch("templates/{templateId:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(UpdateTemplateRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateTemplateResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var template = await dbContext.CheckoutTemplates
            .OrderBy(t => t.Id)
            .FirstOrDefaultAsync(t => t.Id == req.TemplateId, ct);

        if (template == null)
        {
            await Send.ResponseAsync(new UpdateTemplateResponse
            {
                Error = new("Template não encontrado.")
            }, 404, ct);
            return;
        }

        if (!string.IsNullOrEmpty(req.Code) && req.Code != template.Code)
        {
            var existingCode = await dbContext.CheckoutTemplates
                .AnyAsync(t => t.Code == req.Code && t.Id != req.TemplateId, ct);

            if (existingCode)
            {
                await Send.ResponseAsync(new UpdateTemplateResponse
                {
                    Error = new("Já existe um template com este código.")
                }, 400, ct);
                return;
            }

            template.Code = req.Code;
        }

        if (req.Type.HasValue)
            template.Type = req.Type.Value;

        if (!string.IsNullOrEmpty(req.Name))
            template.Name = req.Name;

        if (req.ShortDescription != null)
            template.ShortDescription = string.IsNullOrEmpty(req.ShortDescription) ? null : req.ShortDescription;

        if (req.FullDescription != null)
            template.FullDescription = string.IsNullOrEmpty(req.FullDescription) ? null : req.FullDescription;

        if (req.BestFor != null)
            template.BestFor = string.IsNullOrEmpty(req.BestFor) ? null : req.BestFor;

        if (req.ThumbnailUrl != null)
            template.ThumbnailUrl = string.IsNullOrEmpty(req.ThumbnailUrl) ? null : req.ThumbnailUrl;

        if (req.PreviewImages != null)
            template.PreviewImages = req.PreviewImages;

        if (req.Features != null)
            template.Features = req.Features;

        // Remover taxa (tornar gratuito)
        if (req.RemoveFee == true)
        {
            template.FeeMode = null;
            template.FeeFixed = 0;
            template.FeePercentage = 0;
        }
        else
        {
            // Atualizar modo de taxa (se informado, template passa a ter taxa)
            if (req.FeeMode.HasValue)
                template.FeeMode = req.FeeMode.Value;

            if (req.FeeFixed.HasValue)
                template.FeeFixed = req.FeeFixed.Value;

            if (req.FeePercentage.HasValue)
                template.FeePercentage = req.FeePercentage.Value;
        }

        TemplateFeeModeNormalizer.Normalize(template);

        if (req.IsActive.HasValue)
            template.IsActive = req.IsActive.Value;

        if (req.SupportsCoupons.HasValue)
            template.SupportsCoupons = req.SupportsCoupons.Value;

        if (req.SupportsShipping.HasValue)
            template.SupportsShipping = req.SupportsShipping.Value;

        if (req.SupportsTimer.HasValue)
            template.SupportsTimer = req.SupportsTimer.Value;

        if (req.SupportsSocialProof.HasValue)
            template.SupportsSocialProof = req.SupportsSocialProof.Value;

        // Tracking support
        if (req.SupportsClarity.HasValue)
            template.SupportsClarity = req.SupportsClarity.Value;

        if (req.SupportsFacebookPixel.HasValue)
            template.SupportsFacebookPixel = req.SupportsFacebookPixel.Value;

        if (req.SupportsGoogleTagManager.HasValue)
            template.SupportsGoogleTagManager = req.SupportsGoogleTagManager.Value;

        if (req.SupportsTikTok.HasValue)
            template.SupportsTikTok = req.SupportsTikTok.Value;

        if (req.SupportsKwai.HasValue)
            template.SupportsKwai = req.SupportsKwai.Value;

        if (req.SupportsPinterest.HasValue)
            template.SupportsPinterest = req.SupportsPinterest.Value;

        if (req.SupportsTaboola.HasValue)
            template.SupportsTaboola = req.SupportsTaboola.Value;

        if (req.SupportsUtmify.HasValue)
            template.SupportsUtmify = req.SupportsUtmify.Value;

        if (req.SupportsOtimizey.HasValue)
            template.SupportsOtimizey = req.SupportsOtimizey.Value;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateTemplateResponse
        {
            Data = AdminTemplateMapper.ToData(template),
            Message = "Template atualizado com sucesso."
        }, ct);
    }
}
