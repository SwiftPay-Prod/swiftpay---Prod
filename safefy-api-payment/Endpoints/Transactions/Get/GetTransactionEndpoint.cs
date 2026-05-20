using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Documentation;
using safefy_api_payment.Mappers;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Transactions.Get;

public sealed class GetTransactionEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<GetTransactionRequest, GetTransactionResponse>
{
    public override void Configure()
    {
        Get("{transactionId:guid}");
        Group<TransactionsGroup>();
        Description(d => d
            .Produces<GetTransactionResponse>(200, "application/json")
            .Produces<GetTransactionResponse>(401, "application/json")
            .Produces<GetTransactionResponse>(404, "application/json")
            .WithSummary("Obter transação")
            .WithDescription(EndpointDescriptions.GetTransactionDescription));
    }

    public override async Task HandleAsync(GetTransactionRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new GetTransactionResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, ct);
            return;
        }

        var payment = await dbContext.Payments
            .AsNoTracking()
            .Include(p => p.PaymentPix)
            .Include(p => p.PaymentBoleto)
            .Include(p => p.Customer)
            .FirstOrDefaultAsync(p => 
                p.Id == req.TransactionId && 
                p.MerchantId == merchantId &&
                !p.SuppressMerchantVisibility, ct);

        if (payment == null)
        {
            await Send.ResponseAsync(new GetTransactionResponse
            {
                Error = new("Transação não encontrada.")
            }, 404, ct);
            return;
        }

        var response = new GetTransactionResponse
        {
            Data = TransactionMapper.ToDetailData(payment, payment.PaymentPix, payment.PaymentBoleto)
        };

        await Send.OkAsync(response, ct);
    }
}
