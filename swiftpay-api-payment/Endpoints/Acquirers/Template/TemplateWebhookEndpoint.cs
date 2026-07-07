using FastEndpoints;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api_payment.Endpoints.Acquirers.Template;

/*
 * ================================================================================
 * TEMPLATE PARA NOVOS ADQUIRENTES
 * ================================================================================
 * 
 * Este arquivo serve como modelo para implementar webhooks de novas adquirentes.
 * 
 * PASSOS PARA ADICIONAR UMA NOVA ADQUIRENTE:
 * 
 * 1. Adicionar o tipo em AcquirerType enum (swiftpay-api-core)
 * 2. Criar pasta: Endpoints/Acquirers/{NomeAdquirente}/
 * 3. Criar EndpointGroup em EndpointsGroups/Acquirers/{NomeAdquirente}Group.cs
 *    - Usar rota base: v1/internal/{nomeadquirente}
 * 4. Criar models tipados para o payload da adquirente em:
 *    - Clients/{NomeAdquirente}/Models/Webhook/
 * 5. Criar endpoint de webhook usando os models tipados
 * 6. Implementar IAcquirerService para a nova adquirente (geração de PIX, status)
 * 7. Registrar no AcquirerServiceFactory
 * 8. Configurar autenticação via Admin:
 *    - PATCH /v1/admin/acquirers/{id}
 *    - WebhookAuthMode: Token, Ip ou TokenAndIp
 *    - WebhookToken: token para autenticação por header
 *    - WebhookAllowedIps: IPs permitidos (ex: 192.168.1.1,10.0.0.0/24)
 * 
 * AUTENTICAÇÃO (centralizada no middleware):
 * O AcquirerWebhookAuthMiddleware cuida da autenticação automaticamente para
 * todas as rotas v1/internal/{acquirer}/*. Não é necessário implementar
 * validação no endpoint.
 * 
 * RESPONSABILIDADES DO ENDPOINT:
 * - Receber o payload tipado (FastEndpoints faz a deserialização)
 * - Validar o evento/tipo
 * - Mapear status da adquirente para PaymentStatus
 * - Delegação para PaymentProcessingService (lógica comum)
 * 
 * LÓGICA CENTRALIZADA (NÃO PRECISA IMPLEMENTAR):
 * - Autenticação do webhook (middleware)
 * - Atualização do status do pagamento
 * - Registro no Ledger
 * - Criação de notificações
 * - Envio de webhook para o merchant
 * 
 * ================================================================================
 */

/// <summary>
/// Template de endpoint para webhook de adquirente.
/// Cada adquirente deve ter seu próprio model tipado para o payload.
/// Veja BankiziWebhookEndpoint como exemplo de implementação.
/// </summary>
public sealed class TemplateWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    ILogger<TemplateWebhookEndpoint> logger
) : Endpoint<TemplateWebhookRequest, TemplateWebhookResponse>
{
    private const AcquirerType ACQUIRER_TYPE = AcquirerType.Bankizi; // Alterar para o tipo correto

    public override void Configure()
    {
        Post("/internal/webhooks/template");
        AllowAnonymous();
        Description(d => d.ExcludeFromDescription());
    }

    public override async Task HandleAsync(TemplateWebhookRequest req, CancellationToken ct)
    {
        // NOTA: Este é um template. Cada adquirente deve ter:
        // 1. Model tipado para o payload (ex: BankiziPixInWebhook)
        // 2. Validação específica do evento/tipo
        // 3. Mapeamento de status para PaymentStatus
        //
        // Veja BankiziWebhookEndpoint.cs como exemplo de implementação real.

        try
        {
            // Exemplo de processamento (adaptar para cada adquirente):
            // 1. Validar evento
            // if (req.Event != "EXPECTED_EVENT") { ... }
            
            // 2. Mapear status
            // var status = MapStatus(req.Data.Status);
            
            // 3. Delegar ao serviço centralizado
            var processingResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(
                new AcquirerWebhookData
                {
                    AcquirerType = ACQUIRER_TYPE,
                    AcquirerPaymentId = "acquirer_transaction_id_from_payload",
                    ExternalId = null, // Guid.Parse() se enviar nosso Payment.Id como ExternalId
                    TxId = "txId_from_payload", // Se adquirente usar TxId gerado por nós
                    Status = PaymentStatus.Completed, // Mapear do payload
                    EndToEndId = null,
                    PayerName = null,
                    PayerDocument = null
                }, ct);

            if (!processingResult.Success && !processingResult.PaymentNotFound)
            {
                logger.LogError("Failed to process payment from {Acquirer}: {Error}", 
                    ACQUIRER_TYPE, processingResult.ErrorMessage);
            }

            await Send.ResponseAsync(new TemplateWebhookResponse
            {
                Data = new TemplateWebhookData { Processed = true }
            }, 200, cancellation: ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing {Acquirer} webhook", ACQUIRER_TYPE);
            await Send.ResponseAsync(new TemplateWebhookResponse
            {
                Error = new ApiErrorResponse("Erro interno ao processar webhook.", "internal_error")
            }, 500, cancellation: ct);
        }
    }
}

/// <summary>
/// NOTA: Substituir por model tipado específico da adquirente.
/// Exemplo: public sealed record TemplateWebhookRequest : AdquirentePixInWebhook;
/// </summary>
public sealed class TemplateWebhookRequest
{
    // Definir propriedades conforme payload da adquirente
    public string? Event { get; set; }
    public object? Data { get; set; }
}

public sealed class TemplateWebhookResponse : BaseResponse<TemplateWebhookData>;

public sealed class TemplateWebhookData
{
    public bool Processed { get; set; }
}
