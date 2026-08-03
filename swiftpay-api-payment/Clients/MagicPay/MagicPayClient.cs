using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients.MagicPay.Models;
using swiftpay_api_payment.Clients.MagicPay.Utils;
using swiftpay_api_payment.Interfaces.Acquirers;

namespace swiftpay_api_payment.Clients.MagicPay;

public sealed class MagicPayClient(
    HttpClient httpClient,
    ILogger<MagicPayClient> logger
) : IMagicPayClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new MagicPayDateTimeConverter(), new MagicPayDateTimeRequiredConverter() }
    };

    public async Task<AcquirerClientResponse<MagicPayPaymentResponse>> CreatePaymentAsync(string baseUrl, string apiKey, MagicPayPaymentRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/payment")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("MagicPay create payment failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                return new AcquirerClientResponse<MagicPayPaymentResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = ParseError(responseBody)
                };
            }

            var data = JsonSerializer.Deserialize<MagicPayPaymentResponse>(responseBody, JsonOptions);
            return new AcquirerClientResponse<MagicPayPaymentResponse>
            {
                Success = data?.Id != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = data,
                ErrorMessage = data?.Id == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating payment via MagicPay");
            return new AcquirerClientResponse<MagicPayPaymentResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<MagicPayPaymentResponse>> GetPaymentAsync(string baseUrl, string apiKey, string paymentId)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/payment/{paymentId}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("MagicPay get payment failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                return new AcquirerClientResponse<MagicPayPaymentResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = ParseError(responseBody)
                };
            }

            var data = JsonSerializer.Deserialize<MagicPayPaymentResponse>(responseBody, JsonOptions);
            return new AcquirerClientResponse<MagicPayPaymentResponse>
            {
                Success = data?.Id != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = data,
                ErrorMessage = data?.Id == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting payment via MagicPay for {PaymentId}", paymentId);
            return new AcquirerClientResponse<MagicPayPaymentResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<MagicPayPaymentResponse>> RefundPaymentAsync(string baseUrl, string apiKey, string paymentId)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/payment/{paymentId}/refund");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("MagicPay refund payment failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                return new AcquirerClientResponse<MagicPayPaymentResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = ParseError(responseBody)
                };
            }

            var data = JsonSerializer.Deserialize<MagicPayPaymentResponse>(responseBody, JsonOptions);
            return new AcquirerClientResponse<MagicPayPaymentResponse>
            {
                Success = data?.Id != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = data,
                ErrorMessage = data?.Id == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error refunding payment via MagicPay for {PaymentId}", paymentId);
            return new AcquirerClientResponse<MagicPayPaymentResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<MagicPayTransferResponse>> CreateTransferAsync(string baseUrl, string apiKey, MagicPayTransferRequest request)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(request, JsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/transfer")
            {
                Content = content
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("MagicPay create transfer failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                return new AcquirerClientResponse<MagicPayTransferResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = ParseError(responseBody)
                };
            }

            var data = JsonSerializer.Deserialize<MagicPayTransferResponse>(responseBody, JsonOptions);
            return new AcquirerClientResponse<MagicPayTransferResponse>
            {
                Success = data?.Id != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = data,
                ErrorMessage = data?.Id == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating transfer via MagicPay");
            return new AcquirerClientResponse<MagicPayTransferResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AcquirerClientResponse<MagicPayTransferResponse>> GetTransferAsync(string baseUrl, string apiKey, string transferId)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/transfer/{transferId}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("MagicPay get transfer failed: {StatusCode} - {Body}", response.StatusCode, responseBody);
                return new AcquirerClientResponse<MagicPayTransferResponse>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = ParseError(responseBody)
                };
            }

            var data = JsonSerializer.Deserialize<MagicPayTransferResponse>(responseBody, JsonOptions);
            return new AcquirerClientResponse<MagicPayTransferResponse>
            {
                Success = data?.Id != null,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = data,
                ErrorMessage = data?.Id == null ? "Invalid JSON response" : null
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting transfer via MagicPay for {TransferId}", transferId);
            return new AcquirerClientResponse<MagicPayTransferResponse>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    private static string? ParseError(string responseBody)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            if (doc.RootElement.TryGetProperty("error", out var error))
            {
                return error.GetString();
            }
            if (doc.RootElement.TryGetProperty("message", out var message))
            {
                return message.GetString();
            }
        }
        catch
        {
        }

        return null;
    }
}
