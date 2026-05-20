using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using safefy_api.Interfaces;
using safefy_api.Models.PaymentApi;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Services.Internal;

public sealed class PaymentApiClient(
    HttpClient httpClient,
    IEnvironmentProvider environmentProvider,
    ILogger<PaymentApiClient> logger
) : IPaymentApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private HttpRequestMessage CreateRequest(HttpMethod method, string url, HttpContent? content = null)
    {
        var request = new HttpRequestMessage(method, url) { Content = content };
        request.Headers.Add("X-Api-Environment", environmentProvider.CurrentEnvironment.ToString());
        return request;
    }

    public async Task<CreateCashoutApiResult> CreateCashoutAsync(CreateCashoutApiInput input, CancellationToken ct = default)
    {
        try
        {
            var requestBody = new CreateCashoutApiInput
            {
                MerchantId = input.MerchantId,
                UserId = input.UserId,
                Amount = input.Amount,
                PayoutAccountId = input.PayoutAccountId,
                MerchantAcquirerId = input.MerchantAcquirerId,
                IpAddress = input.IpAddress,
                Location = input.Location,
                Environment = input.Environment,
                ConsolidateAllAcquirers = input.ConsolidateAllAcquirers
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, "v1/internal/cashouts", content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            var apiResponse = JsonSerializer.Deserialize<PaymentApiCreateCashoutResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API response: {Body}", responseBody);
                return new CreateCashoutApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos."
                };
            }

            return new CreateCashoutApiResult
            {
                Success = apiResponse.Success,
                CashoutId = apiResponse.CashoutId,
                Status = ParsePayoutStatus(apiResponse.Status),
                Amount = apiResponse.Amount,
                PlatformFee = apiResponse.PlatformFee,
                NetAmount = apiResponse.NetAmount,
                PixKey = apiResponse.PixKey,
                PixKeyType = apiResponse.PixKeyType,
                RequiresApproval = apiResponse.RequiresApproval,
                Payouts = apiResponse.Payouts?.Select(p => new CreateCashoutApiPayoutItem
                {
                    Id = p.Id,
                    Status = ParsePayoutStatus(p.Status) ?? PayoutStatus.Pending,
                    Amount = p.Amount,
                    PlatformFee = p.PlatformFee,
                    NetAmount = p.NetAmount
                }).ToList(),
                ErrorMessage = apiResponse.ErrorMessage,
                ErrorCode = apiResponse.ErrorCode
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API for create cashout");
            return new CreateCashoutApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }

    public async Task<EvaluateCashoutApiResult> EvaluateCashoutAsync(EvaluateCashoutApiInput input, CancellationToken ct = default)
    {
        try
        {
            var url = $"v1/internal/cashouts/{input.CashoutId}/evaluate";

            var requestBody = new
            {
                evaluatedById = input.EvaluatedById,
                action = input.Action.ToString(),
                reason = input.Reason
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, url, content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            var apiResponse = JsonSerializer.Deserialize<PaymentApiEvaluateCashoutResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API response: {Body}", responseBody);
                return new EvaluateCashoutApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos."
                };
            }

            return new EvaluateCashoutApiResult
            {
                Success = apiResponse.Success,
                CashoutId = apiResponse.CashoutId,
                Status = ParsePayoutStatus(apiResponse.Status),
                AcquirerTransactionId = apiResponse.AcquirerTransactionId,
                ErrorMessage = apiResponse.ErrorMessage,
                ErrorCode = apiResponse.ErrorCode
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API to evaluate cashout: {CashoutId}", input.CashoutId);
            return new EvaluateCashoutApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }

    public async Task<CancelCashoutApiResult> CancelCashoutAsync(CancelCashoutApiInput input, CancellationToken ct = default)
    {
        try
        {
            var url = $"v1/internal/cashouts/{input.CashoutId}/cancel";

            var requestBody = new
            {
                merchantId = input.MerchantId,
                userId = input.UserId
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, url, content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            var apiResponse = JsonSerializer.Deserialize<PaymentApiCancelCashoutResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API response: {Body}", responseBody);
                return new CancelCashoutApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos."
                };
            }

            return new CancelCashoutApiResult
            {
                Success = apiResponse.Success,
                CashoutId = apiResponse.CashoutId,
                Status = ParsePayoutStatus(apiResponse.Status),
                ErrorMessage = apiResponse.ErrorMessage,
                ErrorCode = apiResponse.ErrorCode
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API to cancel cashout: {CashoutId}", input.CashoutId);
            return new CancelCashoutApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }

    private static PayoutStatus? ParsePayoutStatus(string? status)
    {
        if (string.IsNullOrEmpty(status))
            return null;

        return Enum.TryParse<PayoutStatus>(status, true, out var result) ? result : null;
    }

    public async Task<CreateTransactionApiResult> CreateTransactionAsync(CreateTransactionApiInput input, CancellationToken ct = default)
    {
        try
        {
            var requestBody = new
            {
                merchantId = input.MerchantId,
                userId = input.UserId,
                environment = input.Environment.ToString(),
                method = input.Method.ToString(),
                amount = input.Amount,
                currency = input.Currency.ToString(),
                description = input.Description,
                externalId = input.ExternalId,
                customerId = input.CustomerId,
                productId = input.ProductId,
                variantId = input.VariantId,
                items = input.Items?.Select(item => new
                {
                    productId = item.ProductId,
                    variantId = item.VariantId,
                    quantity = item.Quantity
                }),
                callbackUrl = input.CallbackUrl,
                metadata = input.Metadata,
                pixExpirationMinutes = input.PixExpirationMinutes,
                customerName = input.CustomerName,
                customerDocument = input.CustomerDocument,
                customerEmail = input.CustomerEmail,
                customerPhone = input.CustomerPhone,
                couponCode = input.CouponCode,
                cardNumber = input.CardNumber,
                cardHolderName = input.CardHolderName,
                cardExpirationMonth = input.CardExpirationMonth,
                cardExpirationYear = input.CardExpirationYear,
                installments = input.Installments,
                cardCvv = input.CardCvv,
                boletoDueDate = input.BoletoDueDate,
                boletoInstructions = input.BoletoInstructions
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, "v1/internal/transactions", content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            var apiResponse = JsonSerializer.Deserialize<PaymentApiCreateTransactionResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API response: {Body}", responseBody);
                return new CreateTransactionApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos."
                };
            }

            return new CreateTransactionApiResult
            {
                Success = apiResponse.Success,
                TransactionId = apiResponse.TransactionId,
                ExternalId = apiResponse.ExternalId,
                Method = ParsePaymentMethod(apiResponse.Method),
                Amount = apiResponse.Amount,
                Fee = apiResponse.Fee,
                NetAmount = apiResponse.NetAmount,
                Currency = ParseCurrencyType(apiResponse.Currency),
                Status = ParsePaymentStatus(apiResponse.Status),
                Description = apiResponse.Description,
                Environment = ParseApiEnvironment(apiResponse.Environment),
                ExpiresAt = apiResponse.ExpiresAt,
                CreatedAt = apiResponse.CreatedAt,
                CustomerId = apiResponse.CustomerId,
                ProductId = apiResponse.ProductId,
                VariantId = apiResponse.VariantId,
                Items = apiResponse.Items?.Select(item => new CreateTransactionItemApiResult
                {
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    VariantId = item.VariantId,
                    VariantName = item.VariantName,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalAmount = item.TotalAmount
                }).ToList(),
                Pix = apiResponse.Pix != null ? new CreateTransactionPixResult
                {
                    TxId = apiResponse.Pix.TxId,
                    QrCode = apiResponse.Pix.QrCode,
                    CopyAndPaste = apiResponse.Pix.CopyAndPaste,
                    ExpiresAt = apiResponse.Pix.ExpiresAt
                } : null,
                Boleto = apiResponse.Boleto != null ? new CreateTransactionBoletoResult
                {
                    Barcode = apiResponse.Boleto.Barcode,
                    DigitableLine = apiResponse.Boleto.DigitableLine,
                    PdfUrl = apiResponse.Boleto.PdfUrl,
                    DueDate = apiResponse.Boleto.DueDate
                } : null,
                ErrorMessage = apiResponse.ErrorMessage,
                ErrorCode = apiResponse.ErrorCode
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API for create transaction");
            return new CreateTransactionApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }

    public async Task<CreatePaymentLinkApiResult> CreatePaymentLinkAsync(CreatePaymentLinkApiInput input, CancellationToken ct = default)
    {
        try
        {
            var requestBody = new
            {
                merchantId = input.MerchantId,
                userId = input.UserId,
                environment = input.Environment.ToString(),
                enabledMethods = input.EnabledMethods.Select(method => method.ToString()).ToList(),
                amount = input.Amount,
                currency = input.Currency.ToString(),
                description = input.Description,
                externalId = input.ExternalId,
                customerId = input.CustomerId,
                callbackUrl = input.CallbackUrl,
                metadata = input.Metadata,
                pixExpirationMinutes = input.PixExpirationMinutes,
                customerName = input.CustomerName,
                customerDocument = input.CustomerDocument,
                customerEmail = input.CustomerEmail,
                cardNumber = input.CardNumber,
                cardHolderName = input.CardHolderName,
                cardExpirationMonth = input.CardExpirationMonth,
                cardExpirationYear = input.CardExpirationYear,
                installments = input.Installments,
                cardCvv = input.CardCvv,
                boletoDueDate = input.BoletoDueDate,
                boletoInstructions = input.BoletoInstructions,
                redirectUrl = input.RedirectUrl,
                requiredBuyerFields = input.RequiredBuyerFields,
                showFees = input.ShowFees,
                passFeeToCustomer = input.PassFeeToCustomer,
                expiresAt = input.ExpiresAt,
                primaryColor = input.PrimaryColor,
                secondaryColor = input.SecondaryColor,
                logoUrl = input.LogoUrl,
                colorMode = input.ColorMode,
                themeMode = input.ThemeMode,
                productName = input.ProductName,
                productImageUrl = input.ProductImageUrl
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, "v1/internal/payment-links", content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError(
                    "Payment API create payment link failed: StatusCode={StatusCode}, Body={Body}",
                    (int)response.StatusCode,
                    responseBody
                );

                return new CreatePaymentLinkApiResult
                {
                    Success = false,
                    ErrorMessage = BuildPaymentApiErrorMessage(response.StatusCode, responseBody)
                };
            }

            PaymentApiCreatePaymentLinkResponse? apiResponse;
            try
            {
                apiResponse = JsonSerializer.Deserialize<PaymentApiCreatePaymentLinkResponse>(responseBody, JsonOptions);
            }
            catch (JsonException ex)
            {
                logger.LogError(
                    ex,
                    "Payment API create payment link returned non-JSON response: StatusCode={StatusCode}, Body={Body}",
                    (int)response.StatusCode,
                    responseBody
                );

                return new CreatePaymentLinkApiResult
                {
                    Success = false,
                    ErrorMessage = BuildPaymentApiErrorMessage(response.StatusCode, responseBody)
                };
            }

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API response: {Body}", responseBody);
                return new CreatePaymentLinkApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta invalida da API de pagamentos."
                };
            }

            return new CreatePaymentLinkApiResult
            {
                Success = apiResponse.Success,
                PaymentLinkId = apiResponse.PaymentLinkId,
                PaymentLinkUrl = apiResponse.PaymentLinkUrl,
                EnabledMethods = apiResponse.EnabledMethods
                    .Select(ParsePaymentMethod)
                    .Where(method => method.HasValue)
                    .Select(method => method!.Value)
                    .ToList(),
                Amount = apiResponse.Amount,
                Currency = ParseCurrencyType(apiResponse.Currency),
                Description = apiResponse.Description,
                Environment = ParseApiEnvironment(apiResponse.Environment),
                ExpiresAt = apiResponse.ExpiresAt,
                CreatedAt = apiResponse.CreatedAt,
                CustomerId = apiResponse.CustomerId,
                RedirectUrl = apiResponse.RedirectUrl,
                RequiredBuyerFields = apiResponse.RequiredBuyerFields,
                ShowFees = apiResponse.ShowFees,
                PassFeeToCustomer = apiResponse.PassFeeToCustomer,
                PrimaryColor = apiResponse.PrimaryColor,
                SecondaryColor = apiResponse.SecondaryColor,
                LogoUrl = apiResponse.LogoUrl,
                ColorMode = apiResponse.ColorMode,
                ThemeMode = apiResponse.ThemeMode,
                ProductName = apiResponse.ProductName,
                ProductImageUrl = apiResponse.ProductImageUrl,
                ErrorMessage = apiResponse.ErrorMessage,
                ErrorCode = apiResponse.ErrorCode
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API for create payment link");
            return new CreatePaymentLinkApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }

    private static PaymentMethod? ParsePaymentMethod(string? method)
    {
        if (string.IsNullOrEmpty(method))
            return null;

        return Enum.TryParse<PaymentMethod>(method, true, out var result) ? result : null;
    }

    private static CurrencyType? ParseCurrencyType(string? currency)
    {
        if (string.IsNullOrEmpty(currency))
            return null;

        return Enum.TryParse<CurrencyType>(currency, true, out var result) ? result : null;
    }

    private static PaymentStatus? ParsePaymentStatus(string? status)
    {
        if (string.IsNullOrEmpty(status))
            return null;

        return Enum.TryParse<PaymentStatus>(status, true, out var result) ? result : null;
    }

    private static ApiEnvironment? ParseApiEnvironment(string? environment)
    {
        if (string.IsNullOrEmpty(environment))
            return null;

        return Enum.TryParse<ApiEnvironment>(environment, true, out var result) ? result : null;
    }

    private static string BuildPaymentApiErrorMessage(System.Net.HttpStatusCode statusCode, string? responseBody)
    {
        var body = responseBody?.Trim();
        if (string.IsNullOrWhiteSpace(body))
        {
            return $"Erro ao comunicar com a API de pagamentos (HTTP {(int)statusCode}).";
        }

        if (body.Length > 300)
        {
            body = body[..300] + "...";
        }

        return $"Erro ao comunicar com a API de pagamentos (HTTP {(int)statusCode}): {body}";
    }

    public async Task<SimulateTransactionApiResult> SimulateTransactionAsync(SimulateTransactionApiInput input, CancellationToken ct = default)
    {
        try
        {
            var url = $"v1/internal/transactions/{input.TransactionId}/simulate";

            var requestBody = new
            {
                transactionId = input.TransactionId,
                merchantId = input.MerchantId,
                action = input.Action
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, url, content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            var apiResponse = JsonSerializer.Deserialize<PaymentApiSimulateTransactionResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API response: {Body}", responseBody);
                return new SimulateTransactionApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos."
                };
            }

            return new SimulateTransactionApiResult
            {
                Success = apiResponse.Data?.Success ?? false,
                TransactionId = apiResponse.Data?.TransactionId,
                Status = ParsePaymentStatus(apiResponse.Data?.Status),
                SimulatedAction = apiResponse.Data?.SimulatedAction,
                CompletedAt = apiResponse.Data?.CompletedAt,
                RefundedAt = apiResponse.Data?.RefundedAt,
                ErrorMessage = apiResponse.Data?.ErrorMessage ?? apiResponse.Error?.Message,
                ErrorCode = apiResponse.Data?.ErrorCode ?? apiResponse.Error?.Code
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API to simulate transaction: {TransactionId}", input.TransactionId);
            return new SimulateTransactionApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }

    public async Task<ReprocessCompletedTransactionDevApiResult> ReprocessCompletedTransactionDevAsync(
        ReprocessCompletedTransactionDevApiInput input,
        CancellationToken ct = default)
    {
        try
        {
            var url = $"v1/internal/transactions/{input.TransactionId}/dev/reprocess-completed";

            var requestBody = new
            {
                transactionId = input.TransactionId,
                merchantId = input.MerchantId,
                targetStatus = input.TargetStatus.ToString()
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, url, content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (string.IsNullOrWhiteSpace(responseBody))
            {
                logger.LogError(
                    "Payment API returned empty body when reprocessing transaction: TransactionId={TransactionId}, StatusCode={StatusCode}",
                    input.TransactionId,
                    (int)response.StatusCode);

                return new ReprocessCompletedTransactionDevApiResult
                {
                    Success = false,
                    ErrorMessage = $"API de pagamentos retornou resposta vazia ({(int)response.StatusCode}).",
                    ErrorCode = "empty_response"
                };
            }

            var apiResponse = JsonSerializer.Deserialize<PaymentApiReprocessCompletedTransactionDevResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API reprocess transaction response: {Body}", responseBody);
                return new ReprocessCompletedTransactionDevApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos.",
                    ErrorCode = "invalid_response"
                };
            }

            return new ReprocessCompletedTransactionDevApiResult
            {
                Success = apiResponse.Success,
                TransactionId = apiResponse.TransactionId,
                Status = ParsePaymentStatus(apiResponse.Status),
                CompletedAt = apiResponse.CompletedAt,
                ErrorMessage = apiResponse.ErrorMessage,
                ErrorCode = apiResponse.ErrorCode
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API to reprocess transaction as completed: {TransactionId}", input.TransactionId);
            return new ReprocessCompletedTransactionDevApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}",
                ErrorCode = "communication_error"
            };
        }
    }

    public async Task<ResendWebhookApiResult> ResendWebhookAsync(ResendWebhookApiInput input, CancellationToken ct = default)
    {
        try
        {
            var url = $"v1/internal/transactions/{input.TransactionId}/resend-webhook";

            var requestBody = new
            {
                transactionId = input.TransactionId,
                merchantId = input.MerchantId
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, url, content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            var apiResponse = JsonSerializer.Deserialize<PaymentApiResendWebhookResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API resend webhook response: {Body}", responseBody);
                return new ResendWebhookApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos."
                };
            }

            return new ResendWebhookApiResult
            {
                Success = apiResponse.Data?.Success ?? false,
                TransactionId = apiResponse.Data?.TransactionId,
                CallbackStatus = ParseCallbackStatus(apiResponse.Data?.CallbackStatus),
                ErrorMessage = apiResponse.Data?.ErrorMessage ?? apiResponse.Error?.Message,
                ErrorCode = apiResponse.Data?.ErrorCode ?? apiResponse.Error?.Code
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API to resend webhook: {TransactionId}", input.TransactionId);
            return new ResendWebhookApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }

    private static CallbackStatus? ParseCallbackStatus(string? status)
    {
        if (string.IsNullOrEmpty(status))
            return null;

        return Enum.TryParse<CallbackStatus>(status, true, out var result) ? result : null;
    }

    public async Task<SimulateCashoutApiResult> SimulateCashoutAsync(SimulateCashoutApiInput input, CancellationToken ct = default)
    {
        try
        {
            var url = $"v1/internal/cashouts/{input.CashoutId}/simulate";

            var requestBody = new
            {
                action = input.Action
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, url, content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            var apiResponse = JsonSerializer.Deserialize<PaymentApiSimulateCashoutResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API simulate cashout response: {Body}", responseBody);
                return new SimulateCashoutApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos.",
                    StatusCode = 500
                };
            }

            if (apiResponse.Error != null)
            {
                return new SimulateCashoutApiResult
                {
                    Success = false,
                    ErrorMessage = apiResponse.Error.Message,
                    ErrorCode = apiResponse.Error.Code,
                    StatusCode = (int)response.StatusCode
                };
            }

            return new SimulateCashoutApiResult
            {
                Success = true,
                CashoutId = apiResponse.Data?.Id,
                Status = ParsePayoutStatus(apiResponse.Data?.Status),
                EndToEndId = apiResponse.Data?.Pix?.EndToEndId,
                SimulatedAction = input.Action
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API to simulate cashout: {CashoutId}", input.CashoutId);
            return new SimulateCashoutApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}",
                StatusCode = 500
            };
        }
    }

    public async Task<ReprocessCompletedCashoutDevApiResult> ReprocessCompletedCashoutDevAsync(
        ReprocessCompletedCashoutDevApiInput input,
        CancellationToken ct = default)
    {
        try
        {
            var url = $"v1/internal/cashouts/{input.CashoutId}/dev/reprocess-completed";

            var requestBody = new
            {
                cashoutId = input.CashoutId,
                merchantId = input.MerchantId,
                targetStatus = input.TargetStatus.ToString()
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, url, content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (string.IsNullOrWhiteSpace(responseBody))
            {
                logger.LogError(
                    "Payment API returned empty body when reprocessing cashout: CashoutId={CashoutId}, StatusCode={StatusCode}",
                    input.CashoutId,
                    (int)response.StatusCode);

                return new ReprocessCompletedCashoutDevApiResult
                {
                    Success = false,
                    ErrorMessage = $"API de pagamentos retornou resposta vazia ({(int)response.StatusCode}).",
                    ErrorCode = "empty_response"
                };
            }

            var apiResponse = JsonSerializer.Deserialize<PaymentApiReprocessCompletedCashoutDevResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API reprocess cashout response: {Body}", responseBody);
                return new ReprocessCompletedCashoutDevApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos.",
                    ErrorCode = "invalid_response"
                };
            }

            return new ReprocessCompletedCashoutDevApiResult
            {
                Success = apiResponse.Success,
                CashoutId = apiResponse.CashoutId,
                Status = ParsePayoutStatus(apiResponse.Status),
                CompletedAt = apiResponse.CompletedAt,
                EndToEndId = apiResponse.EndToEndId,
                AcquirerTransactionId = apiResponse.AcquirerTransactionId,
                ErrorMessage = apiResponse.ErrorMessage,
                ErrorCode = apiResponse.ErrorCode
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API to reprocess cashout as completed: {CashoutId}", input.CashoutId);
            return new ReprocessCompletedCashoutDevApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}",
                ErrorCode = "communication_error"
            };
        }
    }

    public async Task<ReprocessAcquirerWebhookDevApiResult> ReprocessAcquirerWebhookDevAsync(
        ReprocessAcquirerWebhookDevApiInput input,
        CancellationToken ct = default)
    {
        try
        {
            var url = $"v1/internal/acquirers/webhooks/{input.WebhookLogId}/dev/reprocess";

            var requestBody = new
            {
                webhookLogId = input.WebhookLogId
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, url, content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (string.IsNullOrWhiteSpace(responseBody))
            {
                logger.LogError(
                    "Payment API returned empty body when reprocessing acquirer webhook: WebhookLogId={WebhookLogId}, StatusCode={StatusCode}",
                    input.WebhookLogId,
                    (int)response.StatusCode);

                return new ReprocessAcquirerWebhookDevApiResult
                {
                    Success = false,
                    WebhookLogId = input.WebhookLogId,
                    ErrorMessage = $"API de pagamentos retornou resposta vazia ({(int)response.StatusCode}).",
                    ErrorCode = "empty_response"
                };
            }

            var apiResponse = JsonSerializer.Deserialize<PaymentApiReprocessAcquirerWebhookDevResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API acquirer webhook reprocess response: {Body}", responseBody);
                return new ReprocessAcquirerWebhookDevApiResult
                {
                    Success = false,
                    WebhookLogId = input.WebhookLogId,
                    ErrorMessage = "Resposta invalida da API de pagamentos.",
                    ErrorCode = "invalid_response"
                };
            }

            return new ReprocessAcquirerWebhookDevApiResult
            {
                Success = apiResponse.Success,
                WebhookLogId = apiResponse.WebhookLogId,
                AcquirerType = apiResponse.AcquirerType,
                PaymentId = apiResponse.PaymentId,
                PayoutId = apiResponse.PayoutId,
                Status = apiResponse.Status,
                ErrorMessage = apiResponse.ErrorMessage,
                ErrorCode = apiResponse.ErrorCode
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API to reprocess acquirer webhook: {WebhookLogId}", input.WebhookLogId);
            return new ReprocessAcquirerWebhookDevApiResult
            {
                Success = false,
                WebhookLogId = input.WebhookLogId,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}",
                ErrorCode = "communication_error"
            };
        }
    }

    public async Task<ForceAcquirerWebhookDevApiResult> ForceAcquirerWebhookDevAsync(
        ForceAcquirerWebhookDevApiInput input,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        var acquirerType = input.AcquirerType;
        var payloadJson = input.PayloadJson;

        if (string.IsNullOrWhiteSpace(payloadJson))
        {
            return new ForceAcquirerWebhookDevApiResult
            {
                Success = false,
                AcquirerType = acquirerType,
                ErrorCode = "invalid_payload",
                ErrorMessage = "O payload deve ser um objeto JSON válido."
            };
        }

        try
        {
            using var payloadDocument = JsonDocument.Parse(payloadJson);
            if (payloadDocument.RootElement.ValueKind != JsonValueKind.Object)
            {
                return new ForceAcquirerWebhookDevApiResult
                {
                    Success = false,
                    AcquirerType = acquirerType,
                    ErrorCode = "invalid_payload",
                    ErrorMessage = "O payload deve ser um objeto JSON válido."
                };
            }

            var path = "v1/internal/acquirers/webhooks/00000000-0000-0000-0000-000000000000/dev/reprocess";

            var requestBody = new
            {
                webhookLogId = Guid.Empty,
                acquirerType = input.AcquirerType.ToString(),
                payloadJson = payloadDocument.RootElement.GetRawText()
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, path, content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (string.IsNullOrWhiteSpace(responseBody))
            {
                logger.LogError(
                    "Payment API returned empty body when forcing acquirer webhook replay: StatusCode={StatusCode}, AcquirerType={AcquirerType}",
                    (int)response.StatusCode,
                    input.AcquirerType);

                return new ForceAcquirerWebhookDevApiResult
                {
                    Success = false,
                    AcquirerType = acquirerType,
                    ErrorCode = "empty_response",
                    ErrorMessage = $"API de pagamentos retornou resposta vazia ({(int)response.StatusCode})."
                };
            }

            var apiResponse = JsonSerializer.Deserialize<PaymentApiReprocessAcquirerWebhookDevResponse>(responseBody, JsonOptions);
            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API acquirer webhook replay response: {Body}", responseBody);
                return new ForceAcquirerWebhookDevApiResult
                {
                    Success = false,
                    AcquirerType = acquirerType,
                    ErrorCode = "invalid_response",
                    ErrorMessage = "Resposta inválida da API de pagamentos."
                };
            }

            if (!response.IsSuccessStatusCode || !apiResponse.Success)
            {
                return new ForceAcquirerWebhookDevApiResult
                {
                    Success = false,
                    AcquirerType = acquirerType,
                    Status = apiResponse.Status,
                    Processed = false,
                    ErrorCode = apiResponse.ErrorCode
                        ?? (response.StatusCode == System.Net.HttpStatusCode.NotFound ? "not_found" : "request_failed"),
                    ErrorMessage = apiResponse.ErrorMessage
                        ?? "Falha ao forçar processamento do webhook da adquirente."
                };
            }

            return new ForceAcquirerWebhookDevApiResult
            {
                Success = true,
                AcquirerType = acquirerType,
                TxId = null,
                Status = apiResponse.Status,
                Processed = true
            };
        }
        catch (JsonException ex)
        {
            logger?.LogError(ex, "Invalid JSON payload when forcing acquirer webhook replay");
            return new ForceAcquirerWebhookDevApiResult
            {
                Success = false,
                AcquirerType = acquirerType,
                ErrorCode = "invalid_payload",
                ErrorMessage = "JSON inválido no payload informado."
            };
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "Error calling Payment API to force acquirer webhook replay: AcquirerType={AcquirerType}", acquirerType);
            return new ForceAcquirerWebhookDevApiResult
            {
                Success = false,
                AcquirerType = acquirerType,
                ErrorCode = "communication_error",
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }

    public async Task<CreateOrderApiResult> CreateOrderAsync(CreateOrderApiInput input, CancellationToken ct = default)
    {
        try
        {
            var requestBody = new
            {
                merchantId = input.MerchantId,
                userId = input.UserId,
                customerId = input.CustomerId,
                environment = input.Environment.ToString(),
                paymentMethod = input.PaymentMethod.ToString(),
                items = input.Items.Select(item => new
                {
                    productId = item.ProductId,
                    variantId = item.VariantId,
                    quantity = item.Quantity,
                    unitPrice = item.UnitPrice
                }).ToList(),
                couponCode = input.CouponCode,
                shippingAmount = input.ShippingAmount,
                shippingAddress = input.ShippingAddress != null ? new
                {
                    street = input.ShippingAddress.Street,
                    number = input.ShippingAddress.Number,
                    complement = input.ShippingAddress.Complement,
                    neighborhood = input.ShippingAddress.Neighborhood,
                    city = input.ShippingAddress.City,
                    state = input.ShippingAddress.State,
                    zipCode = input.ShippingAddress.ZipCode,
                    country = input.ShippingAddress.Country
                } : null,
                notes = input.Notes,
                description = input.Description,
                callbackUrl = input.CallbackUrl,
                metadata = input.Metadata,
                externalId = input.ExternalId,
                expirationMinutes = input.ExpirationMinutes
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var request = CreateRequest(HttpMethod.Post, "v1/internal/orders", content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            var apiResponse = JsonSerializer.Deserialize<PaymentApiCreateOrderResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API create order response: {Body}", responseBody);
                return new CreateOrderApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos."
                };
            }

            return new CreateOrderApiResult
            {
                Success = apiResponse.Success,
                OrderId = apiResponse.OrderId,
                OrderNumber = apiResponse.OrderNumber,
                OrderStatus = ParseOrderStatus(apiResponse.OrderStatus),
                FulfillmentStatus = ParseOrderFulfillmentStatus(apiResponse.FulfillmentStatus),
                SubtotalAmount = apiResponse.SubtotalAmount,
                DiscountAmount = apiResponse.DiscountAmount,
                ShippingAmount = apiResponse.ShippingAmount,
                TotalAmount = apiResponse.TotalAmount,
                CouponCode = apiResponse.CouponCode,
                CouponId = apiResponse.CouponId,
                ItemsCount = apiResponse.ItemsCount,
                Items = apiResponse.Items?.Select(item => new CreateOrderItemApiResult
                {
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    VariantId = item.VariantId,
                    VariantName = item.VariantName,
                    Sku = item.Sku,
                    ImageUrl = item.ImageUrl,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.TotalPrice
                }).ToList(),
                PaymentId = apiResponse.PaymentId,
                PaymentStatus = ParsePaymentStatus(apiResponse.PaymentStatus),
                PaymentAmount = apiResponse.PaymentAmount,
                PaymentFee = apiResponse.PaymentFee,
                PaymentNetAmount = apiResponse.PaymentNetAmount,
                Pix = apiResponse.Pix != null ? new CreateOrderPixApiResult
                {
                    TxId = apiResponse.Pix.TxId,
                    QrCode = apiResponse.Pix.QrCode,
                    CopyAndPaste = apiResponse.Pix.CopyAndPaste,
                    ExpiresAt = apiResponse.Pix.ExpiresAt
                } : null,
                CreatedAt = apiResponse.CreatedAt,
                ErrorMessage = apiResponse.ErrorMessage,
                ErrorCode = apiResponse.ErrorCode
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API for create order");
            return new CreateOrderApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }

    private static OrderStatus? ParseOrderStatus(string? status)
    {
        if (string.IsNullOrEmpty(status))
            return null;

        return Enum.TryParse<OrderStatus>(status, true, out var result) ? result : null;
    }

    private static OrderFulfillmentStatus? ParseOrderFulfillmentStatus(string? status)
    {
        if (string.IsNullOrEmpty(status))
            return null;

        return Enum.TryParse<OrderFulfillmentStatus>(status, true, out var result) ? result : null;
    }

    public async Task<ReprocessCompletedPlatformPayoutItemDevApiResult> ReprocessCompletedPlatformPayoutItemDevAsync(
        ReprocessCompletedPlatformPayoutItemDevApiInput input,
        CancellationToken ct = default)
    {
        try
        {
            var url = $"v1/internal/platform-payouts/items/{input.PlatformPayoutItemId}/dev/reprocess-completed";
            var requestBody = new
            {
                platformPayoutItemId = input.PlatformPayoutItemId,
                targetStatus = input.TargetStatus.ToString()
            };
            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json");
            var request = CreateRequest(HttpMethod.Post, url, content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError(
                    "Payment API reprocess platform payout item dev failed. StatusCode={StatusCode}, Body={Body}",
                    (int)response.StatusCode,
                    responseBody);

                return new ReprocessCompletedPlatformPayoutItemDevApiResult
                {
                    Success = false,
                    ErrorMessage = BuildPaymentApiErrorMessage(response.StatusCode, responseBody)
                };
            }

            if (string.IsNullOrEmpty(responseBody))
            {
                logger.LogError(
                    "Payment API reprocess platform payout item dev returned empty body. StatusCode={StatusCode}",
                    (int)response.StatusCode);

                return new ReprocessCompletedPlatformPayoutItemDevApiResult
                {
                    Success = false,
                    ErrorMessage = BuildPaymentApiErrorMessage(response.StatusCode, responseBody)
                };
            }

            var apiResponse = JsonSerializer.Deserialize<PaymentApiReprocessCompletedPlatformPayoutItemDevResponse>(
                responseBody, JsonOptions);

            if (apiResponse == null)
            {
                return new ReprocessCompletedPlatformPayoutItemDevApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos."
                };
            }

            return new ReprocessCompletedPlatformPayoutItemDevApiResult
            {
                Success = apiResponse.Success,
                PlatformPayoutItemId = apiResponse.PlatformPayoutItemId,
                PlatformPayoutId = apiResponse.PlatformPayoutId,
                Status = ParsePlatformPayoutStatus(apiResponse.Status),
                ProcessedItemsCount = apiResponse.ProcessedItemsCount,
                ErrorMessage = apiResponse.ErrorMessage,
                ErrorCode = apiResponse.ErrorCode
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API for reprocess completed platform payout item dev");
            return new ReprocessCompletedPlatformPayoutItemDevApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }

    private static PlatformPayoutStatus? ParsePlatformPayoutStatus(string? status)
    {
        if (string.IsNullOrEmpty(status))
            return null;

        return Enum.TryParse<PlatformPayoutStatus>(status, true, out var result) ? result : null;
    }

    public async Task<SubmitSubmerchantApiResult> SubmitSubmerchantAsync(SubmitSubmerchantApiInput input, CancellationToken ct = default)
    {
        try
        {
            var requestBody = new
            {
                acquirerId = input.AcquirerId,
                merchantId = input.MerchantId,
                existingExternalSubmerchantId = input.ExistingExternalSubmerchantId,
                legalName = input.LegalName,
                tradeName = input.TradeName,
                documentType = input.DocumentType,
                documentNumber = input.DocumentNumber,
                email = input.Email,
                phone = input.Phone,
                businessDescription = input.BusinessDescription,
                website = input.Website,
                documents = input.Documents.Select(document => new
                {
                    type = document.Type,
                    number = document.Number,
                    fileUrl = document.FileUrl,
                    fileName = document.FileName,
                    fileSize = document.FileSize,
                    mimeType = document.MimeType,
                    expiresAt = document.ExpiresAt
                }).ToList(),
                address = input.Address != null ? new
                {
                    street = input.Address.Street,
                    number = input.Address.Number,
                    complement = input.Address.Complement,
                    neighborhood = input.Address.Neighborhood,
                    city = input.Address.City,
                    state = input.Address.State,
                    zipCode = input.Address.ZipCode
                } : null,
                bankAccount = input.BankAccount != null ? new
                {
                    bankCode = input.BankAccount.BankCode,
                    branch = input.BankAccount.Branch,
                    accountNumber = input.BankAccount.AccountNumber,
                    accountType = input.BankAccount.AccountType
                } : null
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json");

            var request = CreateRequest(HttpMethod.Post, "v1/internal/submerchants", content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            var apiResponse = JsonSerializer.Deserialize<PaymentApiSubmitSubmerchantResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API submerchant response: {Body}", responseBody);
                return new SubmitSubmerchantApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos."
                };
            }

            return new SubmitSubmerchantApiResult
            {
                Success = apiResponse.Success,
                ExternalSubmerchantId = apiResponse.ExternalSubmerchantId,
                Status = apiResponse.Status,
                RejectionReason = apiResponse.RejectionReason,
                ErrorMessage = apiResponse.ErrorMessage
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API for submit submerchant");
            return new SubmitSubmerchantApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }

    public async Task<GetSubmerchantStatusApiResult> GetSubmerchantStatusAsync(GetSubmerchantStatusApiInput input, CancellationToken ct = default)
    {
        try
        {
            var requestBody = new
            {
                acquirerId = input.AcquirerId,
                externalSubmerchantId = input.ExternalSubmerchantId
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json");

            var request = CreateRequest(HttpMethod.Post, "v1/internal/submerchants/status", content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            var apiResponse = JsonSerializer.Deserialize<PaymentApiGetSubmerchantStatusResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API submerchant status response: {Body}", responseBody);
                return new GetSubmerchantStatusApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos."
                };
            }

            return new GetSubmerchantStatusApiResult
            {
                Success = apiResponse.Success,
                ExternalSubmerchantId = apiResponse.ExternalSubmerchantId,
                Status = apiResponse.Status,
                LegalName = apiResponse.LegalName,
                DocumentType = apiResponse.DocumentType,
                DocumentNumber = apiResponse.DocumentNumber,
                CreatedAt = apiResponse.CreatedAt,
                UpdatedAt = apiResponse.UpdatedAt,
                RejectionReason = apiResponse.RejectionReason,
                ErrorMessage = apiResponse.ErrorMessage
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API for get submerchant status");
            return new GetSubmerchantStatusApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }

    public async Task<SyncSubmerchantSplitConfigApiResult> SyncSubmerchantSplitConfigAsync(SyncSubmerchantSplitConfigApiInput input, CancellationToken ct = default)
    {
        try
        {
            var requestBody = new
            {
                acquirerId = input.AcquirerId,
                merchantId = input.MerchantId,
                externalSubmerchantId = input.ExternalSubmerchantId,
                commissionType = input.CommissionType,
                commissionValue = input.CommissionValue,
                isActive = input.IsActive
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOptions),
                Encoding.UTF8,
                "application/json");

            var request = CreateRequest(HttpMethod.Post, "v1/internal/submerchants/split-config/sync", content);
            var response = await httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            var apiResponse = JsonSerializer.Deserialize<PaymentApiSyncSubmerchantSplitConfigResponse>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("Failed to deserialize Payment API split config sync response: {Body}", responseBody);
                return new SyncSubmerchantSplitConfigApiResult
                {
                    Success = false,
                    ErrorMessage = "Resposta inválida da API de pagamentos."
                };
            }

            return new SyncSubmerchantSplitConfigApiResult
            {
                Success = apiResponse.Success,
                ExternalSubmerchantId = apiResponse.ExternalSubmerchantId,
                CommissionType = apiResponse.CommissionType,
                CommissionValue = apiResponse.CommissionValue,
                IsActive = apiResponse.IsActive,
                ErrorMessage = apiResponse.ErrorMessage
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling Payment API for sync submerchant split config");
            return new SyncSubmerchantSplitConfigApiResult
            {
                Success = false,
                ErrorMessage = $"Erro ao comunicar com a API de pagamentos: {ex.Message}"
            };
        }
    }
}
