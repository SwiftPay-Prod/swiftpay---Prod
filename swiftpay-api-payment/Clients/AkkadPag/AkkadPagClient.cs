using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients.AkkadPag.Models;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;

namespace swiftpay_api_payment.Clients.AkkadPag;

public sealed class AkkadPagClient(
    HttpClient httpClient,
    ILogger<AkkadPagClient> logger
) : IAkkadPagClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<AcquirerClientResponse<AkkadPagPaymentResponse>> CreatePaymentAsync(AcquirerConfig config, AkkadPagPaymentRequest request)
    {
        var publicKey = config.GetCredential("publicKey");
        var secretKey = config.GetCredential("secretKey");
        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(secretKey))
        {
            return new AcquirerClientResponse<AkkadPagPaymentResponse>
            {
                Success = false,
                ErrorMessage = "AkkadPag credentials are missing."
            };
        }

        return await SendAsync<AkkadPagPaymentResponse>(config, HttpMethod.Post, "transactions", request, null, publicKey, secretKey);
    }

    public async Task<AcquirerClientResponse<AkkadPagPaymentResponse>> GetPaymentAsync(AcquirerConfig config, string paymentId)
    {
        var publicKey = config.GetCredential("publicKey");
        var secretKey = config.GetCredential("secretKey");
        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(secretKey))
        {
            return new AcquirerClientResponse<AkkadPagPaymentResponse>
            {
                Success = false,
                ErrorMessage = "AkkadPag credentials are missing."
            };
        }

        return await SendAsync<AkkadPagPaymentResponse>(config, HttpMethod.Get, $"transactions/{paymentId}", null, null, publicKey, secretKey);
    }

    public async Task<AcquirerClientResponse<AkkadPagWithdrawalResponse>> CreateTransferAsync(AcquirerConfig config, AkkadPagWithdrawalRequest request)
    {
        var publicKey = config.GetCredential("publicKey");
        var secretKey = config.GetCredential("secretKey");
        var withdrawalKey = config.GetCredential("withdrawalKey");
        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(secretKey) || string.IsNullOrEmpty(withdrawalKey))
        {
            return new AcquirerClientResponse<AkkadPagWithdrawalResponse>
            {
                Success = false,
                ErrorMessage = "AkkadPag withdrawal credentials are missing."
            };
        }

        return await SendAsync<AkkadPagWithdrawalResponse>(config, HttpMethod.Post, "transfers", request, new Dictionary<string, string>
        {
            ["x-withdrawal-key"] = withdrawalKey
        }, publicKey, secretKey);
    }

    public async Task<AcquirerClientResponse<AkkadPagWithdrawalResponse>> GetTransferAsync(AcquirerConfig config, string transferId)
    {
        var publicKey = config.GetCredential("publicKey");
        var secretKey = config.GetCredential("secretKey");
        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(secretKey))
        {
            return new AcquirerClientResponse<AkkadPagWithdrawalResponse>
            {
                Success = false,
                ErrorMessage = "AkkadPag credentials are missing."
            };
        }

        return await SendAsync<AkkadPagWithdrawalResponse>(config, HttpMethod.Get, $"transfers/{transferId}", null, null, publicKey, secretKey);
    }

    public async Task<AcquirerClientResponse<AkkadPagCompanyDetailsResponse>> GetCompanyDetailsAsync(AcquirerConfig config)
    {
        var publicKey = config.GetCredential("publicKey");
        var secretKey = config.GetCredential("secretKey");
        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(secretKey))
        {
            return new AcquirerClientResponse<AkkadPagCompanyDetailsResponse>
            {
                Success = false,
                ErrorMessage = "AkkadPag credentials are missing."
            };
        }

        return await SendAsync<AkkadPagCompanyDetailsResponse>(config, HttpMethod.Get, "company/details", null, null, publicKey, secretKey);
    }

    private async Task<AcquirerClientResponse<T>> SendAsync<T>(AcquirerConfig config, HttpMethod method, string relativeUrl, object? payload, IReadOnlyDictionary<string, string>? headers, string publicKey, string secretKey)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            using var requestMessage = new HttpRequestMessage(method, relativeUrl);
            requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes($"{publicKey}:{secretKey}")));

            if (headers is not null)
            {
                foreach (var header in headers)
                {
                    if (!requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value))
                    {
                        requestMessage.Content = new StringContent(header.Value);
                    }
                }
            }

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
                logger.LogWarning("AkkadPag {Method} {Url} failed: {StatusCode} {Body}", method, relativeUrl, response.StatusCode, body);
                return new AcquirerClientResponse<T>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ErrorMessage = $"AkkadPag {method} {relativeUrl} failed: {response.StatusCode}",
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
            logger.LogError(ex, "Error calling AkkadPag {Method} {Url}", method, relativeUrl);
            return new AcquirerClientResponse<T>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }
}
