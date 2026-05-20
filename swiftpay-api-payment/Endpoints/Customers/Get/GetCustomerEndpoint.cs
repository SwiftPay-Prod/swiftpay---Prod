using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_payment.Documentation;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_core.Constants;
using safefy_api_payment.Mappers;

namespace safefy_api_payment.Endpoints.Customers.Get;

public sealed class GetCustomerEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<GetCustomerRequest, GetCustomerResponse>
{
    public override void Configure()
    {
        Get("{id:guid}");
        Group<CustomersGroup>();
        Description(d => d
            .WithName("BuscarCliente")
            .WithSummary("Busca um cliente pelo ID")
            .WithDescription(EndpointDescriptions.Customers.Get)
            .Produces<GetCustomerResponse>(200, "application/json")
            .Produces<BaseResponse>(401, "application/json")
            .Produces<BaseResponse>(404, "application/json"));
    }

    public override async Task HandleAsync(GetCustomerRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new GetCustomerResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, cancellation: ct);
            return;
        }

        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(c =>
                c.Id == req.Id &&
                c.MerchantId == merchantId, ct);

        if (customer == null)
        {
            await Send.ResponseAsync(new GetCustomerResponse
            {
                Error = new ApiErrorResponse("Cliente não encontrado.", PaymentApiErrorCodes.CustomerNotFound)
            }, 404, cancellation: ct);
            return;
        }

        await Send.ResponseAsync(new GetCustomerResponse
        {
            Data = CustomerMapper.ToData(customer)
        }, 200, cancellation: ct);
    }
}

