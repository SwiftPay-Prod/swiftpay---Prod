using FastEndpoints;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Documentation;

namespace safefy_api_payment.Endpoints.Cashouts.List;

public sealed class ListCashoutsEndpoint(
    ICashoutService cashoutService
) : Endpoint<ListCashoutsRequest, ListCashoutsResponse>
{
    public override void Configure()
    {
        Get("");
        Group<CashoutGroup>();
        Description(d => d
            .Produces<ListCashoutsResponse>(200, "application/json")
            .Produces<ListCashoutsResponse>(401, "application/json")
            .WithSummary("Listar saques")
            .WithDescription(EndpointDescriptions.Cashouts.List));
    }

    public override async Task HandleAsync(ListCashoutsRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new ListCashoutsResponse(), 401, ct);
            return;
        }

        var input = new ListCashoutInput
        {
            MerchantId = merchantId.Value,
            Environment = environment.Value,
            Status = req.Status,
            StartDate = req.StartDate,
            EndDate = req.EndDate,
            Page = req.Page,
            PageSize = req.PageSize
        };

        var result = await cashoutService.ListAsync(input, ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new ListCashoutsResponse(), result.StatusCode, ct);
            return;
        }

        var response = new ListCashoutsResponse
        {
            Items = result.Items.Select(i => new CashoutListItemData
            {
                Id = i.Id,
                Amount = i.Amount,
                Fee = i.Fee,
                NetAmount = i.NetAmount,
                Status = i.Status,
                PixKeyType = i.PixKeyType,
                PixKey = i.PixKey,
                EndToEndId = i.EndToEndId,
                FailureReason = i.FailureReason,
                RequestedAt = i.RequestedAt,
                CompletedAt = i.CompletedAt,
                CreatedAt = i.CreatedAt
            }),
            TotalItems = result.TotalItems,
            Page = result.Page,
            PageSize = result.PageSize
        };

        await Send.ResponseAsync(response, 200, ct);
    }
}
