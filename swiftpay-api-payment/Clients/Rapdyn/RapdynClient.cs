using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.Rapdyn.Models.Payments;
using swiftpay_api_payment.Clients.Rapdyn.Models.Withdrawals;
using swiftpay_api_payment.Interfaces.Acquirers;

namespace swiftpay_api_payment.Clients.Rapdyn;

public sealed class RapdynClient(
    HttpClient httpClient,
    ILogger<RapdynClient> logger
) : IRapdynClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<AcquirerClientResponse<RapdynPaymentResponse>> CreatePaymentAsync(
        string baseUrl,
        string token,
        RapdynCreatePaymentRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json");

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/payments")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = CreateAuthHeader(token);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = RapdynResponseParser.BuildErrorMessage(responseBody);
                logger.LogError("Rapdyn create payment failed: {StatusCode} - {Error}", response.StatusCode, errorMessage);
                return new AcquirerClientResponse<RapdynPaymentResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var data = JsonSerializer.Deserialize<RapdynPaymentResponse>(responseBody, JsonOptions);
            return new AcquirerClientResponse<RapdynPaymentResponse>
            {
                Success = data != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = data,
                ErrorMessage = data == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating payment via Rapdyn");
            return new AcquirerClientResponse<RapdynPaymentResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<RapdynGetTransactionResponse>> GetTransactionAsync(
        string baseUrl,
        string token,
        string transactionId)
    {
        try
        {
            using var httpRequest = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/transactions/{transactionId}");
            httpRequest.Headers.Authorization = CreateAuthHeader(token);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = RapdynResponseParser.BuildErrorMessage(responseBody);
                logger.LogError("Rapdyn get transaction failed: {StatusCode} - {Error}", response.StatusCode, errorMessage);
                return new AcquirerClientResponse<RapdynGetTransactionResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var data = JsonSerializer.Deserialize<RapdynGetTransactionResponse>(responseBody, JsonOptions);
            return new AcquirerClientResponse<RapdynGetTransactionResponse>
            {
                Success = data != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = data,
                ErrorMessage = data == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting transaction via Rapdyn for {TransactionId}", transactionId);
            return new AcquirerClientResponse<RapdynGetTransactionResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<RapdynTransferResponse>> CreateTransferAsync(
        string baseUrl,
        string token,
        RapdynCreateTransferRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json");

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/transfers/out")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = CreateAuthHeader(token);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = RapdynResponseParser.BuildErrorMessage(responseBody);
                logger.LogError("Rapdyn create transfer failed: {StatusCode} - {Error}", response.StatusCode, errorMessage);
                return new AcquirerClientResponse<RapdynTransferResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var data = JsonSerializer.Deserialize<RapdynTransferResponse>(responseBody, JsonOptions);
            return new AcquirerClientResponse<RapdynTransferResponse>
            {
                Success = data != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = data,
                ErrorMessage = data == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating transfer via Rapdyn");
            return new AcquirerClientResponse<RapdynTransferResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    private static AuthenticationHeaderValue CreateAuthHeader(string token)
    {
        return new AuthenticationHeaderValue("Bearer", token);
    }

}
