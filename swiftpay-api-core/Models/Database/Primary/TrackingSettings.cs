using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Tipos de eventos de tracking do checkout.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CheckoutTrackingEvent
{
    /// <summary>
    /// Entrou na página do checkout
    /// </summary>
    PageEntered,
    
    /// <summary>
    /// Carregou o conteúdo da página (produtos, preços)
    /// </summary>
    ContentLoaded,
    
    /// <summary>
    /// Iniciou o checkout (começou a preencher qualquer informação)
    /// </summary>
    InitiateCheckout,
    
    /// <summary>
    /// Adicionou informações de pagamento (selecionou método, preencheu dados)
    /// </summary>
    AddPaymentInfo,
    
    /// <summary>
    /// Clicou no botão de confirmar compra / gerar PIX / cobrar do cartão
    /// </summary>
    ClickedPurchase,
    
    /// <summary>
    /// Realizou o pagamento / cobrança do cartão com sucesso
    /// </summary>
    PurchaseCompleted
}

/// <summary>
/// Configurações de tracking para o checkout.
/// Armazenado como JSONB no CheckoutConfig.
/// </summary>
public class TrackingSettings
{
    /// <summary>
    /// Microsoft Clarity
    /// </summary>
    public ClarityTrackingConfig? Clarity { get; set; }
    
    /// <summary>
    /// Facebook Pixel com suporte a API de Conversões (CAPI)
    /// </summary>
    public FacebookPixelTrackingConfig? FacebookPixel { get; set; }
    
    /// <summary>
    /// Google Tag Manager
    /// </summary>
    public GoogleTagManagerTrackingConfig? GoogleTagManager { get; set; }
    
    /// <summary>
    /// TikTok Pixel
    /// </summary>
    public TikTokTrackingConfig? TikTok { get; set; }
    
    /// <summary>
    /// Kwai Pixel
    /// </summary>
    public KwaiTrackingConfig? Kwai { get; set; }
    
    /// <summary>
    /// Pinterest Tag
    /// </summary>
    public PinterestTrackingConfig? Pinterest { get; set; }
    
    /// <summary>
    /// Taboola Pixel
    /// </summary>
    public TaboolaTrackingConfig? Taboola { get; set; }
    
    /// <summary>
    /// Utmify
    /// </summary>
    public UtmifyTrackingConfig? Utmify { get; set; }
    
    /// <summary>
    /// Otimizey
    /// </summary>
    public OtimizeyTrackingConfig? Otimizey { get; set; }
}

/// <summary>
/// Descrição de um evento de tracking para uma plataforma específica.
/// </summary>
public class TrackingEventInfo
{
    /// <summary>
    /// Tipo do evento
    /// </summary>
    public CheckoutTrackingEvent Event { get; set; }
    
    /// <summary>
    /// Nome do evento na plataforma (ex: "PageView", "page_view", etc)
    /// </summary>
    public string PlatformEventName { get; set; } = string.Empty;
    
    /// <summary>
    /// Descrição do evento
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Se o evento está habilitado
    /// </summary>
    public bool Enabled { get; set; } = true;
}

/// <summary>
/// Configuração base de tracking
/// </summary>
public abstract class BaseTrackingConfig
{
    /// <summary>
    /// Se o tracking está habilitado
    /// </summary>
    public bool Enabled { get; set; } = false;
}

/// <summary>
/// Microsoft Clarity - Mapeamento de calor e gravação de sessões
/// Não suporta eventos de conversão, apenas rastreamento de sessão.
/// </summary>
public class ClarityTrackingConfig : BaseTrackingConfig
{
    /// <summary>
    /// ID do projeto Clarity
    /// </summary>
    public string? ProjectId { get; set; }
}

/// <summary>
/// Facebook Pixel com API de Conversões (CAPI)
/// </summary>
public class FacebookPixelTrackingConfig : BaseTrackingConfig
{
    /// <summary>
    /// ID do Pixel do Facebook
    /// </summary>
    public string? PixelId { get; set; }
    
