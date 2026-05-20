using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Merchants.Customers.UpdateCustomer;

public sealed class UpdateCustomerEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdateCustomerRequest, UpdateCustomerResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/customers/{customerId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateCustomerRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateCustomerResponse
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
            await Send.ResponseAsync(new UpdateCustomerResponse
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
            await Send.ResponseAsync(new UpdateCustomerResponse
            {
                Error = new("Cliente não encontrado.")
            }, 404, ct);
            return;
        }

        if (!string.IsNullOrWhiteSpace(req.ExternalId) && req.ExternalId != customer.ExternalId)
        {
            var existingByExternalId = await dbContext.Customers
                .OrderBy(c => c.Id)
                .FirstOrDefaultAsync(c => c.MerchantId == req.MerchantId && c.ExternalId == req.ExternalId && c.Id != req.CustomerId, ct);

            if (existingByExternalId != null)
            {
                await Send.ResponseAsync(new UpdateCustomerResponse
                {
                    Error = new("Já existe um cliente com este ID externo.")
                }, 400, ct);
                return;
            }
        }

        if (req.ExternalId != null) customer.ExternalId = req.ExternalId;
        if (!string.IsNullOrEmpty(req.Name)) customer.Name = req.Name;
        if (!string.IsNullOrEmpty(req.Email)) customer.Email = req.Email;
        if (req.Document != null) customer.Document = req.Document;
        if (req.DocumentType.HasValue) customer.DocumentType = req.DocumentType.Value;
        if (req.Phone != null) customer.Phone = req.Phone;
        if (req.Status.HasValue) customer.Status = req.Status.Value;
        if (req.Metadata != null) customer.Metadata = req.Metadata;
        
        // Address fields
        if (req.AddressStreet != null) customer.AddressStreet = req.AddressStreet;
        if (req.AddressNumber != null) customer.AddressNumber = req.AddressNumber;
        if (req.AddressComplement != null) customer.AddressComplement = req.AddressComplement;
        if (req.AddressNeighborhood != null) customer.AddressNeighborhood = req.AddressNeighborhood;
        if (req.AddressCity != null) customer.AddressCity = req.AddressCity;
        if (req.AddressState != null) customer.AddressState = req.AddressState;
        if (req.AddressPostalCode != null) customer.AddressPostalCode = req.AddressPostalCode;
        if (req.AddressCountry != null) customer.AddressCountry = req.AddressCountry;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateCustomerResponse
        {
            Data = CustomerMapper.ToData(customer),
            Message = "Cliente atualizado com sucesso!"
        }, ct);
    }
}
