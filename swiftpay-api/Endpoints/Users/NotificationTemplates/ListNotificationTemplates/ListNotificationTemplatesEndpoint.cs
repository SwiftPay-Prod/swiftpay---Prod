using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using NotificationTemplateCatalog = swiftpay_api_core.Constants.NotificationTemplates;
using swiftpay_api_core.Database;
using swiftpay_api_core.Services;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Users.NotificationTemplates.ListNotificationTemplates;

public sealed class ListNotificationTemplatesEndpoint(
    PrimaryDbContext dbContext
) : EndpointWithoutRequest<ListNotificationTemplatesResponse>
{
    public override void Configure()
    {
        Get("notification-templates");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ListNotificationTemplatesResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var customTemplates = await dbContext.UserNotificationTemplates
            .AsNoTracking()
            .Where(template => template.UserId == userId.Value)
            .ToListAsync(ct);

        var customTemplatesByEvent = customTemplates
            .Where(template => template.StatusType.HasValue)
            .ToDictionary(
                template => (template.Type, template.StatusType!.Value),
                template => template);

        var items = NotificationTemplateCatalog.SupportedTemplates
            .Select(definition =>
            {
                customTemplatesByEvent.TryGetValue(
                    (definition.Type, definition.StatusType),
                    out var customTemplate);

                return new NotificationTemplateData
                {
                    Type = definition.Type.ToString(),
                    StatusType = definition.StatusType.ToString(),
                    Label = definition.Label,
                    DefaultTitle = definition.DefaultTitle,
                    DefaultBody = definition.DefaultBody,
                    TitleTemplate = customTemplate?.TitleTemplate,
                    BodyTemplate = customTemplate?.BodyTemplate,
                    UpdatedAt = customTemplate?.UpdatedAt,
                    IsCustom = customTemplate != null
                };
            })
            .ToList();

        await Send.OkAsync(new ListNotificationTemplatesResponse
        {
            Data = new NotificationTemplatesData
            {
                AllowedPlaceholders = NotificationTemplateRenderer.AllowedPlaceholders,
                Items = items
            }
        }, ct);
    }
}