    /// <summary>
    /// Token de acesso para API de Conversões (CAPI)
    /// Deixar vazio para usar apenas o Pixel frontend
    /// </summary>
    public string? AccessToken { get; set; }
    
    /// <summary>
    /// Código de teste para eventos da API de Conversões
    /// Usado apenas em ambiente de desenvolvimento/teste
    /// </summary>
    public string? TestEventCode { get; set; }
    
    /// <summary>
    /// Habilitar deduplicação de eventos (recomendado quando usando Pixel + CAPI)
    /// </summary>
    public bool EnableDeduplication { get; set; } = true;
    
    /// <summary>
    /// Configuração de eventos habilitados.
    /// Mapeamento de eventos para o Facebook Pixel:
    /// - PageEntered: PageView
    /// - ContentLoaded: ViewContent
    /// - InitiateCheckout: InitiateCheckout
    /// - AddPaymentInfo: AddPaymentInfo
    /// - ClickedPurchase: Lead (ou AddPaymentInfo duplicado)
    /// - PurchaseCompleted: Purchase
    /// </summary>
    public FacebookPixelEventSettings? Events { get; set; }
}

/// <summary>
/// Configurações de eventos do Facebook Pixel
/// </summary>
[Owned]
public class FacebookPixelEventSettings
{
    /// <summary>
    /// PageView - Disparado ao entrar na página
    /// </summary>
    public bool PageEntered { get; set; } = true;
    
    /// <summary>
    /// ViewContent - Disparado ao carregar o conteúdo da página
    /// </summary>
    public bool ContentLoaded { get; set; } = true;
    
    /// <summary>
    /// InitiateCheckout - Disparado ao iniciar o checkout
    /// </summary>
    public bool InitiateCheckout { get; set; } = true;
    
    /// <summary>
    /// AddPaymentInfo - Disparado ao adicionar informações de pagamento
    /// </summary>
    public bool AddPaymentInfo { get; set; } = true;
    
    /// <summary>
    /// Lead - Disparado ao clicar no botão de compra
    /// </summary>
    public bool ClickedPurchase { get; set; } = true;
    
    /// <summary>
    /// Purchase - Disparado ao completar o pagamento
    /// </summary>
    public bool PurchaseCompleted { get; set; } = true;
}

/// <summary>
/// Google Tag Manager
/// </summary>
public class GoogleTagManagerTrackingConfig : BaseTrackingConfig
{
    /// <summary>
    /// ID do container GTM (formato: GTM-XXXXXXX)
    /// </summary>
    public string? ContainerId { get; set; }
    
    /// <summary>
    /// Configuração de eventos habilitados.
    /// Mapeamento de eventos para o Google Analytics 4:
    /// - PageEntered: page_view
    /// - ContentLoaded: view_item
    /// - InitiateCheckout: begin_checkout
    /// - AddPaymentInfo: add_payment_info
    /// - ClickedPurchase: add_payment_info (com parâmetro adicional)
    /// - PurchaseCompleted: purchase
    /// </summary>
    public GoogleTagManagerEventSettings? Events { get; set; }
}

/// <summary>
/// Configurações de eventos do Google Tag Manager / GA4
/// </summary>
[Owned]
public class GoogleTagManagerEventSettings
{
    /// <summary>
    /// page_view - Disparado ao entrar na página
    /// </summary>
    public bool PageEntered { get; set; } = true;
    
    /// <summary>
    /// view_item - Disparado ao carregar o conteúdo da página
    /// </summary>
    public bool ContentLoaded { get; set; } = true;
    
    /// <summary>
    /// begin_checkout - Disparado ao iniciar o checkout
    /// </summary>
    public bool InitiateCheckout { get; set; } = true;
    
    /// <summary>
    /// add_payment_info - Disparado ao adicionar informações de pagamento
    /// </summary>
    public bool AddPaymentInfo { get; set; } = true;
    
