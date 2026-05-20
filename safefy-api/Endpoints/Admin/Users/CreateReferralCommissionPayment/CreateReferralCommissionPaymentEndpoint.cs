using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Services.Internal;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.Users.CreateReferralCommissionPayment;

public sealed class CreateReferralCommissionPaymentEndpoint(
    PrimaryDbContext dbContext,
    ReferralCommissionCalculator referralCommissionCalculator,
    ILedgerService ledgerService,
    INotificationService notificationService
) : Endpoint<CreateReferralCommissionPaymentRequest, CreateReferralCommissionPaymentResponse>
{
    public override void Configure()
    {
        Post("users/{userId:guid}/referral-commission-payments");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CreateReferralCommissionPaymentRequest req, CancellationToken ct)
    {
        var actorUserId = EndpointUtils.GetUserId(User);
        if (actorUserId == null)
        {
            await Send.ResponseAsync(new CreateReferralCommissionPaymentResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new CreateReferralCommissionPaymentResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        if (!user.ReferralPayoutPixKeyType.HasValue || string.IsNullOrWhiteSpace(user.ReferralPayoutPixKey))
        {
            await Send.ResponseAsync(new CreateReferralCommissionPaymentResponse
            {
                Error = new("O usuário ainda não cadastrou chave PIX para recebimento da comissão.")
            }, 400, ct);
            return;
        }

        var summary = await referralCommissionCalculator.CalculateForReferrerAsync(user.Id, ct);

        var paidCommissionTotal = await dbContext.ReferralCommissionPayments
            .AsNoTracking()
            .Where(p => p.ReferrerUserId == user.Id)
            .SumAsync(p => (long?)p.Amount, ct) ?? 0;

        var availableCommissionBalance = Math.Max(summary.EstimatedCommissionTotal - paidCommissionTotal, 0);

        if (req.Amount > availableCommissionBalance)
        {
            await Send.ResponseAsync(new CreateReferralCommissionPaymentResponse
            {
                Error = new("O valor informado é maior que o saldo disponível de comissão.")
            }, 400, ct);
            return;
        }

        var ledgerResult = await ledgerService.RecordReferralCommissionPayoutAsync(
            req.Amount,
            $"Pagamento manual de comissão de indicação para usuário {user.Id}");

        if (!ledgerResult.Success)
        {
            await Send.ResponseAsync(new CreateReferralCommissionPaymentResponse
            {
                Error = new(ledgerResult.ErrorMessage ?? "Não foi possível registrar o pagamento da comissão no ledger.")
            }, 400, ct);
            return;
        }

        var ledgerTransactionId = string.IsNullOrWhiteSpace(ledgerResult.TransactionId)
            ? null
            : ledgerResult.TransactionId;

        var payment = new ReferralCommissionPayment
        {
            ReferrerUserId = user.Id,
            PaidByUserId = actorUserId.Value,
            Amount = req.Amount,
            PixKeyType = user.ReferralPayoutPixKeyType,
            PixKey = user.ReferralPayoutPixKey,
            Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim(),
            LedgerTransactionId = ledgerTransactionId,
            PaidAt = DateTime.UtcNow
        };

        dbContext.ReferralCommissionPayments.Add(payment);
        await dbContext.SaveChangesAsync(ct);

        await notificationService.CreateUserInfoNotificationAsync(
            user.Id,
            "Comissão de indicação paga",
            $"Sua comissão de indicação no valor de R$ {(req.Amount / 100m):N2} foi registrada como paga.",
            actionUrl: "/panel/referrals");

        var nextAvailableBalance = Math.Max(availableCommissionBalance - req.Amount, 0);

        await Send.OkAsync(new CreateReferralCommissionPaymentResponse
        {
            Data = new AdminReferralCommissionPaymentData
            {
                Id = payment.Id,
                ReferrerUserId = payment.ReferrerUserId,
                Amount = payment.Amount,
                AvailableCommissionBalance = nextAvailableBalance,
                PaidAt = payment.PaidAt,
                Notes = payment.Notes,
                PixKeyType = payment.PixKeyType,
                PixKey = payment.PixKey
            },
            Message = "Pagamento manual de comissão registrado com sucesso."
        }, ct);
    }
}
