using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.HunterPay.Models.Transactions;
using swiftpay_api_payment.Clients.HunterPay.Models.Withdrawals;
using swiftpay_api_payment.Interfaces.Acquirers;

namespace swiftpay_api_payment.Clients.HunterPay;

public sealed class HunterPayClient(
    HttpClient httpClient,
    ILogger<HunterPayClient> logger
) : IHunterPayClient
{
    private static readonly JsonSerializerOptions WriteOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private static readonly JsonSerializerOptions ReadOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public Task<AcquirerClientResponse<HunterPayTransactionData>> CreateTransactionAsync(
        string baseUrl,
        string apiKey,
        string? companyId,
        HunterPayCreateTransactionRequest request)
    {
        return SendAsync<HunterPayTransactionData>(
            HttpMethod.Post,
            $"{baseUrl}/transactions",
            apiKey,
            companyId,
            request);
    }

    public Task<AcquirerClientResponse<HunterPayTransactionData>> GetTransactionAsync(
        string baseUrl,
        string apiKey,
        string? companyId,
        string transactionId)
    {
        return SendAsync<HunterPayTransactionData>(
            HttpMethod.Get,
            $"{baseUrl}/transactions/{transactionId}",
            apiKey,
            companyId);
    }

    public Task<AcquirerClientResponse<HunterPayWithdrawalResponse>> CreateWithdrawalAsync(
        string baseUrl,
        string apiKey,
        string? companyId,
        string idempotencyKey,
        HunterPayCreateWithdrawalRequest request)
    {
        return SendAsync<HunterPayWithdrawalResponse>(
            HttpMethod.Post,
            $"{baseUrl}/withdrawals/cashout",
            apiKey,
            companyId,
            request,
            idempotencyKey);
    }

    private async Task<AcquirerClientResponse<T>> SendAsync<T>(
        HttpMethod method,
        string url,
        string apiKey,
        string? companyId,
        object? body = null,
        string? idempotencyKey = null)
    {
        try
        {
            var response = await SendWithAuthFallbackAsync(method, url, apiKey, companyId, body, idempotencyKey);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = HunterPayResponseParser.BuildErrorMessage(responseBody);
                logger.LogError("HunterPay request failed: {StatusCode} - {Error}", response.StatusCode, errorMessage);

                return new AcquirerClientResponse<T>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage,
                    ErrorCode = HunterPayResponseParser.ExtractErrorCode(responseBody)
                };
            }

            var data = JsonSerializer.Deserialize<T>(responseBody, ReadOptions);
            if (data == null)
            {
                logger.LogError("HunterPay returned invalid JSON: {Body}", responseBody);
                return new AcquirerClientResponse<T>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = "Invalid JSON response"
                };
            }

            return new AcquirerClientResponse<T>
            {
                Success = true,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody,
                Data = data
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling HunterPay endpoint {Url}", url);
            return new AcquirerClientResponse<T>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    private async Task<HttpResponseMessage> SendWithAuthFallbackAsync(
        HttpMethod method,
        string url,
        string apiKey,
        string? companyId,
        object? body,
        string? idempotencyKey)
    {
        foreach (var authorization in BuildAuthHeaders(apiKey, companyId))
        {
            var response = await SendOnceAsync(method, url, authorization, body, idempotencyKey);
            if (response.StatusCode != HttpStatusCode.Unauthorized)
            {
                return response;
            }

            response.Dispose();
        }

        return await SendOnceAsync(method, url, BuildAuthHeaders(apiKey, companyId).Last(), body, idempotencyKey);
    }

    private async Task<HttpResponseMessage> SendOnceAsync(
        HttpMethod method,
        string url,
        AuthenticationHeaderValue authorization,
        object? body,
        string? idempotencyKey)
    {
        using var httpRequest = new HttpRequestMessage(method, url);
        httpRequest.Headers.Authorization = authorization;
        httpRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        if (!string.IsNullOrWhiteSpace(idempotencyKey))
        {
            httpRequest.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);
        }

        if (body != null)
        {
            httpRequest.Content = new StringContent(
                JsonSerializer.Serialize(body, WriteOptions),
                Encoding.UTF8,
                "application/json");
        }

        return await httpClient.SendAsync(httpRequest);
    }

    private static IReadOnlyList<AuthenticationHeaderValue> BuildAuthHeaders(string apiKey, string? companyId)
    {
        var rawValues = new List<string>();

        if (!string.IsNullOrWhiteSpace(companyId))
        {
            rawValues.Add($"{apiKey}:{companyId.Trim()}");
        }

        rawValues.Add($"{apiKey}:");
        rawValues.Add($"{apiKey}:x");

        return rawValues
            .Distinct(StringComparer.Ordinal)
            .Select(raw => new AuthenticationHeaderValue(
                "Basic",
                Convert.ToBase64String(Encoding.UTF8.GetBytes(raw))))
            .ToArray();
    }

}
