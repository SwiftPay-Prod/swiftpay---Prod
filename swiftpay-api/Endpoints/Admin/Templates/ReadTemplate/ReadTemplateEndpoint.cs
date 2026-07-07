using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Templates.ReadTemplate;

public sealed class ReadTemplateEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadTemplateRequest, ReadTemplateResponse>
{
    public override void Configure()
    {
        Get("templates/{templateId:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadTemplateRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadTemplateResponse
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
            await Send.ResponseAsync(new ReadTemplateResponse
            {
                Error = new("Template não encontrado.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadTemplateResponse
        {
            Data = AdminTemplateMapper.ToData(template)
        }, ct);
    }
}
