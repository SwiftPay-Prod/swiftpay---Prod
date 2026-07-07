using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Templates.CreateTemplate;

public sealed class CreateTemplateEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<CreateTemplateRequest, CreateTemplateResponse>
{
    public override void Configure()
    {
        Post("templates");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CreateTemplateRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateTemplateResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var existingCode = await dbContext.CheckoutTemplates
            .AnyAsync(t => t.Code == req.Code, ct);

        if (existingCode)
        {
            await Send.ResponseAsync(new CreateTemplateResponse
            {
                Error = new("Já existe um template com este código.")
            }, 400, ct);
            return;
        }

        var template = new CheckoutTemplate
        {
            Code = req.Code,
            Type = req.Type,
            Name = req.Name,
            ShortDescription = req.ShortDescription,
            FullDescription = req.FullDescription,
            BestFor = req.BestFor,
            ThumbnailUrl = req.ThumbnailUrl,
            PreviewImages = req.PreviewImages ?? [],
            Features = req.Features ?? [],
            FeeMode = req.FeeMode,
            FeeFixed = req.FeeFixed,
            FeePercentage = req.FeePercentage,
            IsActive = req.IsActive,
            UsageCount = 0,
            SupportsCoupons = req.SupportsCoupons,
            SupportsShipping = req.SupportsShipping,
            SupportsTimer = req.SupportsTimer,
            SupportsSocialProof = req.SupportsSocialProof,
            SupportsClarity = req.SupportsClarity,
            SupportsFacebookPixel = req.SupportsFacebookPixel,
            SupportsGoogleTagManager = req.SupportsGoogleTagManager,
            SupportsTikTok = req.SupportsTikTok,
            SupportsKwai = req.SupportsKwai,
            SupportsPinterest = req.SupportsPinterest,
            SupportsTaboola = req.SupportsTaboola,
            SupportsUtmify = req.SupportsUtmify,
            SupportsOtimizey = req.SupportsOtimizey
        };

        TemplateFeeModeNormalizer.Normalize(template);

        dbContext.CheckoutTemplates.Add(template);
        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new CreateTemplateResponse
        {
            Data = AdminTemplateMapper.ToData(template),
            Message = "Template criado com sucesso."
        }, 201, ct);
    }
}
