using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients.FlevoPay.Models;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;

namespace swiftpay_api_payment.Clients.FlevoPay;

public sealed class FlevoPayClient(
    HttpClient httpClient,
    ILogger<FlevoPayClient> logger
) : IFlevoPayClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<AcquirerClientResponse<FlevoPayPaymentResponse>> CreatePaymentAsync(string apiKey, FlevoPayPaymentRequest request)
    {
        if (string.IsNullOrEmpty(apiKey))
        {
            return new AcquirerClientResponse<FlevoPayPaymentResponse>
            {
                Success = false,
                ErrorMessage = "FlevoPay credentials are missing."
            };
        }

        return await SendAsync<FlevoPayPaymentResponse>(apiKey, HttpMethod.Post, "transaction", request);
    }

    public async Task<AcquirerClientResponse<FlevoPayTransactionQueryResponse>> GetPaymentAsync(string apiKey, string transactionId)
    {
        if (string.IsNullOrEmpty(apiKey))
        {
            return new AcquirerClientResponse<FlevoPayTransactionQueryResponse>
            {
                Success = false,
                ErrorMessage = "FlevoPay credentials are missing."
            };
        }

        return await SendAsync<FlevoPayTransactionQueryResponse>(
            apiKey,
            HttpMethod.Get,
            $"query?action=get_transaction&id={Uri.EscapeDataString(transactionId)}",
            null);
    }

    public async Task<AcquirerClientResponse<FlevoPaySellerResponse>> GetSellerAsync(string apiKey)
    {
        if (string.IsNullOrEmpty(apiKey))
        {
            return new AcquirerClientResponse<FlevoPaySellerResponse>
            {
                Success = false,
                ErrorMessage = "FlevoPay credentials are missing."
            };
        }

        return await SendAsync<FlevoPaySellerResponse>(apiKey, HttpMethod.Get, "seller", null);
    }

    private async Task<AcquirerClientResponse<T>> SendAsync<T>(string apiKey, HttpMethod method, string relativeUrl, object? payload)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            using var requestMessage = new HttpRequestMessage(method, relativeUrl);
            requestMessage.Headers.Add("X-API-Key", apiKey);

            if (payload is not null)
            {
                requestMessage.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");
            }

            using var response = await httpClient.SendAsync(requestMessage);
            var body = await response.Content.ReadAsStringAsync();
            stopwatch.Stop();
            var responseTime = stopwatch.ElapsedMilliseconds;

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("FlevoPay {Method} {Url} failed: {StatusCode} {Body}", method, relativeUrl, response.StatusCode, body);
                return new AcquirerClientResponse<T>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ErrorMessage = $"FlevoPay {method} {relativeUrl} failed: {response.StatusCode}",
                    ResponseBody = body
                };
            }

            var data = JsonSerializer.Deserialize<T>(body, JsonOptions);
            return new AcquirerClientResponse<T>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                Data = data,
                ResponseBody = body
            };
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            logger.LogError(ex, "Error calling FlevoPay {Method} {Url}", method, relativeUrl);
            return new AcquirerClientResponse<T>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }
}