using FastEndpoints;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Mappers;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Documentation;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Endpoints.Cashouts.Create;

public sealed class CreateCashoutEndpoint(
    ICashoutService cashoutService,
    IApiLogService apiLogService
) : Endpoint<CreateCashoutRequest, CreateCashoutResponse>
{
    public override void Configure()
    {
        Post("");
        Group<CashoutGroup>();
        Description(d => d
            .Produces<CreateCashoutResponse>(201, "application/json")
            .Produces<CreateCashoutResponse>(400, "application/json")
            .Produces<CreateCashoutResponse>(401, "application/json")
            .Produces<CreateCashoutResponse>(500, "application/json")
            .WithSummary("Solicitar saque")
            .WithDescription(EndpointDescriptions.Cashouts.Create));
    }

    public override async Task HandleAsync(CreateCashoutRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new CreateCashoutResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, ct);
            return;
        }

        var input = new CreateCashoutInput
        {
            MerchantId = merchantId.Value,
            Environment = environment.Value,
            Amount = req.Amount,
            PayoutAccountId = req.PayoutAccountId,
            PixKey = req.PixKey,
            PixKeyType = req.PixKeyType,
            ExternalId = req.ExternalId,
            CallbackUrl = req.CallbackUrl,
            IpAddress = PaymentEndpointUtils.GetIpAddress(HttpContext)
        };

        var result = await cashoutService.CreateAsync(input, ct);

        if (!result.Success || result.Payout == null)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.CreateCashout,
                Status = ApiLogStatus.Failed,
                MerchantId = merchantId,
                ResourceType = ApiLogResourceType.Payout,
                StatusCode = result.StatusCode,
                Details = result.ErrorMessage,
                RequestBody = AcquirerApiLogUtils.BuildRequestBody(
                    Guid.Empty,
                    "Cashout",
                    [],
                    "CreateCashout",
                    new
                    {
                        req.Amount,
                        req.PayoutAccountId,
                        req.PixKeyType,
                        req.ExternalId,
                        req.CallbackUrl,
                        environment
                    }),
                ResponseBody = new System.Text.Json.Nodes.JsonObject
                {
                    ["statusCode"] = result.StatusCode,
                    ["errorCode"] = result.ErrorCode,
                    ["errorMessage"] = result.ErrorMessage
                }.ToJsonString()
            });

            await Send.ResponseAsync(new CreateCashoutResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao criar saque.", result.ErrorCode)
            }, result.StatusCode, ct);
            return;
        }

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.CreateCashout,
            Status = ApiLogStatus.Success,
            ResourceId = result.Payout.Id,
            ResourceType = ApiLogResourceType.Payout,
            StatusCode = 201
        });

        var response = new CreateCashoutResponse
        {
            Data = CashoutMapper.ToData(result.Payout, result.PayoutAccount),
            Message = result.RequiresApproval 
                ? "Saque solicitado com sucesso. Aguardando aprovação."
                : GetStatusMessage(result.Payout.Status)
        };

        await Send.ResponseAsync(response, 201, ct);
    }

    private static string GetStatusMessage(swiftpay_api_core.Models.Database.PayoutStatus status)
    {
        return status switch
        {
            swiftpay_api_core.Models.Database.PayoutStatus.Completed => "Saque processado com sucesso!",
            swiftpay_api_core.Models.Database.PayoutStatus.Processing => "Saque em processamento. Você receberá em breve.",
            swiftpay_api_core.Models.Database.PayoutStatus.Failed => "Houve um erro ao processar o saque. O valor foi devolvido ao seu saldo.",
            _ => "Saque solicitado com sucesso!"
        };
    }
}
