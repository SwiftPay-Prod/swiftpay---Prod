using MassTransit;
using Microsoft.Extensions.Logging;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Messages;
using safefy_api_core.Services;

namespace safefy_api_core.Consumers;

public class ProcessBankReconciliationConsumer : IConsumer<ProcessBankReconciliationMessage>
{
    private readonly IBankReconciliationService _bankReconciliationService;
    private readonly ILogger<ProcessBankReconciliationConsumer> _logger;

    public ProcessBankReconciliationConsumer(
        IBankReconciliationService bankReconciliationService,
        ILogger<ProcessBankReconciliationConsumer> logger)
    {
        _bankReconciliationService = bankReconciliationService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ProcessBankReconciliationMessage> context)
    {
        var message = context.Message;
        using var environmentScope = HybridEnvironmentProvider.SetEnvironment(message.Environment);

        try
        {
            await _bankReconciliationService.ProcessReconciliationAsync(
                message.ReconciliationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error processing bank reconciliation: ReconciliationId={ReconciliationId}, MerchantId={MerchantId}",
                message.ReconciliationId,
                message.MerchantId);
            throw;
        }
    }
}
