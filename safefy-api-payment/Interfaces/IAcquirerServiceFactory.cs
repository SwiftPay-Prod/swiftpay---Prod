using safefy_api_core.Models.Database;

namespace safefy_api_payment.Interfaces;

/// <summary>
/// Factory para resolver o serviço de adquirente apropriado baseado no tipo.
/// </summary>
public interface IAcquirerServiceFactory
{
    /// <summary>
    /// Obtém o serviço de adquirente para o tipo especificado.
    /// </summary>
    /// <param name="acquirerType">Tipo do adquirente.</param>
    /// <returns>Serviço do adquirente ou null se não suportado.</returns>
    IAcquirerService? GetService(AcquirerType acquirerType);

    /// <summary>
    /// Verifica se o tipo de adquirente é suportado.
    /// </summary>
    bool IsSupported(AcquirerType acquirerType);
}
