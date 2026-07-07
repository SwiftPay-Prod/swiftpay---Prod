using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Mappers;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.EmailTemplates.ReadEmailTemplate;

public sealed class ReadEmailTemplateEndpoint(PrimaryDbContext dbContext)
    : Endpoint<ReadEmailTemplateRequest, ReadEmailTemplateResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/email-templates/{type}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadEmailTemplateRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadEmailTemplateResponse
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
            await Send.ResponseAsync(new ReadEmailTemplateResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var template = await dbContext.MerchantEmailTemplates
            .AsNoTracking()
            .OrderBy(t => t.Id)
            .FirstOrDefaultAsync(t => t.MerchantId == req.MerchantId && t.Type == req.Type, ct);

        if (template == null)
        {
            await Send.ResponseAsync(new ReadEmailTemplateResponse
            {
                Error = new("Template não encontrado.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadEmailTemplateResponse
        {
            Data = EmailTemplateMapper.ToData(template)
        }, ct);
    }
}
