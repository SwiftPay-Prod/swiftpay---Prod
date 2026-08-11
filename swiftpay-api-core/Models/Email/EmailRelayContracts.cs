namespace swiftpay_api_core.Models.Email;

public sealed record EmailAuthActionLinkRequest
{
    public required EmailAuthActionType ActionType { get; init; }
    public required string RecipientAddress { get; init; }
    public required string ContinueUrl { get; init; }
    public string? RawToken { get; init; }
}

public sealed record EmailMessageTemplateDefinition
{
    public required EmailMessageType MessageType { get; init; }
    public required EmailTemplateSource Template { get; init; }
    public required TimeSpan SendWithin { get; init; }
    public required IReadOnlyDictionary<string, string> InputKeyByPlaceholder { get; init; }
}

public sealed record EmailMessageTemplateValues
{
    public IReadOnlyDictionary<string, string> Inputs { get; init; } =
        new Dictionary<string, string>(StringComparer.Ordinal);
    public string? AuthActionLink { get; init; }
    public string? CustomSubject { get; init; }
    public TrustedEmailHtmlValue? CustomBody { get; init; }
}

public sealed record BoundEmailMessageTemplate
{
    public required EmailMessageTemplateDefinition Definition { get; init; }
    public required IReadOnlyList<EmailTemplateParameter> Parameters { get; init; }
}
