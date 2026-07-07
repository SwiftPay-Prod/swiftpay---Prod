using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Produto de serviço - consultas, aulas, atendimentos, etc
/// </summary>
public class ServiceProduct : BaseProduct
{
    /// <summary>
    /// Preço em centavos
    /// </summary>
    public long Price { get; set; }

    /// <summary>
    /// Preço comparativo/riscado em centavos (para mostrar desconto)
    /// </summary>
    public long? CompareAtPrice { get; set; }

    /// <summary>
    /// Duração do serviço em minutos (ex: 60 para consulta de 1h)
    /// </summary>
    public int? DurationMinutes { get; set; }

    /// <summary>
    /// Se requer agendamento
    /// </summary>
    public bool RequiresScheduling { get; set; } = false;

    /// <summary>
    /// Tipo de localização do serviço
    /// </summary>
    public ServiceLocationType LocationType { get; set; } = ServiceLocationType.Online;

    /// <summary>
    /// Endereço/Local do serviço (quando InPerson ou Both)
    /// </summary>
    public string? LocationAddress { get; set; }

    /// <summary>
    /// Link para serviço online (quando Online ou Both)
    /// Ex: link do Zoom, Google Meet, etc
    /// </summary>
    public string? OnlineServiceUrl { get; set; }

    /// <summary>
    /// Instruções adicionais para o cliente
    /// </summary>
    public string? Instructions { get; set; }

    // Navegações
    public virtual ICollection<Category> Categories { get; set; } = [];
}
