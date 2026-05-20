using FastEndpoints;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Clients.Bankizi.Models.Webhook;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.EndpointsGroups.Acquirers;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Services.Acquirers.Utils;

namespace safefy_api_payment.Endpoints.Acquirers.Bankizi.Simulate;

public sealed class SimulateBankiziWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    IWebHostEnvironment env,
    ILogger<SimulateBankiziWebhookEndpoint> logger
) : Endpoint<SimulateBankiziWebhookRequest, SimulateBankiziWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks/dev/simulate");
        Group<BankiziGroup>();
    }

    public override async Task HandleAsync(SimulateBankiziWebhookRequest req, CancellationToken ct)
    {
        if (!env.IsDevelopment())
        {
            await Send.ResponseAsync(new SimulateBankiziWebhookResponse
            {
                Error = new("Esta funcionalidade está disponível apenas em ambiente Development.")
            }, 403, ct);
            return;
        }

        var environment = PaymentEndpointUtils.GetEnvironment(User);
        if (environment.HasValue && environment.Value != ApiEnvironment.Sandbox)
        {
            await Send.ResponseAsync(new SimulateBankiziWebhookResponse
            {
                Error = new("Esta funcionalidade está disponível apenas para tokens de ambiente Sandbox.")
            }, 403, ct);
            return;
        }

        try
        {
            // Validar evento
            if (req.Event != "PIX_IN")
            {
                await Send.ResponseAsync(new SimulateBankiziWebhookResponse
                {
                    Error = new($"Evento inválido: esperado 'PIX_IN', recebido '{req.Event}'")
                }, 400, ct);
                return;
            }

            // Mapear status da Bankizi para PaymentStatus
            var status = BankiziStatusConverter.ToPaymentStatus(req.Data.Status);

            var processingResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(
                new AcquirerWebhookData
                {
                    AcquirerType = AcquirerType.Bankizi,
                    AcquirerPaymentId = req.Data.TransactionId ?? req.Data.TxId,
                    TxId = req.Data.TxId,
                    Status = status,
                    EndToEndId = req.Data.EndToEndId,
                    PayerName = req.Data.PayerInfo?.Name,
                    PayerDocument = req.Data.PayerInfo?.Document
                }, ct);

            if (!processingResult.Success)
            {
                if (processingResult.PaymentNotFound)
                {
                    await Send.ResponseAsync(new SimulateBankiziWebhookResponse
                    {
                        Error = new($"Transação com TxId '{req.Data.TxId}' não encontrada.")
                    }, 404, ct);
                    return;
                }

                logger.LogError("Failed to process payment: {Error}", processingResult.ErrorMessage);
                await Send.ResponseAsync(new SimulateBankiziWebhookResponse
                {
                    Error = new(processingResult.ErrorMessage ?? "Erro ao processar pagamento.")
                }, 400, ct);
                return;
            }

            var response = new SimulateBankiziWebhookResponse
            {
                Data = new SimulateBankiziWebhookData
                {
                    TxId = req.Data.TxId,
                    Status = req.Data.Status.ToString(),
                    Processed = true
                },
                Message = $"Webhook simulado com sucesso. Status: {req.Data.Status}"
            };

            await Send.OkAsync(response, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error simulating Bankizi webhook");
            await Send.ResponseAsync(new SimulateBankiziWebhookResponse
            {
                Error = new("Erro ao simular webhook.")
            }, 500, ct);
        }
    }
}
