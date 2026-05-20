using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Interfaces;
using safefy_api.Models.PaymentApi;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Cashouts.CreateCashout;

public sealed class CreateCashoutEndpoint(
    PrimaryDbContext dbContext,
    IPaymentApiClient paymentApiClient,
    IApiLogService apiLogService,
    IGeoLocationService geoLocationService,
    IEnvironmentProvider environmentProvider
) : Endpoint<CreateCashoutRequest, CreateCashoutResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/cashouts");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateCashoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateCashoutResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantKyc)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new CreateCashoutResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        var result = await paymentApiClient.CreateCashoutAsync(new CreateCashoutApiInput
        {
            MerchantId = req.MerchantId,
            UserId = userId.Value,
            Amount = req.Amount,
            PayoutAccountId = req.PayoutAccountId,
            MerchantAcquirerId = req.MerchantAcquirerId,
            IpAddress = ipAddress,
            Location = location,
            Environment = environmentProvider.CurrentEnvironment,
            ConsolidateAllAcquirers = req.ConsolidateAllAcquirers
        }, ct);

        if (!result.Success)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.CreateCashout,
                Status = ApiLogStatus.Failed,
                MerchantId = req.MerchantId,
                MerchantName = merchant.Name,
                MerchantDocument = merchant.MerchantKyc?.DocumentNumber,
                HttpMethod = HttpContext.Request.Method,
                Endpoint = HttpContext.Request.Path,
                StatusCode = 400,
                Details = $"Falha ao solicitar saque: {result.ErrorMessage}",
                ResourceType = ApiLogResourceType.Payout
            });

            await Send.ResponseAsync(new CreateCashoutResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao processar saque.")
            }, 400, ct);
            return;
        }

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.CreateCashout,
            Status = ApiLogStatus.Success,
            MerchantId = req.MerchantId,
            MerchantName = merchant.Name,
            MerchantDocument = merchant.MerchantKyc?.DocumentNumber,
            HttpMethod = HttpContext.Request.Method,
            Endpoint = HttpContext.Request.Path,
            StatusCode = 201,
            Details = $"Saque de R$ {req.Amount / 100m:N2} solicitado para merchant {merchant.Id}",
            ResourceId = result.CashoutId,
            ResourceType = ApiLogResourceType.Payout
        });

        var message = result.RequiresApproval
            ? "Saque solicitado com sucesso! Aguarde a aprovação para receber o valor."
            : GetStatusMessage(result.Status, result.NetAmount ?? 0);

        var data = new CreateCashoutData
        {
            Id = result.CashoutId!.Value,
            Amount = result.Amount ?? 0,
            PlatformFee = result.PlatformFee ?? 0,
            NetAmount = result.NetAmount ?? 0,
            PixKey = result.PixKey ?? "",
            PixKeyType = result.PixKeyType ?? "",
            Status = result.Status ?? PayoutStatus.Pending,
            RequiresApproval = result.RequiresApproval
        };

        if (result.Payouts is { Count: > 0 })
        {
            data.Payouts = result.Payouts.Select(p => new CreateCashoutPayoutItem
            {
                Id = p.Id,
                Amount = p.Amount,
                PlatformFee = p.PlatformFee,
                NetAmount = p.NetAmount,
                Status = p.Status
            }).ToList();
        }

        await Send.ResponseAsync(new CreateCashoutResponse
        {
            Data = data,
            Message = message
        }, 201, ct);
    }

    private static string GetStatusMessage(PayoutStatus? status, long netAmount)
    {
        return status switch
        {
            PayoutStatus.Completed => $"Saque de R$ {netAmount / 100m:N2} processado com sucesso! O valor já foi transferido.",
            PayoutStatus.Processing => $"Saque de R$ {netAmount / 100m:N2} está sendo processado. Você receberá em breve.",
            PayoutStatus.Failed => "Houve um erro ao processar o saque. O valor foi devolvido ao seu saldo.",
            _ => $"Saque de R$ {netAmount / 100m:N2} solicitado com sucesso!"
        };
    }
}
