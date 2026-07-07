using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Messages;

/// <summary>
/// Mensagem para processar reconciliação bancária de uma organização em background
/// </summary>
public class ProcessBankReconciliationMessage
{
    /// <summary>ID da reconciliação criada</summary>
    public Guid ReconciliationId { get; set; }

    /// <summary>ID da organização</summary>
    public Guid MerchantId { get; set; }

    /// <summary>Ambiente (Sandbox ou Production)</summary>
    public ApiEnvironment Environment { get; set; }

    /// <summary>ID do usuário que solicitou</summary>
    public Guid RequestedByUserId { get; set; }
}
