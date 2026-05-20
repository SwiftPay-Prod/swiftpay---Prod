using FastEndpoints;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Documentation;
using safefy_api_payment.Models.Transactions;
using safefy_api_payment.Mappers;
using safefy_api_payment.Endpoints.Models;
using safefy_api_core.Models.Enum;

namespace safefy_api_payment.Endpoints.Transactions.Create;

public sealed class CreateTransactionEndpoint(
    ITransactionService transactionService
) : Endpoint<CreateTransactionRequest, CreateTransactionResponse>
{
    public override void Configure()
    {
        Post("");
        Group<TransactionsGroup>();
        Description(d => d
            .Produces<CreateTransactionResponse>(201, "application/json")
            .Produces<CreateTransactionResponse>(400, "application/json")
            .Produces<CreateTransactionResponse>(401, "application/json")
            .Produces<CreateTransactionResponse>(500, "application/json")
            .WithSummary("Criar transação")
            .WithDescription(EndpointDescriptions.CreateTransactionDescription));
    }

    public override async Task HandleAsync(CreateTransactionRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        if (merchantId == null)
        {
            await Send.ResponseAsync(new CreateTransactionResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, ct);
            return;
        }

        var input = new CreateTransactionInput
        {
            MerchantId = merchantId.Value,
            RequestOrigin = PaymentEndpointUtils.GetRequestOrigin(HttpContext),
            RequestSource = PaymentRequestSource.Api,
            Method = req.Method,
            Amount = req.Amount,
            Currency = req.Currency,
            Description = req.Description,
            ExternalId = req.ExternalId,
            CustomerId = req.CustomerId,
            CallbackUrl = req.CallbackUrl,
            Metadata = req.Metadata,
            ExpirationMinutes = req.PixExpirationMinutes,
            CustomerName = req.CustomerName,
            CustomerDocument = req.CustomerDocument,
            CustomerEmail = req.CustomerEmail,
            CustomerPhone = req.CustomerPhone,
            CardNumber = req.CardNumber,
            CardHolderName = req.CardHolderName,
            CardExpirationMonth = req.CardExpirationMonth,
            CardExpirationYear = req.CardExpirationYear,
            Installments = req.Installments ?? 1,
            CardCvv = req.CardCvv,
            BoletoDueDate = req.BoletoDueDate,
            BoletoInstructions = req.BoletoInstructions
        };

        var result = await transactionService.CreateAsync(input);

        if (!result.Success || result.Payment == null)
        {
            await Send.ResponseAsync(new CreateTransactionResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao criar transação.")
            }, result.StatusCode, ct);
            return;
        }

        var response = new CreateTransactionResponse
        {
            Data = TransactionMapper.ToData(
                result.Payment,
                result.PaymentPix,
                result.Payment.PaymentBoleto)
        };

        await Send.ResponseAsync(response, result.StatusCode, ct);
    }
}
