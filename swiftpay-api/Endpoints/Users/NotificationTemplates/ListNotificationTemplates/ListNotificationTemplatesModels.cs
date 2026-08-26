using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.NotificationTemplates.ListNotificationTemplates;

public sealed class ListNotificationTemplatesResponse : BaseResponse<NotificationTemplatesData>;

public sealed class NotificationTemplatesData
{
    public IReadOnlyList<string> AllowedPlaceholders { get; set; } = [];
    public IReadOnlyList<NotificationTemplateData> Items { get; set; } = [];
}

public sealed class NotificationTemplateData
{
    public string Type { get; set; } = null!;
    public string StatusType { get; set; } = null!;
    public string Label { get; set; } = null!;
    public string DefaultTitle { get; set; } = null!;
    public string DefaultBody { get; set; } = null!;
    public string? TitleTemplate { get; set; }
    public string? BodyTemplate { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsCustom { get; set; }
}
