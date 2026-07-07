using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Interfaces;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.Customers.CreateCustomer;

public sealed class CreateCustomerEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider
) : Endpoint<CreateCustomerRequest, CreateCustomerResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/customers");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateCustomerRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateCustomerResponse
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
            await Send.ResponseAsync(new CreateCustomerResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (!string.IsNullOrWhiteSpace(req.ExternalId))
        {
            var existingByExternalId = await dbContext.Customers
                .OrderBy(c => c.Id)
                .FirstOrDefaultAsync(c => c.MerchantId == req.MerchantId && c.ExternalId == req.ExternalId, ct);

            if (existingByExternalId != null)
            {
                await Send.ResponseAsync(new CreateCustomerResponse
                {
                    Error = new("Já existe um cliente com este ID externo.")
                }, 400, ct);
                return;
            }
        }

        var customer = new Customer
        {
            Id = Guid.CreateVersion7(),
            MerchantId = req.MerchantId,
            ExternalId = req.ExternalId,
            Name = req.Name,
            Email = req.Email,
            Document = req.Document,
            DocumentType = req.DocumentType,
            Phone = req.Phone,
            Metadata = req.Metadata,
            Status = CustomerStatus.Active,
            Environment = environmentProvider.CurrentEnvironment,
            AddressStreet = req.AddressStreet,
            AddressNumber = req.AddressNumber,
            AddressComplement = req.AddressComplement,
            AddressNeighborhood = req.AddressNeighborhood,
            AddressCity = req.AddressCity,
            AddressState = req.AddressState,
            AddressPostalCode = req.AddressPostalCode,
            AddressCountry = req.AddressCountry
        };

        dbContext.Customers.Add(customer);
        await dbContext.SaveChangesAsync(ct);

        await Send.CreatedAtAsync<CreateCustomerEndpoint>(null, new CreateCustomerResponse
        {
            Data = CustomerMapper.ToData(customer),
            Message = "Cliente criado com sucesso!"
        }, cancellation: ct);
    }
}