    /// <summary>
    /// checkout_progress - Disparado ao clicar no botão de compra
    /// </summary>
    public bool ClickedPurchase { get; set; } = true;
    
    /// <summary>
    /// purchase - Disparado ao completar o pagamento
    /// </summary>
    public bool PurchaseCompleted { get; set; } = true;
}

/// <summary>
/// TikTok Pixel
/// </summary>
public class TikTokTrackingConfig : BaseTrackingConfig
{
    /// <summary>
    /// ID do Pixel TikTok
    /// </summary>
    public string? PixelId { get; set; }
    
    /// <summary>
    /// Token de acesso para Events API do TikTok
    /// </summary>
    public string? AccessToken { get; set; }
    
    /// <summary>
    /// Configuração de eventos habilitados.
    /// Mapeamento de eventos para o TikTok Pixel:
    /// - PageEntered: PageView
    /// - ContentLoaded: ViewContent
    /// - InitiateCheckout: InitiateCheckout
    /// - AddPaymentInfo: AddPaymentInfo
    /// - ClickedPurchase: PlaceAnOrder
    /// - PurchaseCompleted: CompletePayment
    /// </summary>
    public TikTokEventSettings? Events { get; set; }
}

/// <summary>
/// Configurações de eventos do TikTok Pixel
/// </summary>
[Owned]
public class TikTokEventSettings
{
    /// <summary>
    /// PageView - Disparado ao entrar na página
    /// </summary>
    public bool PageEntered { get; set; } = true;
    
    /// <summary>
    /// ViewContent - Disparado ao carregar o conteúdo da página
    /// </summary>
    public bool ContentLoaded { get; set; } = true;
    
    /// <summary>
    /// InitiateCheckout - Disparado ao iniciar o checkout
    /// </summary>
    public bool InitiateCheckout { get; set; } = true;
    
    /// <summary>
    /// AddPaymentInfo - Disparado ao adicionar informações de pagamento
    /// </summary>
    public bool AddPaymentInfo { get; set; } = true;
    
    /// <summary>
    /// PlaceAnOrder - Disparado ao clicar no botão de compra
    /// </summary>
    public bool ClickedPurchase { get; set; } = true;
    
    /// <summary>
    /// CompletePayment - Disparado ao completar o pagamento
    /// </summary>
    public bool PurchaseCompleted { get; set; } = true;
}

/// <summary>
/// Kwai Pixel
/// </summary>
public class KwaiTrackingConfig : BaseTrackingConfig
{
    /// <summary>
    /// ID do Pixel Kwai
    /// </summary>
    public string? PixelId { get; set; }
    
    /// <summary>
    /// Configuração de eventos habilitados.
    /// Mapeamento de eventos para o Kwai Pixel:
    /// - PageEntered: pageview
    /// - ContentLoaded: viewcontent
    /// - InitiateCheckout: begincheckout
    /// - AddPaymentInfo: addpaymentinfo
    /// - ClickedPurchase: submitorder
    /// - PurchaseCompleted: purchase
    /// </summary>
    public KwaiEventSettings? Events { get; set; }
}

/// <summary>
/// Configurações de eventos do Kwai Pixel
/// </summary>
[Owned]
public class KwaiEventSettings
{
    /// <summary>
    /// pageview - Disparado ao entrar na página
    /// </summary>
    public bool PageEntered { get; set; } = true;
    
    /// <summary>
    /// viewcontent - Disparado ao carregar o conteúdo da página
    /// </summary>
    public bool ContentLoaded { get; set; } = true;
    
    /// <summary>
    /// begincheckout - Disparado ao iniciar o checkout
    /// </summary>
    public bool InitiateCheckout { get; set; } = true;
    
    /// <summary>
    /// addpaymentinfo - Disparado ao adicionar informações de pagamento
    /// </summary>
    public bool AddPaymentInfo { get; set; } = true;
    
