using FastEndpoints;
using safefy_api_core.Interfaces;
using safefy_api_core.Utils;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Mappers;

namespace safefy_api_payment.Endpoints.Internal.Cashouts.Create;

public sealed class CreateCashoutInternalEndpoint(
    ICashoutService cashoutService,
    IEnvironmentProvider environmentProvider
) : Endpoint<CreateCashoutInternalRequest, CreateCashoutInternalResponse>
{
    public override void Configure()
    {
        Post("");
        Group<InternalCashoutGroup>();
    }

    public override async Task HandleAsync(CreateCashoutInternalRequest req, CancellationToken ct)
    {
        var result = await cashoutService.CreateInternalAsync(new CreateCashoutInternalInput
        {
            MerchantId = req.MerchantId,
            UserId = req.UserId,
            Amount = req.Amount,
            PayoutAccountId = req.PayoutAccountId,
            MerchantAcquirerId = req.MerchantAcquirerId,
            IpAddress = req.IpAddress,
            Location = req.Location,
            Environment = environmentProvider.CurrentEnvironment,
            ConsolidateAllAcquirers = req.ConsolidateAllAcquirers
        }, ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new CreateCashoutInternalResponse
            {
                Success = false,
                ErrorMessage = result.ErrorMessage,
                ErrorCode = result.ErrorCode
            }, result.StatusCode, ct);
            return;
        }

        var payout = result.Payout!;
        var payoutAccount = result.PayoutAccount!;

        var response = new CreateCashoutInternalResponse
        {
            Success = true,
            CashoutId = payout.Id,
            Status = payout.Status.ToString(),
            Amount = payout.Amount,
            PlatformFee = payout.PlatformFee,
            NetAmount = payout.NetAmount,
            PixKey = MaskUtils.MaskPixKey(payoutAccount.PixKey, payoutAccount.PixKeyType.ToString()),
            PixKeyType = payoutAccount.PixKeyType.ToString(),
            RequiresApproval = result.RequiresApproval
        };

        if (result.Payouts is { Count: > 0 })
        {
            response.Amount = result.Payouts.Sum(p => p.Amount);
            response.PlatformFee = result.Payouts.Sum(p => p.PlatformFee);
            response.NetAmount = result.Payouts.Sum(p => p.NetAmount);
            response.Payouts = result.Payouts.Select(p => new CreateCashoutInternalPayoutItem
            {
                Id = p.Id,
                Status = p.Status.ToString(),
                Amount = p.Amount,
                PlatformFee = p.PlatformFee,
                NetAmount = p.NetAmount
            }).ToList();
        }

        await Send.ResponseAsync(response, result.StatusCode, ct);
    }
}
