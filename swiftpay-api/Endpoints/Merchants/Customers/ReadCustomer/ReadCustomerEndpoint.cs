using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.Customers.ReadCustomer;

public sealed class ReadCustomerEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadCustomerRequest, ReadCustomerResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/customers/{customerId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadCustomerRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadCustomerResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var isAdmin = EndpointUtils.IsAdmin(User);
        var merchant = isAdmin
            ? await dbContext.Merchants.OrderBy(m => m.Id).FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct)
            : await dbContext.Merchants.OrderBy(m => m.Id).FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadCustomerResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var customer = await dbContext.Customers
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CustomerId && c.MerchantId == req.MerchantId, ct);

        if (customer == null)
        {
            await Send.ResponseAsync(new ReadCustomerResponse
            {
                Error = new("Cliente não encontrado.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadCustomerResponse
        {
            Data = CustomerMapper.ToData(customer)
        }, ct);
    }
}
