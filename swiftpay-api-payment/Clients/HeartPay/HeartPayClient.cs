using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using swiftpay_api_payment.Clients.Common;
using swiftpay_api_payment.Clients.HeartPay.Models.Boletos;
using swiftpay_api_payment.Clients.HeartPay.Models.Charges;
using swiftpay_api_payment.Clients.HeartPay.Models.Payouts;
using swiftpay_api_payment.Interfaces.Acquirers;

namespace swiftpay_api_payment.Clients.HeartPay;

public sealed class HeartPayClient(
    HttpClient httpClient,
    ILogger<HeartPayClient> logger
) : IHeartPayClient
{
    public Task<AcquirerClientResponse<HeartPayChargeData>> CreateChargeAsync(
        string baseUrl,
        string apiKey,
        HeartPayCreateChargeRequest request)
    {
        return SendChargeAsync(HttpMethod.Post, $"{baseUrl}/v1/client/charges", apiKey, request);
    }

    public Task<AcquirerClientResponse<HeartPayChargeData>> GetChargeAsync(
        string baseUrl,
        string apiKey,
        string chargeId)
    {
        return SendChargeAsync(HttpMethod.Get, $"{baseUrl}/v1/client/charges/{chargeId}", apiKey, null);
    }

    public Task<AcquirerClientResponse<HeartPayBoletoData>> CreateBoletoAsync(
        string baseUrl,
        string apiKey,
        HeartPayCreateBoletoRequest request)
    {
        return SendBoletoAsync(HttpMethod.Post, $"{baseUrl}/v1/client/boletos", apiKey, request);
    }

    public Task<AcquirerClientResponse<HeartPayPayoutData>> CreatePayoutAsync(
        string baseUrl,
        string apiKey,
        HeartPayCreatePayoutRequest request)
    {
        return SendPayoutAsync(HttpMethod.Post, $"{baseUrl}/v1/client/payouts", apiKey, request);
    }

    public Task<AcquirerClientResponse<HeartPayPayoutData>> GetPayoutAsync(
        string baseUrl,
        string apiKey,
        string payoutId)
    {
        return SendPayoutAsync(HttpMethod.Get, $"{baseUrl}/v1/client/payouts/{payoutId}", apiKey, null);
    }

    private async Task<AcquirerClientResponse<HeartPayChargeData>> SendChargeAsync(
        HttpMethod method,
        string url,
        string apiKey,
        object? body)
    {
        var response = await SendAsync(method, url, apiKey, body);
        if (!response.Success)
            return response.ToError<HeartPayChargeData>();

        if (!AcquirerJsonReader.TryParseJson(response.ResponseBody, out var document))
        {
            return new AcquirerClientResponse<HeartPayChargeData>
            {
                Success = false,
                StatusCode = response.StatusCode,
                ResponseBody = response.ResponseBody,
                ErrorMessage = "Invalid JSON response"
            };
        }

        using (document)
        {
            return new AcquirerClientResponse<HeartPayChargeData>
            {
                Success = true,
                StatusCode = response.StatusCode,
                ResponseBody = response.ResponseBody,
                Data = HeartPayResponseParser.ParseChargeData(document.RootElement)
            };
        }
    }

    private async Task<AcquirerClientResponse<HeartPayBoletoData>> SendBoletoAsync(
        HttpMethod method,
        string url,
        string apiKey,
        object? body)
    {
        var response = await SendAsync(method, url, apiKey, body);
        if (!response.Success)
            return response.ToError<HeartPayBoletoData>();

        if (!AcquirerJsonReader.TryParseJson(response.ResponseBody, out var document))
        {
            return new AcquirerClientResponse<HeartPayBoletoData>
            {
                Success = false,
                StatusCode = response.StatusCode,
                ResponseBody = response.ResponseBody,
                ErrorMessage = "Invalid JSON response"
            };
        }

        using (document)
        {
            return new AcquirerClientResponse<HeartPayBoletoData>
            {
                Success = true,
                StatusCode = response.StatusCode,
                ResponseBody = response.ResponseBody,
                Data = HeartPayResponseParser.ParseBoletoData(document.RootElement)
            };
        }
    }

    private async Task<AcquirerClientResponse<HeartPayPayoutData>> SendPayoutAsync(
        HttpMethod method,
        string url,
        string apiKey,
        object? body)
    {
        var response = await SendAsync(method, url, apiKey, body);
        if (!response.Success)
            return response.ToError<HeartPayPayoutData>();

        if (!AcquirerJsonReader.TryParseJson(response.ResponseBody, out var document))
        {
            return new AcquirerClientResponse<HeartPayPayoutData>
            {
                Success = false,
                StatusCode = response.StatusCode,
                ResponseBody = response.ResponseBody,
                ErrorMessage = "Invalid JSON response"
            };
        }

        using (document)
        {
            return new AcquirerClientResponse<HeartPayPayoutData>
            {
                Success = true,
                StatusCode = response.StatusCode,
                ResponseBody = response.ResponseBody,
                Data = HeartPayResponseParser.ParsePayoutData(document.RootElement)
            };
        }
    }

    private async Task<AcquirerClientResponseRaw> SendAsync(
        HttpMethod method,
        string url,
        string apiKey,
        object? body)
    {
        try
        {
            using var request = new HttpRequestMessage(method, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            if (body != null)
            {
                request.Content = new StringContent(
                    JsonSerializer.Serialize(body),
                    Encoding.UTF8,
                    "application/json");
            }

            using var response = await httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = HeartPayResponseParser.ExtractErrorMessage(responseBody);
                logger.LogError("HeartPay request failed: {StatusCode} - {Error}", response.StatusCode, errorMessage);

                return new AcquirerClientResponseRaw
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage,
                    ErrorCode = HeartPayResponseParser.ExtractErrorCode(responseBody)
                };
            }

            return new AcquirerClientResponseRaw
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling HeartPay endpoint {Url}", url);
            return new AcquirerClientResponseRaw
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    private sealed class AcquirerClientResponseRaw
    {
        public bool Success { get; set; }
        public int? StatusCode { get; set; }
        public string? ResponseBody { get; set; }
        public string? ErrorMessage { get; set; }
        public string? ErrorCode { get; set; }

        public AcquirerClientResponse<T> ToError<T>()
        {
            return new AcquirerClientResponse<T>
            {
                Success = false,
                StatusCode = StatusCode,
                ResponseBody = ResponseBody,
                ErrorMessage = ErrorMessage,
                ErrorCode = ErrorCode
            };
        }
    }
}
