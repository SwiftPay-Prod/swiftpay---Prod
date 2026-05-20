using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.Mappers;
using safefy_api.EndpointsGroups;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Utils;
using safefy_api_core.Interfaces;

namespace safefy_api.Endpoints.Merchants.CreateMerchant;

public sealed class CreateMerchantEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog
) : Endpoint<CreateMerchantRequest, CreateMerchantResponse>
{
    public override void Configure()
    {
        Post("");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateMerchantRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateMerchantResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var user = await dbContext.Users.OrderBy(u => u.Id).FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
        if (user == null)
        {
            await Send.ResponseAsync(new CreateMerchantResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        if (!user.EmailVerified)
        {
            await Send.ResponseAsync(new CreateMerchantResponse
            {
                Error = new("Email não verificado.")
            }, 403, ct);
            return;
        }

        var merchant = new Merchant
        {
            UserId = userId.Value,
            Name = req.Name,
            Status = MerchantStatus.Draft,
            KycStatus = MerchantKycStatus.Draft,
            OnboardingStep = MerchantOnboardingStep.BasicInfo
        };

        dbContext.Merchants.Add(merchant);
        await dbContext.SaveChangesAsync(ct);

        // Create empty KYC record
        var merchantKyc = new MerchantKyc
        {
            MerchantId = merchant.Id
        };

        dbContext.MerchantKycs.Add(merchantKyc);
        await dbContext.SaveChangesAsync(ct);

        merchant.MerchantKyc = merchantKyc;

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.MerchantCreated, Status = SecurityLogStatus.Success, UserId = userId, Details = $"Merchant created: {merchant.Id}" });

        await Send.CreatedAtAsync<CreateMerchantEndpoint>(null, new CreateMerchantResponse
        {
            Data = MerchantMapper.ToData(merchant)
        }, cancellation: ct);
    }
}
