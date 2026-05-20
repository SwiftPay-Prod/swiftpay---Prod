using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_payment.Documentation;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Constants;
using safefy_api_core.Utils;
using safefy_api_payment.Mappers;

namespace safefy_api_payment.Endpoints.Customers.Create;

public sealed class CreateCustomerEndpoint(
    PrimaryDbContext dbContext,
    IApiLogService apiLogService
) : Endpoint<CreateCustomerRequest, CreateCustomerResponse>
{
    public override void Configure()
    {
        Post("");
        Group<CustomersGroup>();
        Description(d => d
            .WithName("CriarCliente")
            .WithSummary("Cria um novo cliente")
            .WithDescription(EndpointDescriptions.Customers.Create)
            .Produces<CreateCustomerResponse>(201, "application/json")
            .Produces<BaseResponse>(400, "application/json")
            .Produces<BaseResponse>(401, "application/json")
            .Produces<BaseResponse>(409, "application/json"));
    }

    public override async Task HandleAsync(CreateCustomerRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new CreateCustomerResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, cancellation: ct);
            return;
        }

        // Check for duplicate external_id
        if (!string.IsNullOrEmpty(req.ExternalId))
        {
            var existingCustomer = await dbContext.Customers
                .FirstOrDefaultAsync(c =>
                c.MerchantId == merchantId &&
                c.ExternalId == req.ExternalId, ct);

            if (existingCustomer != null)
            {
                await apiLogService.LogAsync(new ApiLogInput
                {
                    Action = ApiLogAction.CreateCustomer,
                    Status = ApiLogStatus.Failed,
                    ResourceId = existingCustomer.Id,
                    ResourceType = ApiLogResourceType.Customer,
                    StatusCode = 409,
                    Details = "Duplicate external_id"
                });
                await Send.ResponseAsync(new CreateCustomerResponse
                {
                    Error = new ApiErrorResponse("Já existe um cliente com este external_id.", PaymentApiErrorCodes.DuplicateExternalId)
                }, 409, cancellation: ct);
                return;
            }
        }

        if (!string.IsNullOrEmpty(req.Document))
        {
            var existingCustomerByDocument = await dbContext.Customers
                .FirstOrDefaultAsync(c =>
                c.MerchantId == merchantId &&
                c.Document == req.Document, ct);

            if (existingCustomerByDocument != null)
            {
                await apiLogService.LogAsync(new ApiLogInput
                {
                    Action = ApiLogAction.CreateCustomer,
                    Status = ApiLogStatus.Failed,
                    ResourceId = existingCustomerByDocument.Id,
                    ResourceType = ApiLogResourceType.Customer,
                    StatusCode = 409,
                    Details = "Duplicate document"
                });
                await Send.ResponseAsync(new CreateCustomerResponse
                {
                    Error = new ApiErrorResponse("Já existe um cliente com este CPF/CNPJ.", PaymentApiErrorCodes.DuplicateDocument)
                }, 409, cancellation: ct);
                return;
            }
        }

        var customer = new Customer
        {
            Id = Guid.CreateVersion7(),
            MerchantId = merchantId.Value,
            ExternalId = req.ExternalId,
            Environment = environment.Value,
            Name = req.Name,
            Email = req.Email.ToLower().Trim(),
            Document = req.Document,
            DocumentType = req.DocumentType,
            Phone = SanitizeUtils.SanitizePhone(req.Phone),
            Status = CustomerStatus.Active,
            Metadata = req.Metadata,
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

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.CreateCustomer,
            Status = ApiLogStatus.Success,
            ResourceId = customer.Id,
            ResourceType = ApiLogResourceType.Customer,
            StatusCode = 201
        });

        await Send.ResponseAsync(new CreateCustomerResponse
        {
            Data = CustomerMapper.ToData(customer)
        }, 201, cancellation: ct);
    }
}
