using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.Endpoints.Users.NotificationTemplates.ListNotificationTemplates;
using swiftpay_api.EndpointsGroups;
using NotificationTemplateCatalog = swiftpay_api_core.Constants.NotificationTemplates;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Services;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Users.NotificationTemplates.UpsertNotificationTemplate;

public sealed class UpsertNotificationTemplateEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpsertNotificationTemplateRequest, UpsertNotificationTemplateResponse>
{
    public override void Configure()
    {
        Put("notification-templates");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(UpsertNotificationTemplateRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpsertNotificationTemplateResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        if (!NotificationTemplateCatalog.IsSupported(req.Type, req.StatusType))
        {
            await Send.ResponseAsync(new UpsertNotificationTemplateResponse
            {
                Error = new("O evento de notificação informado não permite personalização.")
            }, 400, ct);
            return;
        }

        var titleTemplate = NullIfEmpty(req.TitleTemplate);
        var bodyTemplate = NullIfEmpty(req.BodyTemplate);
        var validationError = ValidateTemplates(titleTemplate, bodyTemplate);
        if (validationError != null)
        {
            await Send.ResponseAsync(new UpsertNotificationTemplateResponse
            {
                Error = new(validationError)
            }, 400, ct);
            return;
        }

        var entity = await dbContext.UserNotificationTemplates
            .Where(template =>
                template.UserId == userId.Value &&
                template.Type == req.Type &&
                template.StatusType == req.StatusType)
            .FirstOrDefaultAsync(ct);

        var now = DateTime.UtcNow;

        if (entity == null)
        {
            entity = new UserNotificationTemplate
            {
                Id = Guid.CreateVersion7(),
                UserId = userId.Value,
                Type = req.Type,
                StatusType = req.StatusType,
                CreatedAt = now
            };
            dbContext.UserNotificationTemplates.Add(entity);
        }

        entity.TitleTemplate = titleTemplate;
        entity.BodyTemplate = bodyTemplate;
        entity.UpdatedAt = now;

        await dbContext.SaveChangesAsync(ct);

        var definition = NotificationTemplateCatalog.SupportedTemplates.Single(template =>
            template.Type == req.Type && template.StatusType == req.StatusType);

        await Send.OkAsync(new UpsertNotificationTemplateResponse
        {
            Data = new NotificationTemplateData
            {
                Type = entity.Type.ToString(),
                StatusType = entity.StatusType!.Value.ToString(),
                Label = definition.Label,
                DefaultTitle = definition.DefaultTitle,
                DefaultBody = definition.DefaultBody,
                TitleTemplate = entity.TitleTemplate,
                BodyTemplate = entity.BodyTemplate,
                UpdatedAt = entity.UpdatedAt,
                IsCustom = true
            }
        }, ct);
    }

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? ValidateTemplates(string? titleTemplate, string? bodyTemplate)
    {
        if (titleTemplate == null && bodyTemplate == null)
        {
            return "Informe um título ou uma mensagem para personalizar o evento.";
        }

        if (titleTemplate?.Length > 80)
        {
            return "O título deve ter no máximo 80 caracteres.";
        }

        if (bodyTemplate?.Length > 240)
        {
            return "A mensagem deve ter no máximo 240 caracteres.";
        }

        try
        {
            if (titleTemplate != null)
            {
                NotificationTemplateRenderer.Validate(titleTemplate);
            }

            if (bodyTemplate != null)
            {
                NotificationTemplateRenderer.Validate(bodyTemplate);
            }
        }
        catch (NotificationTemplateRenderException exception)
        {
            return exception.Message;
        }

        return null;
    }
}
