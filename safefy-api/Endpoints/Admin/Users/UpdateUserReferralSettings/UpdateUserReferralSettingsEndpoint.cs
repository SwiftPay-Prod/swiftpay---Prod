using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Inputs;

namespace safefy_api.Endpoints.Admin.Users.UpdateUserReferralSettings;

public sealed class UpdateUserReferralSettingsEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog
) : Endpoint<UpdateUserReferralSettingsRequest, UpdateUserReferralSettingsResponse>
{
    public override void Configure()
    {
        Patch("users/{userId:guid}/referral-settings");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(UpdateUserReferralSettingsRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new UpdateUserReferralSettingsResponse
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
            await Send.ResponseAsync(new UpdateUserReferralSettingsResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        user.ReferralDurationMonths = req.ReferralDurationMonths;
        user.ReferralCommissionPercentage = req.ReferralCommissionPercentage;
        user.ReferralCommissionWithdrawalIntervalValue = req.ReferralCommissionWithdrawalIntervalValue;
        user.ReferralCommissionWithdrawalIntervalUnit = req.ReferralCommissionWithdrawalIntervalUnit;
        user.ReferralCommissionMinWithdrawalAmount = req.ReferralCommissionMinWithdrawalAmount;
        user.ReferralCommissionWithdrawalFeeFixed = req.ReferralCommissionWithdrawalFeeFixed;
        user.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = safefy_api_core.Models.Database.SecurityLogAction.ProfileUpdate,
            Status = safefy_api_core.Models.Database.SecurityLogStatus.Success,
            UserId = adminId,
            Details = $"Configurações de indicação do usuário {user.Id} atualizadas."
        });

        await Send.OkAsync(new UpdateUserReferralSettingsResponse
        {
            Data = new UpdateUserReferralSettingsData
            {
                UserId = user.Id,
                ReferralDurationMonths = user.ReferralDurationMonths,
                ReferralCommissionPercentage = user.ReferralCommissionPercentage,
                ReferralCommissionWithdrawalIntervalValue = user.ReferralCommissionWithdrawalIntervalValue,
                ReferralCommissionWithdrawalIntervalUnit = user.ReferralCommissionWithdrawalIntervalUnit,
                ReferralCommissionMinWithdrawalAmount = user.ReferralCommissionMinWithdrawalAmount,
                ReferralCommissionWithdrawalFeeFixed = user.ReferralCommissionWithdrawalFeeFixed
            },
            Message = "Configurações de indicação do usuário atualizadas com sucesso!"
        }, ct);
    }
}
