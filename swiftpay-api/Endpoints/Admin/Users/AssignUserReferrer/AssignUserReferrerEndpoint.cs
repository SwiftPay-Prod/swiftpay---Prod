using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Messages;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.Users.AssignUserReferrer;

public sealed class AssignUserReferrerEndpoint(
    PrimaryDbContext dbContext,
    IReferralCommissionCompilationService referralCommissionCompilationService,
    IMessagePublisher messagePublisher,
    IEnvironmentProvider environmentProvider
) : Endpoint<AssignUserReferrerRequest, AssignUserReferrerResponse>
{
    public override void Configure()
    {
        Post("users/{userId:guid}/assign-referrer");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(AssignUserReferrerRequest req, CancellationToken ct)
    {
        var actorUserId = EndpointUtils.GetUserId(User);
        if (actorUserId == null)
        {
            await Send.ResponseAsync(new AssignUserReferrerResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var referredUser = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (referredUser == null)
        {
            await Send.ResponseAsync(new AssignUserReferrerResponse
            {
                Error = new("Usuário indicado não encontrado.")
            }, 404, ct);
            return;
        }

        var previousReferrerUserId = referredUser.ReferredByUserId;

        if (previousReferrerUserId.HasValue
            && previousReferrerUserId.Value == req.ReferrerUserId
            && !req.ProcessHistoricalCommission)
        {
            await Send.OkAsync(new AssignUserReferrerResponse
            {
                Data = new AssignUserReferrerData
                {
                    UserId = referredUser.Id,
                    ReferrerUserId = req.ReferrerUserId,
                    ReferredAt = referredUser.ReferredAt ?? referredUser.CreatedAt,
                    ProcessHistoricalCommission = false,
                    IsProcessingAsync = false,
                    ProcessedPaymentsCount = 0,
                    ProcessedPayoutsCount = 0
                },
                Message = "O usuário já está vinculado a este gerente de contas."
            }, ct);
            return;
        }

        var referrerUser = await dbContext.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == req.ReferrerUserId, ct);

        if (referrerUser == null)
        {
            await Send.ResponseAsync(new AssignUserReferrerResponse
            {
                Error = new("Gerente de contas não encontrado.")
            }, 404, ct);
            return;
        }

        if (referrerUser.Status != UserStatus.Active)
        {
            await Send.ResponseAsync(new AssignUserReferrerResponse
            {
                Error = new("Somente usuários ativos podem ser vinculados como gerente de contas.")
            }, 400, ct);
            return;
        }

        if (referrerUser.ReferredByUserId.HasValue)
        {
            await Send.ResponseAsync(new AssignUserReferrerResponse
            {
                Error = new("Um usuário já indicado não pode ser definido como gerente de contas de outro usuário.")
            }, 400, ct);
            return;
        }

        var referredAt = req.ProcessHistoricalCommission
            ? referredUser.CreatedAt
            : DateTime.UtcNow;

        if (req.ProcessHistoricalCommission && previousReferrerUserId.HasValue)
        {
            await referralCommissionCompilationService.ResetReferralCompilationForReferredUserAsync(
                previousReferrerUserId.Value,
                referredUser.Id,
                ct);
        }

        referredUser.ReferredByUserId = referrerUser.Id;
        referredUser.ReferredAt = referredAt;
        referredUser.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        await referralCommissionCompilationService.EnsureReferralLinkStructuresAsync(
            referrerUser.Id,
            referredUser.Id,
            ct);

        if (req.ProcessHistoricalCommission)
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessReferralHistoricalCommission,
                new ProcessReferralHistoricalCommissionMessage
                {
                    ReferredUserId = referredUser.Id,
                    ReferrerUserId = referrerUser.Id,
                    ReferredAt = referredAt,
                    Environment = environmentProvider.CurrentEnvironment
                });

            await Send.OkAsync(new AssignUserReferrerResponse
            {
                Data = new AssignUserReferrerData
                {
                    UserId = referredUser.Id,
                    ReferrerUserId = referrerUser.Id,
                    ReferredAt = referredUser.ReferredAt!.Value,
                    ProcessHistoricalCommission = true,
                    IsProcessingAsync = true,
                    ProcessedPaymentsCount = 0,
                    ProcessedPayoutsCount = 0
                },
                Message = "Indicação manual registrada com sucesso. As comissões históricas serão processadas em segundo plano."
            }, ct);
            return;
        }

        await Send.OkAsync(new AssignUserReferrerResponse
        {
            Data = new AssignUserReferrerData
            {
                UserId = referredUser.Id,
                ReferrerUserId = referrerUser.Id,
                ReferredAt = referredUser.ReferredAt!.Value,
                ProcessHistoricalCommission = false,
                IsProcessingAsync = false,
                ProcessedPaymentsCount = 0,
                ProcessedPayoutsCount = 0
            },
            Message = "Indicação manual registrada com sucesso."
        }, ct);
    }
}