    /// <summary>
    /// submitorder - Disparado ao clicar no botão de compra
    /// </summary>
    public bool ClickedPurchase { get; set; } = true;
    
    /// <summary>
    /// purchase - Disparado ao completar o pagamento
    /// </summary>
    public bool PurchaseCompleted { get; set; } = true;
}

/// <summary>
/// Pinterest Tag
/// </summary>
public class PinterestTrackingConfig : BaseTrackingConfig
{
    /// <summary>
    /// ID do Tag Pinterest
    /// </summary>
    public string? TagId { get; set; }
    
    /// <summary>
    /// Configuração de eventos habilitados.
    /// Mapeamento de eventos para o Pinterest Tag:
    /// - PageEntered: pagevisit
    /// - ContentLoaded: viewcategory
    /// - InitiateCheckout: addtocart
    /// - AddPaymentInfo: addtocart
    /// - ClickedPurchase: lead
    /// - PurchaseCompleted: checkout
    /// </summary>
    public PinterestEventSettings? Events { get; set; }
}

/// <summary>
/// Configurações de eventos do Pinterest Tag
/// </summary>
[Owned]
public class PinterestEventSettings
{
    /// <summary>
    /// pagevisit - Disparado ao entrar na página
    /// </summary>
    public bool PageEntered { get; set; } = true;
    
    /// <summary>
    /// viewcategory - Disparado ao carregar o conteúdo da página
    /// </summary>
    public bool ContentLoaded { get; set; } = true;
    
    /// <summary>
    /// addtocart - Disparado ao iniciar o checkout
    /// </summary>
    public bool InitiateCheckout { get; set; } = true;
    
    /// <summary>
    /// addtocart - Disparado ao adicionar informações de pagamento
    /// </summary>
    public bool AddPaymentInfo { get; set; } = true;
    
    /// <summary>
    /// lead - Disparado ao clicar no botão de compra
    /// </summary>
    public bool ClickedPurchase { get; set; } = true;
    
    /// <summary>
    /// checkout - Disparado ao completar o pagamento
    /// </summary>
    public bool PurchaseCompleted { get; set; } = true;
}

/// <summary>
/// Taboola Pixel
/// </summary>
public class TaboolaTrackingConfig : BaseTrackingConfig
{
    /// <summary>
    /// ID da conta Taboola
    /// </summary>
    public string? AccountId { get; set; }
    
    /// <summary>
    /// Configuração de eventos habilitados.
    /// Mapeamento de eventos para o Taboola Pixel:
    /// - PageEntered: page_view
    /// - ContentLoaded: view_content
    /// - InitiateCheckout: checkout_start
    /// - AddPaymentInfo: lead
    /// - ClickedPurchase: checkout_start (com parâmetro adicional)
    /// - PurchaseCompleted: purchase
    /// </summary>
    public TaboolaEventSettings? Events { get; set; }
}

/// <summary>
/// Configurações de eventos do Taboola Pixel
/// </summary>
[Owned]
public class TaboolaEventSettings
{
    /// <summary>
    /// page_view - Disparado ao entrar na página
    /// </summary>
    public bool PageEntered { get; set; } = true;
    
    /// <summary>
    /// view_content - Disparado ao carregar o conteúdo da página
    /// </summary>
    public bool ContentLoaded { get; set; } = true;
    
    /// <summary>
    /// checkout_start - Disparado ao iniciar o checkout
    /// </summary>
    public bool InitiateCheckout { get; set; } = true;
    
    /// <summary>
    /// lead - Disparado ao adicionar informações de pagamento
    /// </summary>
    public bool AddPaymentInfo { get; set; } = true;
    
    /// <summary>
    /// checkout_progress - Disparado ao clicar no botão de compra
    /// </summary>
    public bool ClickedPurchase { get; set; } = true;
    
    /// <summary>
    /// purchase - Disparado ao completar o pagamento
    /// </summary>
    public bool PurchaseCompleted { get; set; } = true;
}

