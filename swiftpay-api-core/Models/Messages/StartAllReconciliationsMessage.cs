using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Messages;

/// <summary>
/// Mensagem para iniciar reconciliação de todos os merchants em background
/// </summary>
public class StartAllReconciliationsMessage
{
    /// <summary>ID do usuário que solicitou</summary>
    public Guid RequestedByUserId { get; set; }

    /// <summary>Executar sem notificações para o merchant</summary>
    public bool SilentMode { get; set; }

    /// <summary>Ambiente da reconciliação</summary>
    public ApiEnvironment Environment { get; set; }
}
