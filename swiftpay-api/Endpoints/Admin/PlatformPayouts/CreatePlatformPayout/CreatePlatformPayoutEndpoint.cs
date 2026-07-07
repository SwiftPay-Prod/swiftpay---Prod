using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Mappers;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Calculation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Utils;
using System.Data;

namespace swiftpay_api.Endpoints.Admin.PlatformPayouts.CreatePlatformPayout;

public sealed class CreatePlatformPayoutEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider,
    IMessagePublisher messagePublisher,
    ILedgerService ledgerService,
    ICalculationService calculationService,
    IApiLogService apiLogService,
    ILogger<CreatePlatformPayoutEndpoint> logger
) : Endpoint<CreatePlatformPayoutRequest, CreatePlatformPayoutResponse>
{
    public override void Configure()
    {
        Post("platform-payouts");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CreatePlatformPayoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreatePlatformPayoutResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var environment = environmentProvider.CurrentEnvironment;

        PlatformPayoutAccount? payoutAccount;

        if (req.PlatformPayoutAccountId.HasValue)
        {
            payoutAccount = await dbContext.PlatformPayoutAccounts
                .AsNoTracking()
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync(a => a.Id == req.PlatformPayoutAccountId.Value && a.DeactivatedAt == null, ct);
        }
        else
        {
            payoutAccount = await dbContext.PlatformPayoutAccounts
                .AsNoTracking()
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync(a => a.IsActive, ct);
        }

        if (payoutAccount == null)
        {
            await Send.ResponseAsync(new CreatePlatformPayoutResponse
            {
                Error = new("Conta de saque não encontrada. Cadastre ou selecione uma conta válida antes de solicitar o saque.")
            }, 400, ct);
            return;
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);

        var acquirers = await dbContext.Acquirers
            .AsNoTracking()
            .Where(a => a.IsActive && a.SupportsWithdrawal)
            .ToListAsync(ct);

        if (acquirers.Count == 0)
        {
            await Send.ResponseAsync(new CreatePlatformPayoutResponse
            {
                Error = new("Nenhuma adquirente ativa encontrada.")
            }, 400, ct);
            return;
        }

        var availableByAcquirer = await calculationService.GetTotalAvailableForWithdrawalByAcquirerAsync(acquirers, environment, ct);

        List<PlatformPayoutDistributionItem> distribution;
        var isManualDistribution = req.AcquirerItems is { Count: > 0 };

        if (isManualDistribution)
        {
            var requestItems = req.AcquirerItems!
                .Select(i => new PayoutDistributionRequest(i.AcquirerId, i.Amount))
                .ToList();
            distribution = calculationService.BuildManualPayoutDistribution(requestItems, acquirers, availableByAcquirer);
        }
        else
        {
            distribution = calculationService.BuildSmartPayoutDistribution(req.TotalAmount!.Value, acquirers, availableByAcquirer);
        }

        if (distribution.Count == 0)
        {
            await Send.ResponseAsync(new CreatePlatformPayoutResponse
            {
                Error = new("Saldo insuficiente nas adquirentes para realizar o saque.")
            }, 400, ct);
            return;
        }

        var totalToWithdraw = distribution.Sum(d => d.Amount);
        var platformBalance = await ledgerService.GetPlatformBalanceInfoAsync();
        if (totalToWithdraw > platformBalance.Available)
        {
            await Send.ResponseAsync(new CreatePlatformPayoutResponse
            {
                Error = new($"Saldo insuficiente na plataforma. Disponível: {platformBalance.Available}, Solicitado: {totalToWithdraw}.")
            }, 400, ct);
            return;
        }

        var now = DateTime.UtcNow;

        var payout = new PlatformPayout
        {
            PlatformPayoutAccountId = payoutAccount.Id,
            Environment = environment,
            TotalAmount = distribution.Sum(d => d.Amount),
            TotalFee = distribution.Sum(d => d.Fee),
            TotalNetAmount = distribution.Sum(d => d.Net),
            Status = PlatformPayoutStatus.Processing,
            Notes = req.Notes,
            RequestedByUserId = userId.Value,
            RequestedAt = now
        };

        dbContext.PlatformPayouts.Add(payout);

        foreach (var (acq, amount, fee, net) in distribution)
        {
            var payoutItem = new PlatformPayoutItem
            {
                PlatformPayoutId = payout.Id,
                AcquirerId = acq.Id,
                Amount = amount,
                AcquirerFee = fee,
                NetAmount = net,
                Status = PlatformPayoutItemStatus.Processing
            };
            dbContext.PlatformPayoutItems.Add(payoutItem);
        }

        await dbContext.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        var ledgerResult = await ledgerService.RecordPlatformWithdrawalRequestedAsync(
            payout.Id,
            payout.TotalAmount,
            $"Saque da plataforma #{payout.Id:N} solicitado");

        if (!ledgerResult.Success)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.CreatePlatformPayout,
                Status = ApiLogStatus.Failed,
                MerchantId = Guid.Empty,
                HttpMethod = HttpContext.Request.Method,
                Endpoint = HttpContext.Request.Path,
                StatusCode = 500,
                Details = $"Falha ao registrar saque da plataforma no ledger: {ledgerResult.ErrorMessage}",
                ResourceId = payout.Id,
                ResourceType = ApiLogResourceType.Payout
            });

            await dbContext.PlatformPayoutItems
                .Where(i => i.PlatformPayoutId == payout.Id)
                .ExecuteDeleteAsync(ct);
            await dbContext.PlatformPayouts
                .Where(p => p.Id == payout.Id)
                .ExecuteDeleteAsync(ct);
            await Send.ResponseAsync(new CreatePlatformPayoutResponse
            {
                Error = new($"Erro ao registrar saque no ledger: {ledgerResult.ErrorMessage}")
            }, 500, ct);
            return;
        }

        try
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessPlatformPayout,
                new ProcessPlatformPayoutMessage
                {
                    PlatformPayoutId = payout.Id,
                    Environment = environment
                },
                ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to publish platform payout message for payout {PayoutId}. Rolling back.", payout.Id);
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.CreatePlatformPayout,
                Status = ApiLogStatus.Failed,
                MerchantId = Guid.Empty,
                HttpMethod = HttpContext.Request.Method,
                Endpoint = HttpContext.Request.Path,
                StatusCode = 500,
                Details = $"Falha ao publicar processamento do saque da plataforma {payout.Id}: {ex.Message}",
                ResourceId = payout.Id,
                ResourceType = ApiLogResourceType.Payout,
                ErrorCode = "publish_failed"
            });

            var rollbackResult = await ledgerService.RecordPlatformWithdrawalFailedAsync(
                payout.Id,
                null,
                payout.TotalAmount,
                $"Saque da plataforma #{payout.Id:N} revertido por falha no envio da mensagem");

            if (!rollbackResult.Success)
            {
                var failureReason = $"Falha ao reverter saque após erro de publish: {rollbackResult.ErrorMessage}";
                var rollbackNow = DateTime.UtcNow;

                await dbContext.PlatformPayoutItems
                    .Where(i => i.PlatformPayoutId == payout.Id && i.Status == PlatformPayoutItemStatus.Processing)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(i => i.Status, PlatformPayoutItemStatus.Failed)
                        .SetProperty(i => i.FailureReason, failureReason)
                        .SetProperty(i => i.CompletedAt, rollbackNow), ct);

                await dbContext.PlatformPayouts
                    .Where(p => p.Id == payout.Id)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(p => p.Status, PlatformPayoutStatus.Failed)
                        .SetProperty(p => p.CompletedAt, rollbackNow), ct);

                await apiLogService.LogAsync(new ApiLogInput
                {
                    Action = ApiLogAction.CreatePlatformPayout,
                    Status = ApiLogStatus.Failed,
                    MerchantId = Guid.Empty,
                    HttpMethod = HttpContext.Request.Method,
                    Endpoint = HttpContext.Request.Path,
                    StatusCode = 500,
                    Details = $"Falha crítica no rollback do saque da plataforma {payout.Id}: {rollbackResult.ErrorMessage}",
                    ResourceId = payout.Id,
                    ResourceType = ApiLogResourceType.Payout,
                    ErrorCode = "rollback_failed"
                });

                await Send.ResponseAsync(new CreatePlatformPayoutResponse
                {
                    Error = new("Erro crítico ao reverter o saque após falha de publicação. O saque foi mantido para recuperação operacional.")
                }, 500, ct);
                return;
            }

            await dbContext.PlatformPayoutItems
                .Where(i => i.PlatformPayoutId == payout.Id)
                .ExecuteDeleteAsync(ct);
            await dbContext.PlatformPayouts
                .Where(p => p.Id == payout.Id)
                .ExecuteDeleteAsync(ct);
            await Send.ResponseAsync(new CreatePlatformPayoutResponse
            {
                Error = new("Erro ao iniciar o processamento do saque. Tente novamente.")
            }, 500, ct);
            return;
        }

        var createdPayout = await dbContext.PlatformPayouts
            .AsNoTracking()
            .Include(p => p.PayoutAccount)
            .Include(p => p.RequestedByUser)
            .Include(p => p.Items)
                .ThenInclude(i => i.Acquirer)
            .OrderBy(p => p.Id)
            .FirstAsync(p => p.Id == payout.Id, ct);

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.CreatePlatformPayout,
            Status = ApiLogStatus.Success,
            MerchantId = Guid.Empty,
            HttpMethod = HttpContext.Request.Method,
            Endpoint = HttpContext.Request.Path,
            StatusCode = 201,
            Details = $"Saque da plataforma criado. Valor total: {createdPayout.TotalAmount}. Itens: {createdPayout.Items.Count}.",
            ResourceId = createdPayout.Id,
            ResourceType = ApiLogResourceType.Payout
        });

        var requestedTotalAmount = isManualDistribution
            ? req.AcquirerItems!.Sum(i => i.Amount)
            : req.TotalAmount.GetValueOrDefault();
        var undistributedAmount = Math.Max(0, requestedTotalAmount - createdPayout.TotalAmount);
        var responseMessage = undistributedAmount > 0
            ? $"Saque solicitado com distribuição parcial. Solicitado: {requestedTotalAmount}, Processado: {createdPayout.TotalAmount}, Não distribuído: {undistributedAmount}. O valor restante não se enquadrou nas regras de saque por adquirente."
            : "Saque da plataforma solicitado com sucesso! O processamento será feito em background.";

        await Send.ResponseAsync(new CreatePlatformPayoutResponse
        {
            Data = PlatformPayoutMapper.ToData(createdPayout),
            Message = responseMessage
        }, 201, ct);
    }
}