/// <summary>
/// Utmify - Plataforma de atribuição
/// </summary>
public class UtmifyTrackingConfig : BaseTrackingConfig
{
    /// <summary>
    /// ID do Pixel Utmify
    /// </summary>
    public string? PixelId { get; set; }
    
    /// <summary>
    /// Configuração de eventos habilitados.
    /// Mapeamento de eventos para o Utmify:
    /// - PageEntered: page_view
    /// - ContentLoaded: view_content
    /// - InitiateCheckout: initiate_checkout
    /// - AddPaymentInfo: add_payment_info
    /// - ClickedPurchase: clicked_purchase
    /// - PurchaseCompleted: purchase
    /// </summary>
    public UtmifyEventSettings? Events { get; set; }
}

/// <summary>
/// Configurações de eventos do Utmify
/// </summary>
[Owned]
public class UtmifyEventSettings
{
    /// <summary>
    /// page_view - Disparado ao entrar na página
    /// </summary>
    public bool PageEntered { get; set; } = true;
    
    /// <summary>
    /// view_content - Disparado ao carregar o conteúdo da página
    /// </summary>
    public bool ContentLoaded { get; set; } = true;
    
    /// <summary>
    /// initiate_checkout - Disparado ao iniciar o checkout
    /// </summary>
    public bool InitiateCheckout { get; set; } = true;
    
    /// <summary>
    /// add_payment_info - Disparado ao adicionar informações de pagamento
    /// </summary>
    public bool AddPaymentInfo { get; set; } = true;
    
    /// <summary>
    /// clicked_purchase - Disparado ao clicar no botão de compra
    /// </summary>
    public bool ClickedPurchase { get; set; } = true;
    
    /// <summary>
    /// purchase - Disparado ao completar o pagamento
    /// </summary>
    public bool PurchaseCompleted { get; set; } = true;
}

/// <summary>
/// Otimizey - Plataforma de otimização
/// </summary>
public class OtimizeyTrackingConfig : BaseTrackingConfig
{
    /// <summary>
    /// ID do Pixel Otimizey
    /// </summary>
    public string? PixelId { get; set; }
    
    /// <summary>
    /// Configuração de eventos habilitados.
    /// Mapeamento de eventos para o Otimizey:
    /// - PageEntered: page_view
    /// - ContentLoaded: view_content
    /// - InitiateCheckout: initiate_checkout
    /// - AddPaymentInfo: add_payment_info
    /// - ClickedPurchase: clicked_purchase
    /// - PurchaseCompleted: purchase
    /// </summary>
    public OtimizeyEventSettings? Events { get; set; }
}

/// <summary>
/// Configurações de eventos do Otimizey
/// </summary>
[Owned]
public class OtimizeyEventSettings
{
    /// <summary>
    /// page_view - Disparado ao entrar na página
    /// </summary>
    public bool PageEntered { get; set; } = true;
    
    /// <summary>
    /// view_content - Disparado ao carregar o conteúdo da página
    /// </summary>
    public bool ContentLoaded { get; set; } = true;
    
    /// <summary>
    /// initiate_checkout - Disparado ao iniciar o checkout
    /// </summary>
    public bool InitiateCheckout { get; set; } = true;
    
    /// <summary>
    /// add_payment_info - Disparado ao adicionar informações de pagamento
    /// </summary>
    public bool AddPaymentInfo { get; set; } = true;
    
    /// <summary>
    /// clicked_purchase - Disparado ao clicar no botão de compra
    /// </summary>
    public bool ClickedPurchase { get; set; } = true;
    
    /// <summary>
    /// purchase - Disparado ao completar o pagamento
    /// </summary>
    public bool PurchaseCompleted { get; set; } = true;
}

