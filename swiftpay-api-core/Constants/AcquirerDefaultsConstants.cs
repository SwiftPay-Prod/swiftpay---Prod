using safefy_api_core.Models.Database;

namespace safefy_api_core.Constants;

public static class AcquirerDefaultsConstants
{
    private static readonly IReadOnlyDictionary<AcquirerType, AcquirerDefaultMetadata> MetadataByType =
        new Dictionary<AcquirerType, AcquirerDefaultMetadata>
        {
            [AcquirerType.Bankizi] = new()
            {
                Description = "Bankizi - PIX Gateway. Plataforma especializada em solucoes de pagamento PIX.",
                ApiBaseUrlProduction = "https://api.bankizi.com/api",
                ApiBaseUrlSandbox = "https://api-hom.bankizi.com/api",
                DocumentationUrl = "https://documenter.getpostman.com/view/41941457/2sB2cX7LMF",
                WebhookDocumentationUrl = "https://documenter.getpostman.com/view/41941457/2sB2cX7LMF#webhook",
                WebhookAuthMode = WebhookAuthMode.Ip
            },
            [AcquirerType.IHubBanking] = new()
            {
                Description = "IHub Banking - Gateway de pagamentos PIX. Plataforma completa para cash-in e cash-out via PIX.",
                ApiBaseUrlProduction = "https://api.vendasonlinestore.net",
                ApiBaseUrlSandbox = "https://api.vendasonlinestore.net",
                DocumentationUrl = "https://docs.vendasonlinestore.net/",
                WebhookDocumentationUrl = "https://docs.vendasonlinestore.net/docs/webhook-v2",
                WebhookAuthMode = WebhookAuthMode.Token
            },
            [AcquirerType.ActivePayments] = new()
            {
                Description = "ActivePayments - Gateway de pagamentos PIX e Boleto.",
                ApiBaseUrlProduction = "https://api.activepayments.com.br/api/v1",
                ApiBaseUrlSandbox = "https://api.activepayments.com.br/api/v1",
                DocumentationUrl = "https://activepayments.com.br/docs/introduction",
                WebhookDocumentationUrl = "https://activepayments.com.br/docs/webhooks",
                WebhookAuthMode = WebhookAuthMode.HmacSha256
            },
            [AcquirerType.Rapdyn] = new()
            {
                Description = "Rapdyn - Gateway de pagamentos PIX e transferencias PIX.",
                ApiBaseUrlProduction = "https://app.rapdyn.io/api",
                ApiBaseUrlSandbox = "https://app.rapdyn.io/api",
                DocumentationUrl = "https://docs.rapdyn.io/",
                WebhookDocumentationUrl = "https://docs.rapdyn.io/",
                WebhookAuthMode = WebhookAuthMode.None
            },
            [AcquirerType.Coldfy] = new()
            {
                Description = "Coldfy - Gateway de pagamentos PIX, Boleto e saques PIX.",
                ApiBaseUrlProduction = "https://api.coldfypay.com/functions/v1",
                ApiBaseUrlSandbox = "https://api.coldfypay.com/functions/v1",
                DocumentationUrl = "https://coldfy.readme.io/reference",
                WebhookDocumentationUrl = "https://coldfy.readme.io/reference/eventos-e-webhooks",
                WebhookAuthMode = WebhookAuthMode.None
            },
            [AcquirerType.Pluggou] = new()
            {
                Description = "Pluggou - Gateway de pagamentos PIX e saques PIX.",
                ApiBaseUrlProduction = "https://api.pluggoutech.com/api",
                ApiBaseUrlSandbox = "https://api.pluggoutech.com/api",
                DocumentationUrl = "https://docs.pluggoucash.com/api-reference/transactions/guide",
                WebhookDocumentationUrl = "https://docs.pluggoucash.com/api-reference/webhooks",
                WebhookAuthMode = WebhookAuthMode.Token
            },
            [AcquirerType.HunterPay] = new()
            {
                Description = "HunterPay - Gateway no contrato HunterSub para pagamentos PIX e saques com autenticacao Basic Auth.",
                ApiBaseUrlProduction = "https://api.huntersub.com.br/functions/v1",
                ApiBaseUrlSandbox = "https://api.huntersub.com.br/functions/v1",
                DocumentationUrl = "https://hunter-sub.readme.io/",
                WebhookDocumentationUrl = "https://hunter-sub.readme.io/",
                WebhookAuthMode = WebhookAuthMode.None
            },
            [AcquirerType.HeartPay] = new()
            {
                Description = "HeartPay - Gateway de pagamentos PIX, boleto e saques PIX com autenticacao Bearer.",
                ApiBaseUrlProduction = "https://app.heartpag.com/api",
                ApiBaseUrlSandbox = "https://app.heartpag.com/api",
                DocumentationUrl = "https://painel.heartpay.com.br/api-docs-swagger.json",
                WebhookDocumentationUrl = "https://painel.heartpay.com.br/api-docs-swagger.json",
                WebhookAuthMode = WebhookAuthMode.HmacSha256
            },
            [AcquirerType.Accithus] = new()
            {
                Description = "Accithus - Instituicao de Pagamento (IP) com suporte a PIX, Boleto e Cartao de Credito. Requer onboarding de submerchant.",
                ApiBaseUrlProduction = "https://api.accithus.com/v1",
                ApiBaseUrlSandbox = "https://api.accithus.com/v1",
                DocumentationUrl = "https://docs.accithus.com",
                WebhookDocumentationUrl = "https://docs.accithus.com/webhooks",
                WebhookAuthMode = WebhookAuthMode.HmacSha256
            }
        };

    public static AcquirerDefaultMetadata GetMetadata(AcquirerType type)
        => MetadataByType.GetValueOrDefault(type) ?? AcquirerDefaultMetadata.Empty;
}

public sealed class AcquirerDefaultMetadata
{
    public static AcquirerDefaultMetadata Empty { get; } = new()
    {
        WebhookAuthMode = WebhookAuthMode.Token
    };

    public string? Description { get; init; }
    public string? ApiBaseUrlProduction { get; init; }
    public string? ApiBaseUrlSandbox { get; init; }
    public string? DocumentationUrl { get; init; }
    public string? WebhookDocumentationUrl { get; init; }
    public WebhookAuthMode WebhookAuthMode { get; init; }
}