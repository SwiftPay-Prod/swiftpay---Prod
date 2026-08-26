using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using NotificationTemplateCatalog = swiftpay_api_core.Constants.NotificationTemplates;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Users.NotificationTemplates.DeleteNotificationTemplate;

public sealed class DeleteNotificationTemplateEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<DeleteNotificationTemplateRequest, DeleteNotificationTemplateResponse>
{
    public override void Configure()
    {
        Delete("notification-templates/{Type}/{StatusType}");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(DeleteNotificationTemplateRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteNotificationTemplateResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        if (!NotificationTemplateCatalog.IsSupported(req.Type, req.StatusType))
        {
            await Send.ResponseAsync(new DeleteNotificationTemplateResponse
            {
                Error = new("O evento de notificação informado não permite personalização.")
            }, 400, ct);
            return;
        }

        var entity = await dbContext.UserNotificationTemplates
            .Where(template =>
                template.UserId == userId.Value &&
                template.Type == req.Type &&
                template.StatusType == req.StatusType)
            .FirstOrDefaultAsync(ct);

        if (entity != null)
        {
            dbContext.UserNotificationTemplates.Remove(entity);
            await dbContext.SaveChangesAsync(ct);
        }

        await Send.OkAsync(new DeleteNotificationTemplateResponse
        {
            Data = true
        }, ct);
    }
}
