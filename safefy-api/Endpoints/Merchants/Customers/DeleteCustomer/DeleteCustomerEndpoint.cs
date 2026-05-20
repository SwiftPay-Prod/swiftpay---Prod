using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Customers.DeleteCustomer;

public sealed class DeleteCustomerEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<DeleteCustomerRequest, DeleteCustomerResponse>
{
    public override void Configure()
    {
        Delete("{merchantId:guid}/customers/{customerId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(DeleteCustomerRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteCustomerResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new DeleteCustomerResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var customer = await dbContext.Customers
            .Include(c => c.Payments)
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CustomerId && c.MerchantId == req.MerchantId, ct);

        if (customer == null)
        {
            await Send.ResponseAsync(new DeleteCustomerResponse
            {
                Error = new("Cliente não encontrado.")
            }, 404, ct);
            return;
        }

        if (customer.Payments.Count > 0)
        {
            await Send.ResponseAsync(new DeleteCustomerResponse
            {
                Error = new("Não é possível excluir um cliente com pagamentos associados.")
            }, 400, ct);
            return;
        }

        dbContext.Customers.Remove(customer);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new DeleteCustomerResponse
        {
            Message = "Cliente excluído com sucesso!"
        }, ct);
    }
}
