namespace safefy_api_core.Models.Integrations;

public enum MerchantIntegrationFieldType
{
    Text,
    Password,
    Number,
    Url,
    Email,
}

public sealed class MerchantIntegrationConfigField
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public MerchantIntegrationFieldType Type { get; set; } = MerchantIntegrationFieldType.Text;
    public bool IsRequired { get; set; }
    public string? Placeholder { get; set; }
    public string? Description { get; set; }
}

public sealed class MerchantIntegrationDefinition
{
    public MerchantIntegrationProvider Provider { get; set; }
    public MerchantIntegrationType Type { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    public List<MerchantIntegrationConfigField> ConfigFields { get; set; } = [];
}

public static class MerchantIntegrationCatalog
{
    public static MerchantIntegrationDefinition GetDefinition(MerchantIntegrationProvider provider)
    {
        switch (provider)
        {
            case MerchantIntegrationProvider.Utmify:
                return new MerchantIntegrationDefinition
                {
                    Provider = MerchantIntegrationProvider.Utmify,
                    Type = MerchantIntegrationType.Tracking,
                    Name = "Utmify",
                    Description = "Envia eventos de venda para atribuicao de campanhas.",
                    WebsiteUrl = "https://www.utmify.com.br/",
                    ConfigFields =
                    [
                        new MerchantIntegrationConfigField
                        {
                            Key = "apiToken",
                            Label = "Token da API",
                            Type = MerchantIntegrationFieldType.Password,
                            IsRequired = true,
                            Placeholder = "Cole o x-api-token da integração",
                            Description = "Use o token da API da Utmify para habilitar o envio dos eventos.",
                        }
                    ]
                };

            case MerchantIntegrationProvider.Otimizey:
                return new MerchantIntegrationDefinition
                {
                    Provider = MerchantIntegrationProvider.Otimizey,
                    Type = MerchantIntegrationType.Tracking,
                    Name = "Otimizey",
                    Description = "Envia eventos de compra para atribuicao e otimizacao de campanhas.",
                    WebsiteUrl = "https://otimizey.com.br/",
                    ConfigFields =
                    [
                        new MerchantIntegrationConfigField
                        {
                            Key = "credentialId",
                            Label = "Credential ID",
                            Type = MerchantIntegrationFieldType.Password,
                            IsRequired = true,
                            Placeholder = "Cole o credential ID da integração",
                            Description = "Use o credential ID da Otimizey para habilitar o envio dos eventos.",
                        }
                    ]
                };

            case MerchantIntegrationProvider.FacebookCapi:
                return new MerchantIntegrationDefinition
                {
                    Provider = MerchantIntegrationProvider.FacebookCapi,
                    Type = MerchantIntegrationType.Tracking,
                    Name = "Facebook CAPI",
                    Description = "Envia eventos de conversão do servidor para a Meta Conversions API.",
                    WebsiteUrl = "https://developers.facebook.com/docs/marketing-api/conversions-api/",
                    ConfigFields =
                    [
                        new MerchantIntegrationConfigField
                        {
                            Key = "pixelId",
                            Label = "Pixel ID",
                            Type = MerchantIntegrationFieldType.Text,
                            IsRequired = true,
                            Placeholder = "Informe o Pixel ID",
                            Description = "Identificador do Pixel da Meta para envio de eventos.",
                        },
                        new MerchantIntegrationConfigField
                        {
                            Key = "accessToken",
                            Label = "Access Token",
                            Type = MerchantIntegrationFieldType.Password,
                            IsRequired = true,
                            Placeholder = "Informe o access token",
                            Description = "Token da Conversions API usado para autenticar as requisições.",
                        },
                        new MerchantIntegrationConfigField
                        {
                            Key = "testEventCode",
                            Label = "Test Event Code",
                            Type = MerchantIntegrationFieldType.Text,
                            IsRequired = false,
                            Placeholder = "Opcional para testes",
                            Description = "Código opcional para validar eventos no Events Manager durante homologação.",
                        }
                    ]
                };

            default:
                throw new ArgumentOutOfRangeException(nameof(provider), provider, "Provider de integração não suportado.");
        }
    }

    public static IReadOnlyList<MerchantIntegrationProvider> GetTrackingProviders()
    {
        return
        [
            MerchantIntegrationProvider.Utmify,
            MerchantIntegrationProvider.Otimizey,
            MerchantIntegrationProvider.FacebookCapi,
        ];
    }
}
