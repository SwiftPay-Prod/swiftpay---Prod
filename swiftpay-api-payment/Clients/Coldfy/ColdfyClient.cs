using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.Coldfy.Models.Payments;
using swiftpay_api_payment.Clients.Coldfy.Models.Withdrawals;
using swiftpay_api_payment.Interfaces.Acquirers;

namespace swiftpay_api_payment.Clients.Coldfy;

public sealed class ColdfyClient(
    HttpClient httpClient,
    ILogger<ColdfyClient> logger
) : IColdfyClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private static readonly JsonSerializerOptions ReadOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<AcquirerClientResponse<ColdfyPaymentResponse>> CreatePaymentAsync(
        string baseUrl,
        string apiKey,
        string companyId,
        ColdfyCreatePaymentRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json");

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/transactions")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = BuildAuthHeader(apiKey, companyId);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var (errorCode, errorMessage) = ColdfyResponseParser.TryGetPaymentError(responseBody, ReadOptions);
                var resolvedMessage = errorMessage ?? "Erro ao criar pagamento.";
                logger.LogError("Coldfy create payment failed: {StatusCode} - {Error}", response.StatusCode, resolvedMessage);

                return new AcquirerClientResponse<ColdfyPaymentResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorCode = errorCode,
                    ErrorMessage = resolvedMessage
                };
            }

            var data = JsonSerializer.Deserialize<ColdfyPaymentResponse>(responseBody, ReadOptions);
            if (data == null)
            {
                logger.LogError("Coldfy create payment returned invalid JSON: {Body}", responseBody);
                return new AcquirerClientResponse<ColdfyPaymentResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Invalid JSON response"
                };
            }

            return new AcquirerClientResponse<ColdfyPaymentResponse>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = data
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating payment via Coldfy");
            return new AcquirerClientResponse<ColdfyPaymentResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<ColdfyPaymentResponse>> GetTransactionAsync(
        string baseUrl,
        string apiKey,
        string companyId,
        string transactionId)
    {
        try
        {
            using var httpRequest = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/transactions/{transactionId}");
            httpRequest.Headers.Authorization = BuildAuthHeader(apiKey, companyId);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var (errorCode, errorMessage) = ColdfyResponseParser.TryGetPaymentError(responseBody, ReadOptions);
                var resolvedMessage = errorMessage ?? "Erro ao consultar transacao.";
                logger.LogError("Coldfy get transaction failed: {StatusCode} - {Error}", response.StatusCode, resolvedMessage);

                return new AcquirerClientResponse<ColdfyPaymentResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorCode = errorCode,
                    ErrorMessage = resolvedMessage
                };
            }

            var data = JsonSerializer.Deserialize<ColdfyPaymentResponse>(responseBody, ReadOptions);
            if (data == null)
            {
                logger.LogError("Coldfy get transaction returned invalid JSON: {Body}", responseBody);
                return new AcquirerClientResponse<ColdfyPaymentResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Invalid JSON response"
                };
            }

            return new AcquirerClientResponse<ColdfyPaymentResponse>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = data
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting transaction via Coldfy for {TransactionId}", transactionId);
            return new AcquirerClientResponse<ColdfyPaymentResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<ColdfyWithdrawalResponse>> CreateWithdrawalAsync(
        string baseUrl,
        string apiKey,
        string companyId,
        string idempotencyKey,
        ColdfyCreateWithdrawalRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json");

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/withdrawals/cashout")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = BuildAuthHeader(apiKey, companyId);
            httpRequest.Headers.Add("Idempotency-Key", idempotencyKey);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var (errorCode, errorMessage) = ColdfyResponseParser.TryGetWithdrawalError(responseBody, ReadOptions);
                var resolvedMessage = errorMessage ?? "Erro ao criar saque.";
                logger.LogError("Coldfy create withdrawal failed: {StatusCode} - {Error}", response.StatusCode, resolvedMessage);

                return new AcquirerClientResponse<ColdfyWithdrawalResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorCode = errorCode,
                    ErrorMessage = resolvedMessage
                };
            }

            ColdfyWithdrawalResponse? data;
            try
            {
                data = JsonSerializer.Deserialize<ColdfyWithdrawalResponse>(responseBody, ReadOptions);
            }
            catch (JsonException ex)
            {
                logger.LogError(ex,
                    "Coldfy create withdrawal response deserialization failed. Attempting resilient parse. Body: {Body}",
                    responseBody);
                data = ColdfyResponseParser.TryParseWithdrawalResponseResilient(responseBody);
            }

            if (data == null)
            {
                logger.LogError("Coldfy create withdrawal returned invalid JSON: {Body}", responseBody);
                return new AcquirerClientResponse<ColdfyWithdrawalResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Invalid JSON response"
                };
            }

            return new AcquirerClientResponse<ColdfyWithdrawalResponse>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = data
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating withdrawal via Coldfy");
            return new AcquirerClientResponse<ColdfyWithdrawalResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    private static AuthenticationHeaderValue BuildAuthHeader(string apiKey, string companyId)
    {
        var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{apiKey}:{companyId}"));
        return new AuthenticationHeaderValue("Basic", token);
    }

}
