using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Template de email configurável pelo merchant com editor de blocos
/// </summary>
public class MerchantEmailTemplate : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid MerchantId { get; set; }

    /// <summary>
    /// Tipo do template de email
    /// </summary>
    public MerchantEmailTemplateType Type { get; set; }

    /// <summary>
    /// Ambiente (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; }

    /// <summary>
    /// Nome customizado do template (para identificação)
    /// </summary>
    [MaxLength(100)]
    public string Name { get; set; } = "Template padrão";

    /// <summary>
    /// Se o envio de email está habilitado
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Assunto do email (suporta variáveis: [[customer_name]], [[order_number]], etc)
    /// </summary>
    [MaxLength(200)]
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// Blocos de conteúdo do email (JSONB) - Novo sistema WYSIWYG
    /// </summary>
    [Column(TypeName = "jsonb")]
    public List<EmailBlock> Blocks { get; set; } = [];

    /// <summary>
    /// Cor primária do email (hex) - usada como padrão nos blocos
    /// </summary>
    [MaxLength(7)]
    public string PrimaryColor { get; set; } = "#6366F1";

    /// <summary>
    /// Cor de fundo do email (hex)
    /// </summary>
    [MaxLength(7)]
    public string BackgroundColor { get; set; } = "#F3F4F6";

    /// <summary>
    /// Cor de fundo do container do email (hex)
    /// </summary>
    [MaxLength(7)]
    public string ContainerBackgroundColor { get; set; } = "#FFFFFF";

    /// <summary>
    /// Modo de cor do texto ('dark' ou 'light')
    /// </summary>
    [MaxLength(10)]
    public string TextColorMode { get; set; } = "dark";

    /// <summary>
    /// Se este é o template padrão para o tipo
    /// </summary>
    public bool IsDefault { get; set; } = true;

    // Navegação
    public virtual Merchant Merchant { get; set; } = null!;

    /// <summary>
    /// Retorna os blocos padrão para um tipo específico de template
    /// </summary>
    public static List<EmailBlock> GetDefaultBlocks(MerchantEmailTemplateType type)
    {
        var blocks = new List<EmailBlock>
        {
            // Header com logo
            new()
            {
                Type = EmailBlockType.Header,
                Content = "[[merchant_name]]",
                Settings = new EmailBlockSettings
                {
                    ImageUrl = "[[merchant_logo]]",
                    TextAlign = EmailTextAlignment.Center
                }
            },
            // Saudação
            new()
            {
                Type = EmailBlockType.Text,
                Content = "Olá, [[customer_name]]!",
                Settings = new EmailBlockSettings
                {
                    FontSize = 20,
                    Bold = true,
                    TextAlign = EmailTextAlignment.Left,
                    MarginBottom = 16
                }
            }
        };

        // Adiciona blocos específicos por tipo
        switch (type)
        {
            case MerchantEmailTemplateType.PaymentConfirmation:
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.Text,
                    Content = "Seu pagamento foi confirmado! Pedido #[[order_number]]",
                    Settings = new EmailBlockSettings { FontSize = 16, MarginBottom = 24 }
                });
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.ProductList,
                    Settings = new EmailBlockSettings
                    {
                        ShowProductImages = true,
                        ShowPrices = true,
                        ShowQuantity = true
                    }
                });
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.OrderSummary
                });
                break;

            case MerchantEmailTemplateType.DigitalDelivery:
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.Text,
                    Content = "Seus itens digitais estão prontos! 🎉",
                    Settings = new EmailBlockSettings { FontSize = 16, MarginBottom = 24 }
                });
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.DigitalItemsList,
                    Settings = new EmailBlockSettings
                    {
                        ShowProductImages = true,
                        BackgroundColor = "#F9FAFB",
                        Padding = 16
                    }
                });
                break;

            case MerchantEmailTemplateType.OrderShipped:
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.Text,
                    Content = "Ótimas notícias! Seu pedido #[[order_number]] foi enviado.",
                    Settings = new EmailBlockSettings { FontSize = 16, MarginBottom = 24 }
                });
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.TrackingInfo
                });
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.Button,
                    Content = "Rastrear Pedido",
                    Settings = new EmailBlockSettings
                    {
                        ButtonUrl = "[[tracking_url]]",
                        ButtonBackgroundColor = "#6366F1",
                        ButtonTextColor = "#FFFFFF",
                        ButtonBorderRadius = 8,
                        TextAlign = EmailTextAlignment.Center
                    }
                });
                break;

            case MerchantEmailTemplateType.OrderDelivered:
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.Text,
                    Content = "Seu pedido #[[order_number]] foi entregue em [[delivery_date]]! 🎉",
                    Settings = new EmailBlockSettings { FontSize = 16, MarginBottom = 24 }
                });
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.ProductList,
                    Settings = new EmailBlockSettings { ShowProductImages = true, ShowPrices = false }
                });
                break;

            case MerchantEmailTemplateType.Welcome:
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.Text,
                    Content = "Seja bem-vindo(a) à nossa loja! Estamos muito felizes em ter você conosco.",
                    Settings = new EmailBlockSettings { FontSize = 16, MarginBottom = 24 }
                });
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.Text,
                    Content = "Explore nossos produtos e aproveite ofertas exclusivas para novos clientes.",
                    Settings = new EmailBlockSettings { FontSize = 14, MarginBottom = 24 }
                });
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.Button,
                    Content = "Explorar Produtos",
                    Settings = new EmailBlockSettings
                    {
                        ButtonUrl = "[[store_url]]",
                        ButtonBackgroundColor = "#6366F1",
                        ButtonTextColor = "#FFFFFF",
                        ButtonBorderRadius = 8,
                        TextAlign = EmailTextAlignment.Center
                    }
                });
                break;

            case MerchantEmailTemplateType.AbandonedCart:
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.Text,
                    Content = "Você esqueceu alguns itens no seu carrinho! 🛒",
                    Settings = new EmailBlockSettings { FontSize = 16, MarginBottom = 24 }
                });
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.ProductList,
                    Settings = new EmailBlockSettings { ShowProductImages = true, ShowPrices = true }
                });
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.Text,
                    Content = "Complete sua compra antes que os itens acabem!",
                    Settings = new EmailBlockSettings { FontSize = 14, MarginBottom = 24 }
                });
                blocks.Add(new EmailBlock
                {
                    Type = EmailBlockType.Button,
                    Content = "Finalizar Compra",
                    Settings = new EmailBlockSettings
                    {
                        ButtonUrl = "[[checkout_url]]",
                        ButtonBackgroundColor = "#6366F1",
                        ButtonTextColor = "#FFFFFF",
                        ButtonBorderRadius = 8,
                        TextAlign = EmailTextAlignment.Center
                    }
                });
                break;
        }

        // Rodapé comum
        blocks.Add(new EmailBlock
        {
            Type = EmailBlockType.Spacer,
            Settings = new EmailBlockSettings { SpacerHeight = 32 }
        });
        blocks.Add(new EmailBlock
        {
            Type = EmailBlockType.Divider,
            Settings = new EmailBlockSettings { DividerColor = "#E5E7EB", DividerThickness = 1 }
        });
        blocks.Add(new EmailBlock
        {
            Type = EmailBlockType.Footer,
            Content = "Obrigado por comprar conosco!\n\nEste email foi enviado automaticamente por [[merchant_name]].",
            Settings = new EmailBlockSettings
            {
                FontSize = 12,
                TextColor = "#6B7280",
                TextAlign = EmailTextAlignment.Center,
                MarginTop = 16
            }
        });

        return blocks;
    }

    /// <summary>
    /// Retorna o assunto padrão para um tipo de template
    /// </summary>
    public static string GetDefaultSubject(MerchantEmailTemplateType type)
    {
        return type switch
        {
            MerchantEmailTemplateType.PaymentConfirmation => "Pagamento confirmado! Pedido #[[order_number]] ✅",
            MerchantEmailTemplateType.DigitalDelivery => "Seus itens digitais chegaram! 🎉",
            MerchantEmailTemplateType.OrderShipped => "Seu pedido #[[order_number]] foi enviado! 📦",
            MerchantEmailTemplateType.OrderDelivered => "Pedido #[[order_number]] entregue! 🎉",
            MerchantEmailTemplateType.Welcome => "Bem-vindo(a) à [[merchant_name]]! 🎉",
            MerchantEmailTemplateType.AbandonedCart => "Você esqueceu alguns itens no carrinho 🛒",
            _ => "Atualização do seu pedido"
        };
    }

    /// <summary>
    /// Retorna o nome padrão para um tipo de template
    /// </summary>
    public static string GetDefaultName(MerchantEmailTemplateType type)
    {
        return type switch
        {
            MerchantEmailTemplateType.PaymentConfirmation => "Confirmação de Pagamento",
            MerchantEmailTemplateType.DigitalDelivery => "Entrega Digital",
            MerchantEmailTemplateType.OrderShipped => "Pedido Enviado",
            MerchantEmailTemplateType.OrderDelivered => "Pedido Entregue",
            MerchantEmailTemplateType.Welcome => "Boas-vindas",
            MerchantEmailTemplateType.AbandonedCart => "Carrinho Abandonado",
            _ => "Template de Email"
        };
    }

    /// <summary>
    /// Cria um template padrão para um tipo específico
    /// </summary>
    public static MerchantEmailTemplate CreateDefault(Guid merchantId, MerchantEmailTemplateType type, ApiEnvironment environment)
    {
        return new MerchantEmailTemplate
        {
            MerchantId = merchantId,
            Type = type,
            Environment = environment,
            Name = GetDefaultName(type),
            Subject = GetDefaultSubject(type),
            Blocks = GetDefaultBlocks(type),
            IsDefault = true
        };
    }
}
