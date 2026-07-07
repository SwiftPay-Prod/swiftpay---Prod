using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.Pluggou.Models;
using swiftpay_api_payment.Clients.Pluggou.Models.Transactions;
using swiftpay_api_payment.Clients.Pluggou.Models.Withdrawals;
using swiftpay_api_payment.Interfaces.Acquirers;

namespace swiftpay_api_payment.Clients.Pluggou;

public sealed class PluggouClient(
    HttpClient httpClient,
    ILogger<PluggouClient> logger
) : IPluggouClient
{
    private static readonly JsonSerializerOptions WriteOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private static readonly JsonSerializerOptions ReadOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<AcquirerClientResponse<PluggouApiResponse<PluggouTransactionData>>> CreateTransactionAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        PluggouCreateTransactionRequest request)
    {
        return await SendAsync<PluggouApiResponse<PluggouTransactionData>>(
            HttpMethod.Post,
            $"{baseUrl}/transactions",
            publicKey,
            secretKey,
            request);
    }

    public async Task<AcquirerClientResponse<PluggouApiResponse<PluggouTransactionData>>> GetTransactionAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        string transactionId)
    {
        return await SendAsync<PluggouApiResponse<PluggouTransactionData>>(
            HttpMethod.Get,
            $"{baseUrl}/transactions/{transactionId}",
            publicKey,
            secretKey);
    }

    public async Task<AcquirerClientResponse<PluggouApiResponse<PluggouWithdrawalData>>> CreateWithdrawalAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        PluggouCreateWithdrawalRequest request)
    {
        return await SendAsync<PluggouApiResponse<PluggouWithdrawalData>>(
            HttpMethod.Post,
            $"{baseUrl}/withdrawals",
            publicKey,
            secretKey,
            request);
    }

    private async Task<AcquirerClientResponse<T>> SendAsync<T>(
        HttpMethod method,
        string url,
        string publicKey,
        string secretKey,
        object? body = null)
    {
        try
        {
            using var httpRequest = new HttpRequestMessage(method, url);
            httpRequest.Headers.Add("X-Public-Key", publicKey);
            httpRequest.Headers.Add("X-Secret-Key", secretKey);

            if (body != null)
            {
                var content = new StringContent(
                    JsonSerializer.Serialize(body, WriteOptions),
                    Encoding.UTF8,
                    "application/json");
                httpRequest.Content = content;
            }

            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = PluggouResponseParser.BuildErrorMessage(responseBody);
                logger.LogError("Pluggou request failed: {StatusCode} - {Error}", response.StatusCode, errorMessage);

                return new AcquirerClientResponse<T>
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ResponseBody = responseBody,
                    ErrorMessage = errorMessage
                };
            }

            var data = JsonSerializer.Deserialize<T>(responseBody, ReadOptions);
            if (data == null)
            {
                logger.LogError("Pluggou returned invalid JSON: {Body}", responseBody);
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
            logger.LogError(ex, "Error calling Pluggou endpoint {Url}", url);
            return new AcquirerClientResponse<T>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

}
