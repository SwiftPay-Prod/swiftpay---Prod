using FastEndpoints;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Reconciliations.StartAllReconciliations;

public sealed class StartAllReconciliationsEndpoint(
    IMessagePublisher messagePublisher,
    IEnvironmentProvider environmentProvider
) : Endpoint<StartAllReconciliationsRequest, StartAllReconciliationsResponse>
{
    public override void Configure()
    {
        Post("reconciliations/start-all");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(StartAllReconciliationsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new StartAllReconciliationsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        await messagePublisher.PublishAsync(
            RabbitMQQueues.StartAllBankReconciliations,
            new StartAllReconciliationsMessage
            {
                RequestedByUserId = userId.Value,
                SilentMode = req.SilentMode,
                Environment = environmentProvider.CurrentEnvironment
            });

        await Send.ResponseAsync(new StartAllReconciliationsResponse
        {
            Message = "Reconciliação em lote iniciada. Você será notificado ao concluir."
        }, 202, ct);
    }
}
