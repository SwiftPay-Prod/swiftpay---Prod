using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients.Accithus.Models;
using swiftpay_api_payment.Clients.Accithus.Models.CreateTransaction;
using swiftpay_api_payment.Clients.Accithus.Models.GetTransaction;
using swiftpay_api_payment.Clients.Accithus.Models.Submerchant;
using swiftpay_api_payment.Clients.Accithus.Models.Withdrawals;
using swiftpay_api_payment.Interfaces.Acquirers;

namespace swiftpay_api_payment.Clients.Accithus;

public sealed class AccithusClient(
    HttpClient httpClient,
    ILogger<AccithusClient> logger
) : IAccithusClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<AcquirerClientResponse<AccithusCreateTransactionResponse>> CreateTransactionAsync(
        string baseUrl, string authHeader, AccithusCreateTransactionRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, BuildV1Url(baseUrl, "transactions"))
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Accithus create transaction failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                var errorMessage = AccithusResponseParser.ParseErrorMessage(responseBody, JsonOptions);
                return new AcquirerClientResponse<AccithusCreateTransactionResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var apiResponse = JsonSerializer.Deserialize<AccithusApiResponse<AccithusCreateTransactionResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<AccithusCreateTransactionResponse>
            {
                Success = apiResponse?.Data != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse?.Data,
                ErrorMessage = apiResponse?.Data == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating transaction via Accithus");
            return new AcquirerClientResponse<AccithusCreateTransactionResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<AccithusGetTransactionResponse>> GetTransactionAsync(
        string baseUrl, string authHeader, string transactionId)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, BuildV1Url(baseUrl, $"transactions/{transactionId}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Accithus get transaction failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                return new AcquirerClientResponse<AccithusGetTransactionResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Get transaction failed"
                };
            }

            var apiResponse = JsonSerializer.Deserialize<AccithusApiResponse<AccithusGetTransactionResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<AccithusGetTransactionResponse>
            {
                Success = apiResponse?.Data != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse?.Data,
                ErrorMessage = apiResponse?.Data == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting transaction via Accithus: {TransactionId}", transactionId);
            return new AcquirerClientResponse<AccithusGetTransactionResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<AccithusWithdrawResponse>> WithdrawAsync(
        string baseUrl, string authHeader, AccithusWithdrawRequest request, string idempotencyKey)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, BuildV1Url(baseUrl, "withdrawals"))
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);
            httpRequest.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Accithus withdraw failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                var errorMessage = AccithusResponseParser.ParseErrorMessage(responseBody, JsonOptions);
                return new AcquirerClientResponse<AccithusWithdrawResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var apiResponse = JsonSerializer.Deserialize<AccithusApiResponse<AccithusWithdrawResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<AccithusWithdrawResponse>
            {
                Success = apiResponse?.Data != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse?.Data,
                ErrorMessage = apiResponse?.Data == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing withdraw via Accithus");
            return new AcquirerClientResponse<AccithusWithdrawResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<AccithusSubmerchantResponse>> CreateSubmerchantAsync(
        string baseUrl, string authHeader, AccithusCreateSubmerchantRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, BuildV1Url(baseUrl, "submerchants"))
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Accithus create submerchant failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                var errorMessage = AccithusResponseParser.ParseErrorMessage(responseBody, JsonOptions);
                return new AcquirerClientResponse<AccithusSubmerchantResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var apiResponse = JsonSerializer.Deserialize<AccithusApiResponse<AccithusSubmerchantResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<AccithusSubmerchantResponse>
            {
                Success = apiResponse != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse?.Data,
                ErrorMessage = apiResponse == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating submerchant via Accithus");
            return new AcquirerClientResponse<AccithusSubmerchantResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<AccithusSubmerchantResponse>> UpdateSubmerchantAsync(
        string baseUrl, string authHeader, string submerchantId, AccithusUpdateSubmerchantRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Patch, BuildV1Url(baseUrl, $"submerchants/{submerchantId}"))
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Accithus update submerchant failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                var errorMessage = AccithusResponseParser.ParseErrorMessage(responseBody, JsonOptions);
                return new AcquirerClientResponse<AccithusSubmerchantResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var apiResponse = JsonSerializer.Deserialize<AccithusApiResponse<AccithusSubmerchantResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<AccithusSubmerchantResponse>
            {
                Success = apiResponse != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse?.Data,
                ErrorMessage = apiResponse == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating submerchant via Accithus: {SubmerchantId}", submerchantId);
            return new AcquirerClientResponse<AccithusSubmerchantResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<AccithusSubmerchantResponse>> ResubmitSubmerchantAsync(
        string baseUrl, string authHeader, string submerchantId, AccithusResubmitSubmerchantRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Patch, BuildV1Url(baseUrl, $"submerchants/{submerchantId}/resubmit"))
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Accithus resubmit submerchant failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                var errorMessage = AccithusResponseParser.ParseErrorMessage(responseBody, JsonOptions);
                return new AcquirerClientResponse<AccithusSubmerchantResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var apiResponse = JsonSerializer.Deserialize<AccithusApiResponse<AccithusSubmerchantResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<AccithusSubmerchantResponse>
            {
                Success = apiResponse?.Data != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse?.Data,
                ErrorMessage = apiResponse?.Data == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error resubmitting submerchant via Accithus: {SubmerchantId}", submerchantId);
            return new AcquirerClientResponse<AccithusSubmerchantResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<AccithusSubmerchantResponse>> GetSubmerchantAsync(
        string baseUrl, string authHeader, string submerchantId)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, BuildV1Url(baseUrl, $"submerchants/{submerchantId}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Accithus get submerchant failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                return new AcquirerClientResponse<AccithusSubmerchantResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Get submerchant failed"
                };
            }

            var apiResponse = JsonSerializer.Deserialize<AccithusApiResponse<AccithusSubmerchantResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<AccithusSubmerchantResponse>
            {
                Success = apiResponse?.Data != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse?.Data,
                ErrorMessage = apiResponse?.Data == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting submerchant via Accithus: {SubmerchantId}", submerchantId);
            return new AcquirerClientResponse<AccithusSubmerchantResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<AccithusSubmerchantDocumentResponse>> AddSubmerchantDocumentAsync(
        string baseUrl, string authHeader, string submerchantId, AccithusCreateSubmerchantDocumentRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, BuildV1Url(baseUrl, $"submerchants/{submerchantId}/documents"))
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Accithus add submerchant document failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                var errorMessage = AccithusResponseParser.ParseErrorMessage(responseBody, JsonOptions);
                return new AcquirerClientResponse<AccithusSubmerchantDocumentResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var apiResponse = JsonSerializer.Deserialize<AccithusApiResponse<AccithusSubmerchantDocumentResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<AccithusSubmerchantDocumentResponse>
            {
                Success = apiResponse != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse?.Data,
                ErrorMessage = apiResponse == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error adding submerchant document via Accithus: {SubmerchantId}", submerchantId);
            return new AcquirerClientResponse<AccithusSubmerchantDocumentResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<AccithusSubmerchantAddressResponse>> AddSubmerchantAddressAsync(
        string baseUrl, string authHeader, string submerchantId, AccithusCreateSubmerchantAddressRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, BuildV1Url(baseUrl, $"submerchants/{submerchantId}/addresses"))
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Accithus add submerchant address failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                var errorMessage = AccithusResponseParser.ParseErrorMessage(responseBody, JsonOptions);
                return new AcquirerClientResponse<AccithusSubmerchantAddressResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var apiResponse = JsonSerializer.Deserialize<AccithusApiResponse<AccithusSubmerchantAddressResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<AccithusSubmerchantAddressResponse>
            {
                Success = apiResponse != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse?.Data,
                ErrorMessage = apiResponse == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error adding submerchant address via Accithus: {SubmerchantId}", submerchantId);
            return new AcquirerClientResponse<AccithusSubmerchantAddressResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>> GetSubmerchantSplitConfigAsync(
        string baseUrl, string authHeader, string submerchantId)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, BuildV1Url(baseUrl, $"submerchants/{submerchantId}/split-config"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Accithus get submerchant split config failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                var errorMessage = AccithusResponseParser.ParseErrorMessage(responseBody, JsonOptions);
                return new AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var apiResponse = JsonSerializer.Deserialize<AccithusApiResponse<AccithusSubmerchantSplitConfigResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>
            {
                Success = apiResponse?.Data != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse?.Data,
                ErrorMessage = apiResponse?.Data == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting submerchant split config via Accithus: {SubmerchantId}", submerchantId);
            return new AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>> CreateSubmerchantSplitConfigAsync(
        string baseUrl, string authHeader, string submerchantId, AccithusUpsertSubmerchantSplitConfigRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, BuildV1Url(baseUrl, $"submerchants/{submerchantId}/split-config"))
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Accithus create submerchant split config failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                var errorMessage = AccithusResponseParser.ParseErrorMessage(responseBody, JsonOptions);
                return new AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var apiResponse = JsonSerializer.Deserialize<AccithusApiResponse<AccithusSubmerchantSplitConfigResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>
            {
                Success = apiResponse?.Data != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse?.Data,
                ErrorMessage = apiResponse?.Data == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating submerchant split config via Accithus: {SubmerchantId}", submerchantId);
            return new AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>> UpdateSubmerchantSplitConfigAsync(
        string baseUrl, string authHeader, string submerchantId, AccithusUpsertSubmerchantSplitConfigRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Patch, BuildV1Url(baseUrl, $"submerchants/{submerchantId}/split-config"))
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Accithus update submerchant split config failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                var errorMessage = AccithusResponseParser.ParseErrorMessage(responseBody, JsonOptions);
                return new AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var apiResponse = JsonSerializer.Deserialize<AccithusApiResponse<AccithusSubmerchantSplitConfigResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>
            {
                Success = apiResponse?.Data != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse?.Data,
                ErrorMessage = apiResponse?.Data == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating submerchant split config via Accithus: {SubmerchantId}", submerchantId);
            return new AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public static string BuildAuthHeader(string publicKey, string secretKey) =>
        Convert.ToBase64String(Encoding.UTF8.GetBytes($"{publicKey}:{secretKey}"));

    private static string BuildV1Url(string baseUrl, string relativePath)
    {
        var normalizedBaseUrl = baseUrl.Trim().TrimEnd('/');
        if (!normalizedBaseUrl.EndsWith("/v1", StringComparison.OrdinalIgnoreCase))
            normalizedBaseUrl = $"{normalizedBaseUrl}/v1";

        return $"{normalizedBaseUrl}/{relativePath.TrimStart('/')}";
    }

}
