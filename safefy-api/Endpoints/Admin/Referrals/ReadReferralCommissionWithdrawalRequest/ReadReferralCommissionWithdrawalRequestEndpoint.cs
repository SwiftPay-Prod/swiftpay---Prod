using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Interfaces;

namespace safefy_api.Endpoints.Admin.Referrals.ReadReferralCommissionWithdrawalRequest;

public sealed class ReadReferralCommissionWithdrawalRequestEndpoint(
    PrimaryDbContext dbContext,
    IStorageService storageService
) : Endpoint<ReadReferralCommissionWithdrawalRequestRequest, ReadReferralCommissionWithdrawalRequestResponse>
{
    public override void Configure()
    {
        Get("referrals/withdrawal-requests/{requestId:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadReferralCommissionWithdrawalRequestRequest req, CancellationToken ct)
    {
        var withdrawalRequest = await dbContext.ReferralCommissionWithdrawalRequests
            .AsNoTracking()
            .Include(r => r.ReferrerUser)
            .OrderBy(r => r.Id)
            .FirstOrDefaultAsync(r => r.Id == req.RequestId, ct);

        if (withdrawalRequest == null)
        {
            await Send.ResponseAsync(new ReadReferralCommissionWithdrawalRequestResponse
            {
                Error = new("Solicitação de saque não encontrada.")
            }, 404, ct);
            return;
        }

        var referralBalance = await dbContext.ReferralCommissionBalances
            .AsNoTracking()
            .OrderBy(b => b.Id)
            .FirstOrDefaultAsync(b => b.ReferrerUserId == withdrawalRequest.ReferrerUserId, ct);

        var platformReferralSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => new
            {
                p.ReferralDurationMonths,
                p.ReferralCommissionPercentage,
                p.ReferralCommissionWithdrawalIntervalValue,
                p.ReferralCommissionWithdrawalIntervalUnit,
                p.ReferralCommissionMinWithdrawalAmount,
                p.ReferralCommissionWithdrawalFeeFixed,
            })
            .FirstOrDefaultAsync(ct);

        var referralDurationMonths = withdrawalRequest.ReferrerUser.ReferralDurationMonths
            ?? platformReferralSettings?.ReferralDurationMonths
            ?? 12;

        var referralCommissionPercentage = withdrawalRequest.ReferrerUser.ReferralCommissionPercentage
            ?? platformReferralSettings?.ReferralCommissionPercentage
            ?? 1000;

        var referralWithdrawalIntervalValue = withdrawalRequest.ReferrerUser.ReferralCommissionWithdrawalIntervalValue
            ?? platformReferralSettings?.ReferralCommissionWithdrawalIntervalValue
            ?? 1;

        var referralWithdrawalIntervalUnit = withdrawalRequest.ReferrerUser.ReferralCommissionWithdrawalIntervalUnit
            ?? platformReferralSettings?.ReferralCommissionWithdrawalIntervalUnit
            ?? safefy_api_core.Models.Database.ReferralWithdrawalIntervalUnit.Days;

        var referralMinWithdrawalAmount = withdrawalRequest.ReferrerUser.ReferralCommissionMinWithdrawalAmount
            ?? platformReferralSettings?.ReferralCommissionMinWithdrawalAmount
            ?? 0;

        var referralWithdrawalFeeFixed = withdrawalRequest.ReferrerUser.ReferralCommissionWithdrawalFeeFixed
            ?? platformReferralSettings?.ReferralCommissionWithdrawalFeeFixed
            ?? 0;

        var pendingWithdrawalRequestsTotal = referralBalance?.TotalPendingWithdrawal ?? 0;

        var payment = await dbContext.ReferralCommissionPayments
            .AsNoTracking()
            .Where(p => p.WithdrawalRequestId == withdrawalRequest.Id)
            .Include(p => p.PaidByUser)
            .Include(p => p.ReceiptFile)
            .OrderByDescending(p => p.PaidAt)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        Endpoints.Models.FileData? receiptFile = null;
        if (payment?.ReceiptFile != null)
        {
            var receiptEntity = payment.ReceiptFile;
            var receiptUrl = receiptEntity.IsPublic
                ? storageService.GetPublicUrl(receiptEntity.ObjectName)
                : await storageService.GetOrRefreshUrlAsync(receiptEntity);

            receiptFile = new Endpoints.Models.FileData
            {
                Id = receiptEntity.Id,
                OriginalFileName = receiptEntity.OriginalFileName,
                ContentType = receiptEntity.ContentType,
                Size = receiptEntity.Size,
                Url = receiptUrl,
                ExpiresAt = receiptEntity.CachedUrlExpiresAt
            };
        }

        var availableCommissionBalance = referralBalance?.AvailableBalance ?? 0;

        await Send.OkAsync(new ReadReferralCommissionWithdrawalRequestResponse
        {
            Data = new AdminReferralCommissionWithdrawalRequestDetails
            {
                Id = withdrawalRequest.Id,
                ReferrerUserId = withdrawalRequest.ReferrerUserId,
                ReferrerName = withdrawalRequest.ReferrerUser.Name,
                ReferrerEmail = withdrawalRequest.ReferrerUser.Email,
                ReferrerStatus = withdrawalRequest.ReferrerUser.Status,
                RequestedAmount = withdrawalRequest.Amount,
                RequestedAt = withdrawalRequest.RequestedAt,
                Status = withdrawalRequest.Status,
                RequestNotes = withdrawalRequest.Notes,
                ReviewReason = withdrawalRequest.ReviewReason,
                AvailableCommissionBalance = availableCommissionBalance,
                PendingWithdrawalRequestsTotal = pendingWithdrawalRequestsTotal,
                ReferralDurationMonths = referralDurationMonths,
                ReferralCommissionPercentage = referralCommissionPercentage,
                ReferralCommissionWithdrawalIntervalValue = referralWithdrawalIntervalValue,
                ReferralCommissionWithdrawalIntervalUnit = referralWithdrawalIntervalUnit,
                ReferralCommissionMinWithdrawalAmount = referralMinWithdrawalAmount,
                ReferralCommissionWithdrawalFeeFixed = referralWithdrawalFeeFixed,
                PayoutPixKeyType = withdrawalRequest.ReferrerUser.ReferralPayoutPixKeyType,
                PayoutPixKey = withdrawalRequest.ReferrerUser.ReferralPayoutPixKey,
                Payment = payment == null
                    ? null
                    : new AdminReferralCommissionWithdrawalPaymentDetails
                    {
                        Id = payment.Id,
                        PaidAmount = payment.Amount,
                        RequestedAmount = payment.RequestedAmount,
                        FeeAmount = payment.FeeAmount,
                        NetAmount = payment.NetAmount,
                        PaidAt = payment.PaidAt,
                        Notes = payment.Notes,
                        LedgerTransactionId = payment.LedgerTransactionId,
                        PaidByUserId = payment.PaidByUserId,
                        PaidByUserName = payment.PaidByUser.Name,
                        PaidByUserEmail = payment.PaidByUser.Email,
                        PixKeyType = payment.PixKeyType,
                        PixKey = payment.PixKey,
                        ReceiptFile = receiptFile
                    }
            }
        }, ct);
    }
}