/// <summary>
/// Enum dos tipos de tracking suportados
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TrackingType
{
    Clarity,
    FacebookPixel,
    GoogleTagManager,
    TikTok,
    Kwai,
    Pinterest,
    Taboola,
    Utmify,
    Otimizey
}

/// <summary>
/// Informações de eventos de tracking para exibição na UI
/// </summary>
public static class TrackingEventDescriptions
{
    /// <summary>
    /// Descrições gerais dos eventos (independente da plataforma)
    /// </summary>
    public static readonly Dictionary<CheckoutTrackingEvent, string> EventDescriptions = new()
    {
        { CheckoutTrackingEvent.PageEntered, "Disparado quando o usuário entra na página do checkout" },
        { CheckoutTrackingEvent.ContentLoaded, "Disparado quando o conteúdo da página (produtos, preços) é carregado" },
        { CheckoutTrackingEvent.InitiateCheckout, "Disparado quando o usuário começa a preencher qualquer informação no checkout" },
        { CheckoutTrackingEvent.AddPaymentInfo, "Disparado quando o usuário adiciona informações de pagamento (seleciona método, preenche dados)" },
        { CheckoutTrackingEvent.ClickedPurchase, "Disparado quando o usuário clica no botão de confirmar compra / gerar PIX / cobrar cartão" },
        { CheckoutTrackingEvent.PurchaseCompleted, "Disparado quando o pagamento é confirmado ou a cobrança do cartão é realizada com sucesso" }
    };

    /// <summary>
    /// Mapeamento de eventos para o Facebook Pixel
    /// </summary>
    public static readonly Dictionary<CheckoutTrackingEvent, string> FacebookPixelEvents = new()
    {
        { CheckoutTrackingEvent.PageEntered, "PageView" },
        { CheckoutTrackingEvent.ContentLoaded, "ViewContent" },
        { CheckoutTrackingEvent.InitiateCheckout, "InitiateCheckout" },
        { CheckoutTrackingEvent.AddPaymentInfo, "AddPaymentInfo" },
        { CheckoutTrackingEvent.ClickedPurchase, "Lead" },
        { CheckoutTrackingEvent.PurchaseCompleted, "Purchase" }
    };

    /// <summary>
    /// Mapeamento de eventos para o Google Analytics 4 / GTM
    /// </summary>
    public static readonly Dictionary<CheckoutTrackingEvent, string> GoogleAnalyticsEvents = new()
    {
        { CheckoutTrackingEvent.PageEntered, "page_view" },
        { CheckoutTrackingEvent.ContentLoaded, "view_item" },
        { CheckoutTrackingEvent.InitiateCheckout, "begin_checkout" },
        { CheckoutTrackingEvent.AddPaymentInfo, "add_payment_info" },
        { CheckoutTrackingEvent.ClickedPurchase, "checkout_progress" },
        { CheckoutTrackingEvent.PurchaseCompleted, "purchase" }
    };

    /// <summary>
    /// Mapeamento de eventos para o TikTok Pixel
    /// </summary>
    public static readonly Dictionary<CheckoutTrackingEvent, string> TikTokEvents = new()
    {
        { CheckoutTrackingEvent.PageEntered, "PageView" },
        { CheckoutTrackingEvent.ContentLoaded, "ViewContent" },
        { CheckoutTrackingEvent.InitiateCheckout, "InitiateCheckout" },
        { CheckoutTrackingEvent.AddPaymentInfo, "AddPaymentInfo" },
        { CheckoutTrackingEvent.ClickedPurchase, "PlaceAnOrder" },
        { CheckoutTrackingEvent.PurchaseCompleted, "CompletePayment" }
    };

    /// <summary>
    /// Mapeamento de eventos para o Kwai Pixel
    /// </summary>
    public static readonly Dictionary<CheckoutTrackingEvent, string> KwaiEvents = new()
    {
        { CheckoutTrackingEvent.PageEntered, "pageview" },
        { CheckoutTrackingEvent.ContentLoaded, "viewcontent" },
        { CheckoutTrackingEvent.InitiateCheckout, "begincheckout" },
        { CheckoutTrackingEvent.AddPaymentInfo, "addpaymentinfo" },
        { CheckoutTrackingEvent.ClickedPurchase, "submitorder" },
        { CheckoutTrackingEvent.PurchaseCompleted, "purchase" }
    };

