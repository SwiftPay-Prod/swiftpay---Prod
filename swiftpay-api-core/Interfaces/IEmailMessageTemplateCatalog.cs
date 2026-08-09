using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Interfaces;

public interface IEmailMessageTemplateCatalog
{
    Task<EmailMessageTemplateDefinition> GetDefinitionAsync(
        EmailMessageType messageType,
        CancellationToken cancellationToken = default);

    BoundEmailMessageTemplate Bind(
        EmailMessageTemplateDefinition definition,
        EmailMessageTemplateValues values);
}
