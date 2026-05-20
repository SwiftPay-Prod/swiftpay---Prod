using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_payment.Documentation;
using safefy_api_payment.Endpoints.Customers.Create;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Models;
using safefy_api_core.Utils;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Interfaces;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Constants;
using safefy_api_payment.Mappers;

namespace safefy_api_payment.Endpoints.Customers.Update;

public sealed class UpdateCustomerEndpoint(
    PrimaryDbContext dbContext,
    IApiLogService apiLogService
) : Endpoint<UpdateCustomerRequest, UpdateCustomerResponse>
{
    public override void Configure()
    {
        Patch("{id:guid}");
        Group<CustomersGroup>();
        Description(d => d
            .WithName("AtualizarCliente")
            .WithSummary("Atualiza um cliente")
            .WithDescription(EndpointDescriptions.Customers.Update)
            .Produces<UpdateCustomerResponse>(200, "application/json")
            .Produces<BaseResponse>(400, "application/json")
            .Produces<BaseResponse>(401, "application/json")
            .Produces<BaseResponse>(404, "application/json"));
    }

    public override async Task HandleAsync(UpdateCustomerRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        if (merchantId == null)
        {
            await Send.ResponseAsync(new UpdateCustomerResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, cancellation: ct);
            return;
        }

        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(c => c.Id == req.Id && c.MerchantId == merchantId, ct);

        if (customer == null)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.UpdateCustomer,
                Status = ApiLogStatus.Failed,
                ResourceId = req.Id,
                ResourceType = ApiLogResourceType.Customer,
                StatusCode = 404,
                Details = "Cliente não encontrado"
            });
            await Send.ResponseAsync(new UpdateCustomerResponse
            {
                Error = new ApiErrorResponse("Cliente não encontrado.", PaymentApiErrorCodes.CustomerNotFound)
            }, 404, cancellation: ct);
            return;
        }

        // Update only provided fields
        if (!string.IsNullOrEmpty(req.Name))
            customer.Name = req.Name;

        if (!string.IsNullOrEmpty(req.Email))
            customer.Email = req.Email.ToLower().Trim();

        if (req.Document != null)
            customer.Document = req.Document;

        if (req.DocumentType.HasValue)
            customer.DocumentType = req.DocumentType;

        if (req.Phone != null)
            customer.Phone = SanitizeUtils.SanitizePhone(req.Phone);

        if (req.Status.HasValue)
            customer.Status = req.Status.Value;

        if (req.Metadata != null)
            customer.Metadata = req.Metadata;

        // Update address fields
        if (req.AddressStreet != null)
            customer.AddressStreet = req.AddressStreet;

        if (req.AddressNumber != null)
            customer.AddressNumber = req.AddressNumber;

        if (req.AddressComplement != null)
            customer.AddressComplement = req.AddressComplement;

        if (req.AddressNeighborhood != null)
            customer.AddressNeighborhood = req.AddressNeighborhood;

        if (req.AddressCity != null)
            customer.AddressCity = req.AddressCity;

        if (req.AddressState != null)
            customer.AddressState = req.AddressState;

        if (req.AddressPostalCode != null)
            customer.AddressPostalCode = req.AddressPostalCode;

        if (req.AddressCountry != null)
            customer.AddressCountry = req.AddressCountry;

        await dbContext.SaveChangesAsync(ct);

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.UpdateCustomer,
            Status = ApiLogStatus.Success,
            ResourceId = customer.Id,
            ResourceType = ApiLogResourceType.Customer,
            StatusCode = 200
        });

        await Send.ResponseAsync(new UpdateCustomerResponse
        {
            Data = CustomerMapper.ToData(customer)
        }, 200, cancellation: ct);
    }
}

