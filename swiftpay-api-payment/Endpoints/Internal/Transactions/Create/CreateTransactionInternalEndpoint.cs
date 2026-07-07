using FastEndpoints;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Models.Transactions;

namespace swiftpay_api_payment.Endpoints.Internal.Transactions.Create;

public sealed class CreateTransactionInternalEndpoint(
    ITransactionService transactionService
) : Endpoint<CreateTransactionInternalRequest, CreateTransactionInternalResponse>
{
    public override void Configure()
    {
        Post("");
        Group<InternalTransactionsGroup>();
    }

    public override async Task HandleAsync(CreateTransactionInternalRequest req, CancellationToken ct)
    {
        var input = new CreateTransactionInput
        {
            MerchantId = req.MerchantId,
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
            await Send.ResponseAsync(new CreateTransactionInternalResponse
            {
                Success = false,
                ErrorMessage = result.ErrorMessage,
                ErrorCode = result.ErrorCode
            }, result.StatusCode, ct);
            return;
        }

        var payment = result.Payment;
        var paymentPix = result.PaymentPix;
        var paymentBoleto = result.PaymentBoleto;

        var response = new CreateTransactionInternalResponse
        {
            Success = true,
            TransactionId = payment.Id,
            ExternalId = payment.ExternalId,
            Method = payment.Method.ToString(),
            Amount = payment.Amount,
            Fee = payment.PlatformFee + payment.CheckoutTemplateFee,
            NetAmount = payment.NetAmount,
            Currency = payment.Currency.ToString(),
            Status = payment.Status.ToString(),
            Description = payment.Description,
            Environment = payment.Environment.ToString(),
            ExpiresAt = payment.ExpiresAt,
            CreatedAt = payment.CreatedAt,
            CustomerId = payment.CustomerId
        };

        if (paymentPix != null)
        {
            response.Pix = new CreateTransactionInternalPixData
            {
                TxId = paymentPix.TxId,
                QrCode = paymentPix.QrCodeBase64,
                CopyAndPaste = paymentPix.CopyAndPaste,
                ExpiresAt = paymentPix.ExpiresAt
            };
        }

        if (paymentBoleto != null)
        {
            response.Boleto = new CreateTransactionInternalBoletoData
            {
                Barcode = paymentBoleto.Barcode,
                DigitableLine = paymentBoleto.DigitableLine,
                PdfUrl = paymentBoleto.PdfUrl,
                DueDate = paymentBoleto.DueDate
            };
        }

        await Send.ResponseAsync(response, result.StatusCode, ct);
    }
}
