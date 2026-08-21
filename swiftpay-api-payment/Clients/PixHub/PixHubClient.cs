using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using swiftpay_api_payment.Clients.PixHub.Models;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Clients.PixHub;

public sealed class PixHubClient(
    HttpClient httpClient,
    IMemoryCache memoryCache,
    ILogger<PixHubClient> logger) : IPixHubClient
{
    private const string BaseUrl = "https://api.usepixhub.com";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<AcquirerClientResponse<PixHubApiResponse<PixHubTransactionData>>> CreatePixQrCodeAsync(
        string apiKey,
        string apiSecret,
        PixHubCreatePixRequest request,
        CancellationToken ct = default)
    {
        var token = await GetOrRefreshTokenAsync(apiKey, apiSecret, ct);
        if (string.IsNullOrEmpty(token))
        {
            return new AcquirerClientResponse<PixHubApiResponse<PixHubTransactionData>>
            {
                Success = false,
                ErrorMessage = "Falha ao autenticar na API PixHub."
            };
        }

        return await SendAsync<PixHubApiResponse<PixHubTransactionData>>(
            token,
            HttpMethod.Post,
            "/api/v1/pix/in/qrcode",
            request,
            null,
            ct);
    }

    public async Task<AcquirerClientResponse<PixHubApiResponse<PixHubTransactionData>>> GetPixQrCodeAsync(
        string apiKey,
        string apiSecret,
        string transactionId,
        CancellationToken ct = default)
    {
        var token = await GetOrRefreshTokenAsync(apiKey, apiSecret, ct);
        if (string.IsNullOrEmpty(token))
        {
            return new AcquirerClientResponse<PixHubApiResponse<PixHubTransactionData>>
            {
                Success = false,
                ErrorMessage = "Falha ao autenticar na API PixHub."
            };
        }

        return await SendAsync<PixHubApiResponse<PixHubTransactionData>>(
            token,
            HttpMethod.Get,
            $"/api/v1/pix/in/qrcode/{Uri.EscapeDataString(transactionId)}",
            null,
            null,
            ct);
    }

    public async Task<AcquirerClientResponse<PixHubApiResponse<PixHubTransferData>>> CreateTransferAsync(
        string apiKey,
        string apiSecret,
        string idempotencyKey,
        PixHubTransferRequest request,
        CancellationToken ct = default)
    {
        var token = await GetOrRefreshTokenAsync(apiKey, apiSecret, ct);
        if (string.IsNullOrEmpty(token))
        {
            return new AcquirerClientResponse<PixHubApiResponse<PixHubTransferData>>
            {
                Success = false,
                ErrorMessage = "Falha ao autenticar na API PixHub."
            };
        }

        var headers = new Dictionary<string, string>
        {
            ["x-idempotency-key"] = idempotencyKey
        };

        return await SendAsync<PixHubApiResponse<PixHubTransferData>>(
            token,
            HttpMethod.Post,
            "/api/v1/pix/out/pixkey",
            request,
            headers,
            ct);
    }

    public async Task<AcquirerClientResponse<PixHubApiResponse<PixHubTransferData>>> GetTransferAsync(
        string apiKey,
        string apiSecret,
        string transferId,
        CancellationToken ct = default)
    {
        var token = await GetOrRefreshTokenAsync(apiKey, apiSecret, ct);
        if (string.IsNullOrEmpty(token))
        {
            return new AcquirerClientResponse<PixHubApiResponse<PixHubTransferData>>
            {
                Success = false,
                ErrorMessage = "Falha ao autenticar na API PixHub."
            };
        }

        return await SendAsync<PixHubApiResponse<PixHubTransferData>>(
            token,
            HttpMethod.Get,
            $"/api/v1/pix/out/pixkey/{Uri.EscapeDataString(transferId)}",
            null,
            null,
            ct);
    }

    public async Task<AcquirerClientResponse<PixHubApiResponse<PixHubBalanceData>>> GetBalanceAsync(
        string apiKey,
        string apiSecret,
        CancellationToken ct = default)
    {
        var token = await GetOrRefreshTokenAsync(apiKey, apiSecret, ct);
        if (string.IsNullOrEmpty(token))
        {
            return new AcquirerClientResponse<PixHubApiResponse<PixHubBalanceData>>
            {
                Success = false,
                ErrorMessage = "Falha ao autenticar na API PixHub."
            };
        }

        return await SendAsync<PixHubApiResponse<PixHubBalanceData>>(
            token,
            HttpMethod.Get,
            "/api/v1/balance",
            null,
            null,
            ct);
    }

    private async Task<string?> GetOrRefreshTokenAsync(string apiKey, string apiSecret, CancellationToken ct)
    {
        var cacheKey = $"pixhub_token_{apiKey}";
        if (memoryCache.TryGetValue(cacheKey, out string? cachedToken) && !string.IsNullOrEmpty(cachedToken))
        {
            return cachedToken;
        }

        try
        {
            var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{apiKey}:{apiSecret}"));
            using var authRequest = new HttpRequestMessage(HttpMethod.Post, $"{BaseUrl}/api/auth");
            authRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);

            using var authResponse = await httpClient.SendAsync(authRequest, ct);
            var responseBody = await authResponse.Content.ReadAsStringAsync(ct);

            if (!authResponse.IsSuccessStatusCode)
            {
                logger.LogError("PixHub auth failed with status {StatusCode}: {Body}", authResponse.StatusCode, responseBody);
                return null;
            }

            var authResult = JsonSerializer.Deserialize<PixHubAuthResponse>(responseBody, JsonOptions);
            if (authResult is { Success: true, Token: not null })
            {
                memoryCache.Set(cacheKey, authResult.Token, TimeSpan.FromSeconds(45));
                return authResult.Token;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error authenticating with PixHub API");
        }

        return null;
    }

    private async Task<AcquirerClientResponse<T>> SendAsync<T>(
        string bearerToken,
        HttpMethod method,
        string relativeUrl,
        object? payload,
        IReadOnlyDictionary<string, string>? headers,
        CancellationToken ct)
    {
        var uri = relativeUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? relativeUrl
            : $"{BaseUrl}{relativeUrl}";

        using var requestMessage = new HttpRequestMessage(method, uri);
        requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);

        if (headers != null)
        {
            foreach (var (headerKey, headerValue) in headers)
            {
                requestMessage.Headers.TryAddWithoutValidation(headerKey, headerValue);
            }
        }

        if (payload != null)
        {
            var json = JsonSerializer.Serialize(payload, JsonOptions);
            requestMessage.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        try
        {
            using var response = await httpClient.SendAsync(requestMessage, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                return new AcquirerClientResponse<T>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ErrorMessage = body,
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
            logger.LogError(ex, "HTTP request to PixHub failed for {Uri}", uri);
            return new AcquirerClientResponse<T>
            {
                Success = false,
                StatusCode = 0,
                ErrorMessage = ex.Message
            };
        }
    }
}