    /// <summary>
    /// Mapeamento de eventos para o Pinterest Tag
    /// </summary>
    public static readonly Dictionary<CheckoutTrackingEvent, string> PinterestEvents = new()
    {
        { CheckoutTrackingEvent.PageEntered, "pagevisit" },
        { CheckoutTrackingEvent.ContentLoaded, "viewcategory" },
        { CheckoutTrackingEvent.InitiateCheckout, "addtocart" },
        { CheckoutTrackingEvent.AddPaymentInfo, "addtocart" },
        { CheckoutTrackingEvent.ClickedPurchase, "lead" },
        { CheckoutTrackingEvent.PurchaseCompleted, "checkout" }
    };

    /// <summary>
    /// Mapeamento de eventos para o Taboola Pixel
    /// </summary>
    public static readonly Dictionary<CheckoutTrackingEvent, string> TaboolaEvents = new()
    {
        { CheckoutTrackingEvent.PageEntered, "page_view" },
        { CheckoutTrackingEvent.ContentLoaded, "view_content" },
        { CheckoutTrackingEvent.InitiateCheckout, "checkout_start" },
        { CheckoutTrackingEvent.AddPaymentInfo, "lead" },
        { CheckoutTrackingEvent.ClickedPurchase, "checkout_progress" },
        { CheckoutTrackingEvent.PurchaseCompleted, "purchase" }
    };

    /// <summary>
    /// Mapeamento de eventos para o Utmify
    /// </summary>
    public static readonly Dictionary<CheckoutTrackingEvent, string> UtmifyEvents = new()
    {
        { CheckoutTrackingEvent.PageEntered, "page_view" },
        { CheckoutTrackingEvent.ContentLoaded, "view_content" },
        { CheckoutTrackingEvent.InitiateCheckout, "initiate_checkout" },
        { CheckoutTrackingEvent.AddPaymentInfo, "add_payment_info" },
        { CheckoutTrackingEvent.ClickedPurchase, "clicked_purchase" },
        { CheckoutTrackingEvent.PurchaseCompleted, "purchase" }
    };

    /// <summary>
    /// Mapeamento de eventos para o Otimizey
    /// </summary>
    public static readonly Dictionary<CheckoutTrackingEvent, string> OtimizeyEvents = new()
    {
        { CheckoutTrackingEvent.PageEntered, "page_view" },
        { CheckoutTrackingEvent.ContentLoaded, "view_content" },
        { CheckoutTrackingEvent.InitiateCheckout, "initiate_checkout" },
        { CheckoutTrackingEvent.AddPaymentInfo, "add_payment_info" },
        { CheckoutTrackingEvent.ClickedPurchase, "clicked_purchase" },
        { CheckoutTrackingEvent.PurchaseCompleted, "purchase" }
    };

    /// <summary>
    /// Obtém os nomes dos eventos para uma plataforma específica
    /// </summary>
    public static Dictionary<CheckoutTrackingEvent, string> GetEventsForPlatform(TrackingType platform)
    {
        return platform switch
        {
            TrackingType.FacebookPixel => FacebookPixelEvents,
            TrackingType.GoogleTagManager => GoogleAnalyticsEvents,
            TrackingType.TikTok => TikTokEvents,
            TrackingType.Kwai => KwaiEvents,
            TrackingType.Pinterest => PinterestEvents,
            TrackingType.Taboola => TaboolaEvents,
            TrackingType.Utmify => UtmifyEvents,
            TrackingType.Otimizey => OtimizeyEvents,
            _ => new Dictionary<CheckoutTrackingEvent, string>()
        };
    }
}
