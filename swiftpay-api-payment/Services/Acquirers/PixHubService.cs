using System.Diagnostics;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Domain;
using swiftpay_api_payment.Clients.PixHub;
using swiftpay_api_payment.Clients.PixHub.Models;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Services.Acquirers;

public sealed class PixHubService(
    IPixHubClient pixHubClient,
    ILogger<PixHubService> logger) : IAcquirerService
{
    public AcquirerType AcquirerType => AcquirerType.PixHub;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        var apiKey = config.GetCredential("apiKey") ?? config.GetCredential("publicKey");
        var apiSecret = config.GetCredential("apiSecret") ?? config.GetCredential("secretKey");

        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
        {
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Credenciais PixHub não configuradas."
            };
        }

        var expiresAt = DateTime.UtcNow.AddSeconds(request.ExpirationMinutes * 60);

        if (!TaxId.TryParse(request.CustomerDocument, out var taxId))
        {
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Documento (CPF/CNPJ) do cliente inválido ou ausente para processamento PIX."
            };
        }

        var customerName = string.IsNullOrWhiteSpace(request.CustomerName) ? "Cliente" : request.CustomerName.Trim();
        var customerEmail = string.IsNullOrWhiteSpace(request.CustomerEmail) ? "cliente@example.com" : request.CustomerEmail.Trim();
        var customerPhone = string.IsNullOrWhiteSpace(request.CustomerPhone)
            ? "00000000000"
            : new string(request.CustomerPhone.Where(char.IsDigit).ToArray());

        var pixRequest = new PixHubCreatePixRequest
        {
            AmountInCents = request.Amount,
            Description = request.Description ?? "Pagamento PIX",
            PostbackUrl = AcquirerWebhookUtils.BuildWebhookUrl(config.PlatformBaseUrl, AcquirerType.PixHub),
            Customer = new PixHubCustomer
            {
                Name = customerName,
                Email = customerEmail,
                Phone = customerPhone,
                DocumentType = taxId.Type == TaxIdType.Cpf ? "cpf" : "cnpj",
                Document = taxId.Digits
            }
        };

        var stopwatch = Stopwatch.StartNew();
        var response = await pixHubClient.CreatePixQrCodeAsync(apiKey, apiSecret, pixRequest);
        stopwatch.Stop();

        if (!response.Success || response.Data?.Data?.Pix == null || string.IsNullOrEmpty(response.Data.Data.Id))
        {
            logger.LogWarning("PixHub returned error generating PIX: {Error}", response.ErrorMessage);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Falha ao gerar PIX junto ao PixHub. Tente novamente."
            };
        }

        var transactionData = response.Data.Data;

        return new PixGenerationResult
        {
            Success = true,
            AcquirerId = config.AcquirerId,
            AcquirerPaymentId = transactionData.Id,
            TxId = transactionData.Id,
            QrCode = transactionData.Pix.QrCode ?? transactionData.Pix.Emv,
            CopyAndPaste = transactionData.Pix.Emv,
            ExpiresAt = expiresAt
        };
    }

    public async Task<PixStatusResult> GetPixStatusAsync(AcquirerConfig config, string txId)
    {
        var apiKey = config.GetCredential("apiKey") ?? config.GetCredential("publicKey");
        var apiSecret = config.GetCredential("apiSecret") ?? config.GetCredential("secretKey");

        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
        {
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Credenciais PixHub não configuradas."
            };
        }

        var response = await pixHubClient.GetPixQrCodeAsync(apiKey, apiSecret, txId);
        if (!response.Success || response.Data?.Data == null)
        {
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = response.ErrorMessage ?? "Falha ao consultar status da transação PixHub."
            };
        }

        var transaction = response.Data.Data;
        var status = PixHubStatusConverter.ConvertTransactionStatus(transaction.Status);

        return new PixStatusResult
        {
            Success = true,
            Status = status
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        var apiKey = config.GetCredential("apiKey") ?? config.GetCredential("publicKey");
        var apiSecret = config.GetCredential("apiSecret") ?? config.GetCredential("secretKey");

        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
        {
            logger.LogWarning("PixHub withdrawal credentials missing for PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Credenciais PixHub não configuradas."
            };
        }

        var transferRequest = new PixHubTransferRequest
        {
            PixKey = request.PixKey,
            AmountInCents = request.Amount,
            Description = "Saque Plataforma",
            PostbackUrl = AcquirerWebhookUtils.BuildWebhookUrl(config.PlatformBaseUrl, AcquirerType.PixHub)
        };

        var idempotencyKey = request.PayoutId.ToString("N");
        var stopwatch = Stopwatch.StartNew();
        var response = await pixHubClient.CreateTransferAsync(apiKey, apiSecret, idempotencyKey, transferRequest);
        stopwatch.Stop();

        if (!response.Success || response.Data?.Data == null || string.IsNullOrEmpty(response.Data.Data.Id))
        {
            logger.LogWarning("PixHub returned error on withdraw: {Error}", response.ErrorMessage);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = response.ErrorMessage ?? "Falha ao solicitar saque PixHub."
            };
        }

        var transfer = response.Data.Data;
        var status = PixHubStatusConverter.ConvertWithdrawStatus(transfer.Status);

        return new WithdrawResult
        {
            Success = true,
            Status = status,
            AcquirerTransactionId = transfer.Id,
            AcquirerTxId = transfer.Id
        };
    }
}
