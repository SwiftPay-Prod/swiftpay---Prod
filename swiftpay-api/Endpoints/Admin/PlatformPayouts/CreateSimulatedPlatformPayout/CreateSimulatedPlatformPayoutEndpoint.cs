using System.Data;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Models.Calculation;
using safefy_api.Mappers;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Models.Messages;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.PlatformPayouts.CreateSimulatedPlatformPayout;

public sealed class CreateSimulatedPlatformPayoutEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider,
    ICalculationService calculationService,
    ILedgerService ledgerService,
    IMessagePublisher messagePublisher,
    IApiLogService apiLogService
) : Endpoint<CreateSimulatedPlatformPayoutRequest, CreateSimulatedPlatformPayoutResponse>
{
    public override void Configure()
    {
        Post("platform-payouts/simulated");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CreateSimulatedPlatformPayoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateSimulatedPlatformPayoutResponse
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
            await Send.ResponseAsync(new CreateSimulatedPlatformPayoutResponse
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
            await Send.ResponseAsync(new CreateSimulatedPlatformPayoutResponse
            {
                Error = new("Nenhuma adquirente ativa encontrada.")
            }, 400, ct);
            return;
        }

        var availableByAcquirer = await calculationService.GetTotalAvailableForWithdrawalByAcquirerAsync(acquirers, environment, ct);

        List<PlatformPayoutDistributionItem> distribution;

        if (req.AcquirerItems is { Count: > 0 })
        {
            var requestItems = req.AcquirerItems
                .Select(i => new PayoutDistributionRequest(i.AcquirerId, i.Amount))
                .ToList();
            distribution = calculationService.BuildManualPayoutDistribution(requestItems, acquirers, availableByAcquirer);
        }
        else
        {
            distribution = calculationService.BuildSmartPayoutDistribution(req.TotalAmount!.Value, acquirers, availableByAcquirer);

            if (distribution.Count == 0)
            {
                var fallbackAcquirer = acquirers.FirstOrDefault();
                if (fallbackAcquirer == null)
                {
                    await Send.ResponseAsync(new CreateSimulatedPlatformPayoutResponse
                    {
                        Error = new("Nenhuma adquirente ativa encontrada para registrar o saque simulado.")
                    }, 400, ct);
                    return;
                }

                var amount = req.TotalAmount!.Value;
                var fee = FeeCalculator.Calculate(amount, fallbackAcquirer.PayoutFeeMode, fallbackAcquirer.PayoutFeeFixed, fallbackAcquirer.PayoutFeePercentage);
                distribution = [new PlatformPayoutDistributionItem(fallbackAcquirer, amount, fee, amount - fee)];
            }
        }

        if (distribution.Count == 0)
        {
            await Send.ResponseAsync(new CreateSimulatedPlatformPayoutResponse
            {
                Error = new("Não foi possível determinar a distribuição do saque simulado.")
            }, 400, ct);
            return;
        }

        var now = DateTime.UtcNow;
        var notes = string.IsNullOrWhiteSpace(req.Notes)
            ? "Saque simulado"
            : $"Saque simulado: {req.Notes}";

        var payout = new PlatformPayout
        {
            PlatformPayoutAccountId = payoutAccount.Id,
            Environment = environment,
            TotalAmount = distribution.Sum(d => d.Amount),
            TotalFee = distribution.Sum(d => d.Fee),
            TotalNetAmount = distribution.Sum(d => d.Net),
            Status = PlatformPayoutStatus.Completed,
            Notes = notes,
            RequestedByUserId = userId.Value,
            RequestedAt = now,
            CompletedAt = now
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
                Status = PlatformPayoutItemStatus.Completed,
                ProcessedAt = now,
                CompletedAt = now
            };
            dbContext.PlatformPayoutItems.Add(payoutItem);
        }

        await dbContext.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        var payoutItemsByAcquirerId = await dbContext.PlatformPayoutItems
            .Where(i => i.PlatformPayoutId == payout.Id)
            .ToDictionaryAsync(i => i.AcquirerId, ct);

        var requestedResult = await ledgerService.RecordPlatformWithdrawalRequestedAsync(
            payout.Id,
            payout.TotalAmount,
            $"Saque simulado da plataforma #{payout.Id:N}");

        if (!requestedResult.Success)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.CreateSimulatedPlatformPayout,
                Status = ApiLogStatus.Failed,
                MerchantId = Guid.Empty,
                HttpMethod = HttpContext.Request.Method,
                Endpoint = HttpContext.Request.Path,
                StatusCode = 500,
                Details = $"Falha ao registrar saque simulado no ledger: {requestedResult.ErrorMessage}",
                ResourceId = payout.Id,
                ResourceType = ApiLogResourceType.Payout
            });

            await dbContext.PlatformPayoutItems
                .Where(i => i.PlatformPayoutId == payout.Id)
                .ExecuteDeleteAsync(ct);
            await dbContext.PlatformPayouts
                .Where(p => p.Id == payout.Id)
                .ExecuteDeleteAsync(ct);
            await Send.ResponseAsync(new CreateSimulatedPlatformPayoutResponse
            {
                Error = new($"Erro ao registrar saque no ledger: {requestedResult.ErrorMessage}")
            }, 500, ct);
            return;
        }

        var completedAmounts = 0L;
        foreach (var (acq, amount, fee, _) in distribution)
        {
            if (!payoutItemsByAcquirerId.TryGetValue(acq.Id, out var payoutItem))
            {
                await Send.ResponseAsync(new CreateSimulatedPlatformPayoutResponse
                {
                    Error = new($"Item do saque simulado n�o encontrado para a adquirente {acq.Name}.")
                }, 500, ct);
                return;
            }

            var completedResult = await ledgerService.RecordPlatformWithdrawalCompletedAsync(
                payout.Id,
                payoutItem.Id,
                acq.Id,
                amount,
                fee,
                $"Saque simulado da plataforma - {acq.Name}");

            if (!completedResult.Success)
            {
                await apiLogService.LogAsync(new ApiLogInput
                {
                    Action = ApiLogAction.CreateSimulatedPlatformPayout,
                    Status = ApiLogStatus.Failed,
                    MerchantId = Guid.Empty,
                    HttpMethod = HttpContext.Request.Method,
                    Endpoint = HttpContext.Request.Path,
                    StatusCode = 500,
                    Details = $"Falha ao concluir saque simulado no ledger para adquirente {acq.Name}: {completedResult.ErrorMessage}",
                    ResourceId = payout.Id,
                    ResourceType = ApiLogResourceType.Payout
                });

                var remaining = payout.TotalAmount - completedAmounts;
                if (remaining > 0)
                {
                    await ledgerService.RecordPlatformWithdrawalFailedAsync(
                        payout.Id,
                        null,
                        remaining,
                        $"Rollback: falha ao registrar conclusão do saque simulado para {acq.Name}");
                }
                await dbContext.PlatformPayoutItems
                    .Where(i => i.PlatformPayoutId == payout.Id)
                    .ExecuteDeleteAsync(ct);
                await dbContext.PlatformPayouts
                    .Where(p => p.Id == payout.Id)
                    .ExecuteDeleteAsync(ct);
                await Send.ResponseAsync(new CreateSimulatedPlatformPayoutResponse
                {
                    Error = new($"Erro ao registrar conclusão do saque no ledger: {completedResult.ErrorMessage}")
                }, 500, ct);
                return;
            }

            completedAmounts += amount;
        }

        foreach (var acquirerId in distribution.Select(d => d.Acquirer.Id).Distinct())
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessPlatformBalance,
                new ProcessPlatformBalanceMessage
                {
                    AcquirerId = acquirerId,
                    Environment = environment
                },
                ct);
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
            Action = ApiLogAction.CreateSimulatedPlatformPayout,
            Status = ApiLogStatus.Success,
            MerchantId = Guid.Empty,
            HttpMethod = HttpContext.Request.Method,
            Endpoint = HttpContext.Request.Path,
            StatusCode = 201,
            Details = $"Saque simulado da plataforma registrado. Valor total: {createdPayout.TotalAmount}. Itens: {createdPayout.Items.Count}.",
            ResourceId = createdPayout.Id,
            ResourceType = ApiLogResourceType.Payout
        });

        await Send.ResponseAsync(new CreateSimulatedPlatformPayoutResponse
        {
            Data = PlatformPayoutMapper.ToData(createdPayout),
            Message = "Saque simulado registrado com sucesso!"
        }, 201, ct);
    }
}
