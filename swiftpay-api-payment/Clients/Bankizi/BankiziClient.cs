using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using safefy_api_payment.Clients;
using safefy_api_payment.Clients.Bankizi.Models;
using safefy_api_payment.Clients.Bankizi.Models.CreatePix;
using safefy_api_payment.Clients.Bankizi.Models.GetPix;
using safefy_api_payment.Clients.Bankizi.Models.Token;
using safefy_api_payment.Clients.Bankizi.Models.Withdrawals;
using safefy_api_payment.Interfaces.Acquirers;

namespace safefy_api_payment.Clients.Bankizi;

public sealed class BankiziClient(
    HttpClient httpClient,
    ILogger<BankiziClient> logger
) : IBankiziClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<AcquirerClientResponse<BankiziTokenResponse>> GetTokenAsync(string baseUrl, string clientId, string clientSecret)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/auth/oauth/token")
            {
                Content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    { "grant_type", "client_credentials" },
                    { "client_id", clientId },
                    { "client_secret", clientSecret }
                })
            };

            var response = await httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Bankizi token request failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                return new AcquirerClientResponse<BankiziTokenResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Token request failed"
                };
            }

            return new AcquirerClientResponse<BankiziTokenResponse>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = JsonSerializer.Deserialize<BankiziTokenResponse>(responseBody, JsonOptions)
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error requesting Bankizi token");
            return new AcquirerClientResponse<BankiziTokenResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<BankiziCreatePixResponse>> CreatePixAsync(string baseUrl, string accessToken, BankiziCreatePixRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/pix/qrcode/dynamic")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Bankizi create PIX failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                return new AcquirerClientResponse<BankiziCreatePixResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Create PIX failed"
                };
            }

            var apiResponse = JsonSerializer.Deserialize<BankiziApiResponse<BankiziCreatePixResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<BankiziCreatePixResponse>
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
            logger.LogError(ex, "Error creating PIX via Bankizi");
            return new AcquirerClientResponse<BankiziCreatePixResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<BankiziGetPixResponse>> GetPixAsync(string baseUrl, string accessToken, string txId)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/pix/qrcode/{txId}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Bankizi get PIX failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                return new AcquirerClientResponse<BankiziGetPixResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Get PIX failed"
                };
            }

            var apiResponse = JsonSerializer.Deserialize<BankiziApiResponse<BankiziGetPixResponse>>(responseBody, JsonOptions);
            return new AcquirerClientResponse<BankiziGetPixResponse>
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
            logger.LogError(ex, "Error getting PIX status via Bankizi for txId {TxId}", txId);
            return new AcquirerClientResponse<BankiziGetPixResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<BankiziWithdrawResponse>> WithdrawAsync(string baseUrl, string accessToken, BankiziWithdrawRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/pix/withdraw/direct")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError(
                    "Bankizi withdraw failed: {StatusCode} - {Body} - TxId={TxId}",
                    response.StatusCode, responseBody, request.TxId);
                
                var errorMessage = BankiziResponseParser.ParseBankiziError(responseBody, JsonOptions);
                
                return new AcquirerClientResponse<BankiziWithdrawResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage,
                    Data = new BankiziWithdrawResponse
                    {
                        TxId = request.TxId,
                        Status = BankiziWithdrawStatus.Failed,
                        ErrorMessage = errorMessage
                    }
                };
            }

            var apiResponse = JsonSerializer.Deserialize<BankiziApiResponse<BankiziWithdrawResponse>>(responseBody, JsonOptions);
            var withdrawResponse = apiResponse?.Data;

            return new AcquirerClientResponse<BankiziWithdrawResponse>
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
            logger.LogError(ex, "Error processing withdraw via Bankizi for TxId {TxId}", request.TxId);
            return new AcquirerClientResponse<BankiziWithdrawResponse>
            {
                Success = false,
                ErrorMessage = $"Exception: {ex.Message}",
                Data = new BankiziWithdrawResponse
                {
                    TxId = request.TxId,
                    Status = BankiziWithdrawStatus.Failed,
                    ErrorMessage = $"Exception: {ex.Message}"
                }
            };
        }
    }

}
