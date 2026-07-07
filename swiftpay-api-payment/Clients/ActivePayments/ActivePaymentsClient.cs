using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.ActivePayments.Models;
using swiftpay_api_payment.Clients.ActivePayments.Models.CreateBillet;
using swiftpay_api_payment.Clients.ActivePayments.Models.CreateCharge;
using swiftpay_api_payment.Clients.ActivePayments.Models.GetCharge;
using swiftpay_api_payment.Clients.ActivePayments.Models.Withdrawals;
using swiftpay_api_payment.Interfaces.Acquirers;

namespace swiftpay_api_payment.Clients.ActivePayments;

public sealed class ActivePaymentsClient(
    HttpClient httpClient,
    ILogger<ActivePaymentsClient> logger
) : IActivePaymentsClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<AcquirerClientResponse<ActivePaymentsCreateChargeResponse>> CreateChargeAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        ActivePaymentsCreateChargeRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json");

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/charges")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = CreateAuthHeader(publicKey, secretKey);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            var apiResponse = JsonSerializer.Deserialize<ActivePaymentsApiResponse<ActivePaymentsCreateChargeResponse>>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("ActivePayments create charge returned invalid JSON: {Body}", responseBody);
                return new AcquirerClientResponse<ActivePaymentsCreateChargeResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Invalid JSON response"
                };
            }

            if (!apiResponse.Success)
            {
                var errorMessage = ActivePaymentsResponseParser.BuildErrorMessage(apiResponse.Error);
                logger.LogError("ActivePayments create charge failed: {StatusCode} - {Error}", response.StatusCode, errorMessage);
                return new AcquirerClientResponse<ActivePaymentsCreateChargeResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorCode = apiResponse.Error?.Code,
                    ErrorMessage = errorMessage
                };
            }

            return new AcquirerClientResponse<ActivePaymentsCreateChargeResponse>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse.Data
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating charge via ActivePayments");
            return new AcquirerClientResponse<ActivePaymentsCreateChargeResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<ActivePaymentsCreateBilletResponse>> CreateBilletAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        ActivePaymentsCreateBilletRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json");

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/charges/billet")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = CreateAuthHeader(publicKey, secretKey);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            var apiResponse = JsonSerializer.Deserialize<ActivePaymentsApiResponse<ActivePaymentsCreateBilletResponse>>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("ActivePayments create billet returned invalid JSON: {Body}", responseBody);
                return new AcquirerClientResponse<ActivePaymentsCreateBilletResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Invalid JSON response"
                };
            }

            if (!apiResponse.Success)
            {
                var errorMessage = ActivePaymentsResponseParser.BuildErrorMessage(apiResponse.Error);
                logger.LogError("ActivePayments create billet failed: {StatusCode} - {Error}", response.StatusCode, errorMessage);
                return new AcquirerClientResponse<ActivePaymentsCreateBilletResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorCode = apiResponse.Error?.Code,
                    ErrorMessage = errorMessage
                };
            }

            return new AcquirerClientResponse<ActivePaymentsCreateBilletResponse>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse.Data
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating billet via ActivePayments");
            return new AcquirerClientResponse<ActivePaymentsCreateBilletResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<ActivePaymentsGetChargeResponse>> GetChargeAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        string chargeIdOrExternalId)
    {
        try
        {
            using var httpRequest = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/charges/{chargeIdOrExternalId}");
            httpRequest.Headers.Authorization = CreateAuthHeader(publicKey, secretKey);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            var apiResponse = JsonSerializer.Deserialize<ActivePaymentsApiResponse<ActivePaymentsGetChargeResponse>>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("ActivePayments get charge returned invalid JSON: {Body}", responseBody);
                return new AcquirerClientResponse<ActivePaymentsGetChargeResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Invalid JSON response"
                };
            }

            if (!apiResponse.Success)
            {
                var errorMessage = ActivePaymentsResponseParser.BuildErrorMessage(apiResponse.Error);
                logger.LogError("ActivePayments get charge failed: {StatusCode} - {Error}", response.StatusCode, errorMessage);
                return new AcquirerClientResponse<ActivePaymentsGetChargeResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorCode = apiResponse.Error?.Code,
                    ErrorMessage = errorMessage
                };
            }

            return new AcquirerClientResponse<ActivePaymentsGetChargeResponse>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse.Data
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting charge via ActivePayments for {ChargeId}", chargeIdOrExternalId);
            return new AcquirerClientResponse<ActivePaymentsGetChargeResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<ActivePaymentsWithdrawResponse>> CreateWithdrawAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        ActivePaymentsWithdrawRequest request,
        string? withdrawalSecret = null)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json");

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/withdrawals")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = CreateAuthHeader(publicKey, secretKey);

            if (!string.IsNullOrEmpty(withdrawalSecret))
                httpRequest.Headers.TryAddWithoutValidation("x-withdrawal-secret", withdrawalSecret);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            var apiResponse = JsonSerializer.Deserialize<ActivePaymentsApiResponse<ActivePaymentsWithdrawResponse>>(responseBody, JsonOptions);

            if (apiResponse == null)
            {
                logger.LogError("ActivePayments create withdraw returned invalid JSON: {Body}", responseBody);
                return new AcquirerClientResponse<ActivePaymentsWithdrawResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Invalid JSON response"
                };
            }

            if (!apiResponse.Success)
            {
                var errorMessage = ActivePaymentsResponseParser.BuildErrorMessage(apiResponse.Error);
                logger.LogError("ActivePayments create withdraw failed: {StatusCode} - {Error}", response.StatusCode, errorMessage);
                return new AcquirerClientResponse<ActivePaymentsWithdrawResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorCode = apiResponse.Error?.Code,
                    ErrorMessage = errorMessage
                };
            }

            return new AcquirerClientResponse<ActivePaymentsWithdrawResponse>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = apiResponse.Data
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating withdraw via ActivePayments");
            return new AcquirerClientResponse<ActivePaymentsWithdrawResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    private static AuthenticationHeaderValue CreateAuthHeader(string publicKey, string secretKey)
    {
        return new AuthenticationHeaderValue("ApiKey", $"{publicKey}:{secretKey}");
    }

}
