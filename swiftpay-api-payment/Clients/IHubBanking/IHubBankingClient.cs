using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.IHubBanking.Models;
using swiftpay_api_payment.Clients.IHubBanking.Models.Transactions;
using swiftpay_api_payment.Clients.IHubBanking.Models.Withdrawals;
using swiftpay_api_payment.Interfaces.Acquirers;

namespace swiftpay_api_payment.Clients.IHubBanking;

public sealed class IHubBankingClient(
    HttpClient httpClient,
    ILogger<IHubBankingClient> logger
) : IIHubBankingClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private static AuthenticationHeaderValue CreateAuthHeader(string secretKey)
    {
        var credentials = $"secret:{secretKey}";
        var encodedCredentials = Convert.ToBase64String(Encoding.UTF8.GetBytes(credentials));
        return new AuthenticationHeaderValue("Basic", encodedCredentials);
    }

    public async Task<AcquirerClientResponse<IHubCreateTransactionResponse>> CreateTransactionAsync(
        string baseUrl, 
        string secretKey, 
        IHubCreateTransactionRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/transactions/v2/purchase")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = CreateAuthHeader(secretKey);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError(
                    "IHub create transaction failed: {StatusCode} - {Body}",
                    response.StatusCode, responseBody);
                
                var errorMessage = IHubBankingResponseParser.ParseIHubError(responseBody, JsonOptions);
                return new AcquirerClientResponse<IHubCreateTransactionResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage,
                    Data = new IHubCreateTransactionResponse
                    {
                        Error = errorMessage
                    }
                };
            }

            return new AcquirerClientResponse<IHubCreateTransactionResponse>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = JsonSerializer.Deserialize<IHubCreateTransactionResponse>(responseBody, JsonOptions)
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating transaction via IHub Banking");
            return new AcquirerClientResponse<IHubCreateTransactionResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<IHubGetTransactionResponse>> GetTransactionAsync(
        string baseUrl, 
        string secretKey, 
        string transactionId, 
        string searchBy = "id")
    {
        try
        {
            using var httpRequest = new HttpRequestMessage(
                HttpMethod.Get, 
                $"{baseUrl}/transactions/{transactionId}?searchBy={searchBy}");
            httpRequest.Headers.Authorization = CreateAuthHeader(secretKey);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError(
                    "IHub get transaction failed: {StatusCode} - {Body} - TransactionId={TransactionId}",
                    response.StatusCode, responseBody, transactionId);
                return new AcquirerClientResponse<IHubGetTransactionResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Get transaction failed"
                };
            }

            return new AcquirerClientResponse<IHubGetTransactionResponse>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = JsonSerializer.Deserialize<IHubGetTransactionResponse>(responseBody, JsonOptions)
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting transaction status via IHub Banking for {TransactionId}", transactionId);
            return new AcquirerClientResponse<IHubGetTransactionResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<IHubWithdrawResponse>> WithdrawAsync(
        string baseUrl, 
        string secretKey, 
        IHubWithdrawRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/withdraws/cash-out")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = CreateAuthHeader(secretKey);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError(
                    "IHub withdraw failed: {StatusCode} - {Body} - ExternalId={ExternalId}",
                    response.StatusCode, responseBody, request.ExternalId);

                var errorMessage = IHubBankingResponseParser.ParseIHubError(responseBody, JsonOptions);
                
                return new AcquirerClientResponse<IHubWithdrawResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage,
                    Data = new IHubWithdrawResponse
                    {
                        ExternalId = request.ExternalId,
                        Status = IHubWithdrawStatus.WITHDRAW_ERROR,
                        Error = errorMessage
                    }
                };
            }

            var withdrawResponse = JsonSerializer.Deserialize<IHubWithdrawResponse>(responseBody, JsonOptions);

            return new AcquirerClientResponse<IHubWithdrawResponse>
            {
                Success = withdrawResponse != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = withdrawResponse,
                ErrorMessage = withdrawResponse == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing withdraw via IHub Banking for ExternalId {ExternalId}", request.ExternalId);
            return new AcquirerClientResponse<IHubWithdrawResponse>
            {
                Success = false,
                ErrorMessage = $"Exception: {ex.Message}",
                Data = new IHubWithdrawResponse
                {
                    ExternalId = request.ExternalId,
                    Status = IHubWithdrawStatus.WITHDRAW_ERROR,
                    Error = $"Exception: {ex.Message}"
                }
            };
        }
    }

    public async Task<AcquirerClientResponse<IHubGetWithdrawResponse>> GetWithdrawAsync(
        string baseUrl, 
        string secretKey, 
        string withdrawId, 
        string searchBy = "id")
    {
        try
        {
            using var httpRequest = new HttpRequestMessage(
                HttpMethod.Get, 
                $"{baseUrl}/withdraws/collect/{withdrawId}?searchBy={searchBy}");
            httpRequest.Headers.Authorization = CreateAuthHeader(secretKey);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError(
                    "IHub get withdraw failed: {StatusCode} - {Body} - WithdrawId={WithdrawId}",
                    response.StatusCode, responseBody, withdrawId);
                return new AcquirerClientResponse<IHubGetWithdrawResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Get withdraw failed"
                };
            }

            return new AcquirerClientResponse<IHubGetWithdrawResponse>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = JsonSerializer.Deserialize<IHubGetWithdrawResponse>(responseBody, JsonOptions)
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting withdraw status via IHub Banking for {WithdrawId}", withdrawId);
            return new AcquirerClientResponse<IHubGetWithdrawResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

}
