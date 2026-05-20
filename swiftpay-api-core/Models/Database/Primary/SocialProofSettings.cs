using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

/// <summary>
/// Posição da notificação de prova social na tela
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SocialProofPosition
{
    BottomLeft,
    BottomRight,
    TopLeft,
    TopRight
}

/// <summary>
/// Configurações de prova social (notificações simuladas de compra)
/// Armazenado como JSONB no CheckoutConfig
/// </summary>
public class SocialProofSettings
{
    /// <summary>
    /// Intervalo em segundos entre as notificações
    /// </summary>
    public int IntervalSeconds { get; set; } = 8;
    
    /// <summary>
    /// Duração em segundos que a notificação fica visível
    /// </summary>
    public int DurationSeconds { get; set; } = 4;
    
    /// <summary>
    /// Posição da notificação na tela
    /// </summary>
    public SocialProofPosition Position { get; set; } = SocialProofPosition.BottomLeft;
    
    /// <summary>
    /// Lista de notificações configuradas
    /// </summary>
    public List<SocialProofNotification> Notifications { get; set; } = [];
}

/// <summary>
/// Representa uma única notificação de prova social
/// </summary>
public class SocialProofNotification
{
    /// <summary>
    /// Nome da pessoa na notificação (ex: "João Silva")
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Localização da pessoa (ex: "São Paulo, SP")
    /// </summary>
    public string Location { get; set; } = string.Empty;
    
    /// <summary>
    /// Ação realizada (ex: "acabou de comprar")
    /// </summary>
    public string Action { get; set; } = "acabou de comprar";
}
