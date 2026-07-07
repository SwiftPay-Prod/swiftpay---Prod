using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Utils;

namespace swiftpay_api_payment.Services.Helpers;

public static class WebhookLogHelper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public static async Task LogErrorAsync(
        IApiLogService apiLogService,
        PrimaryDbContext dbContext,
        HttpContext httpContext,
        AcquirerType acquirerType,
        string? errorMessage,
        string? errorCode,
        object? request,
        object? response,
        string? acquirerPaymentId = null,
        string? txId = null,
        CancellationToken ct = default)
    {
        await LogEventAsync(
            apiLogService,
            dbContext,
            httpContext,
            acquirerType,
            ApiLogStatus.Failed,
            errorMessage,
            errorCode,
            request,
            response,
            acquirerPaymentId,
            txId,
            null,
            null,
            ct);
    }

    public static async Task LogEventAsync(
        IApiLogService apiLogService,
        PrimaryDbContext dbContext,
        HttpContext httpContext,
        AcquirerType acquirerType,
        ApiLogStatus status,
        string? details,
        string? errorCode,
        object? request,
        object? response,
        string? acquirerPaymentId = null,
        string? txId = null,
        Guid? resourceIdOverride = null,
        ApiLogResourceType? resourceTypeOverride = null,
        CancellationToken ct = default)
    {
        var merchantInfo = await ResolveMerchantInfoAsync(dbContext, acquirerPaymentId, txId, ct);
        if (merchantInfo == null && !resourceIdOverride.HasValue)
        {
            return;
        }

        var merchantId = merchantInfo?.MerchantId ?? Guid.Empty;
        var merchantName = merchantInfo?.MerchantName;
        var merchantDocument = merchantInfo?.MerchantDocument;
        var acquirerId = merchantInfo?.AcquirerId;
        var resourceId = resourceIdOverride ?? merchantInfo?.ResourceId;
        var resourceType = resourceTypeOverride ?? merchantInfo?.ResourceType;

        if (merchantId == Guid.Empty)
        {
            return;
        }

        var ipAddress = EndpointUtils.GetIpAddress(httpContext);
        var userAgent = EndpointUtils.GetUserAgent(httpContext);

        apiLogService.SetContext(merchantId, merchantName, merchantDocument, null, ipAddress, userAgent);

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.AcquirerWebhookReceived,
            Status = status,
            MerchantId = merchantId,
            MerchantName = merchantName,
            MerchantDocument = merchantDocument,
            StatusCode = httpContext.Response?.StatusCode ?? 200,
            Details = details,
            ErrorCode = errorCode,
            RequestBody = SerializeSafely(request),
            ResponseBody = SerializeSafely(response),
            AcquirerId = acquirerId,
            AcquirerType = acquirerType.ToString(),
            ResourceId = resourceId,
            ResourceType = resourceType
        });
    }

    private static async Task<(Guid MerchantId, string? MerchantName, string? MerchantDocument, Guid? AcquirerId, Guid? ResourceId, ApiLogResourceType ResourceType)?> ResolveMerchantInfoAsync(
        PrimaryDbContext dbContext,
        string? acquirerPaymentId,
        string? txId,
        CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(acquirerPaymentId) || !string.IsNullOrWhiteSpace(txId))
        {
            var paymentInfo = await dbContext.Payments
                .AsNoTracking()
                .Where(p =>
                    (!string.IsNullOrWhiteSpace(acquirerPaymentId) && p.AcquirerPaymentId == acquirerPaymentId) ||
                    (!string.IsNullOrWhiteSpace(txId) && (
                        p.AcquirerTransactionId == txId ||
                        (p.PaymentPix != null && p.PaymentPix.TxId == txId))))
                .Select(p => new
                {
                    p.Id,
                    p.MerchantId,
                    MerchantName = p.Merchant.Name,
                    MerchantDocument = p.Merchant.MerchantKyc != null ? p.Merchant.MerchantKyc.DocumentNumber : null,
                    p.AcquirerId
                })
                .FirstOrDefaultAsync(ct);

            if (paymentInfo != null)
            {
                return (paymentInfo.MerchantId, paymentInfo.MerchantName, paymentInfo.MerchantDocument, paymentInfo.AcquirerId, paymentInfo.Id, ApiLogResourceType.Payment);
            }

            var payoutInfo = await dbContext.Payouts
                .AsNoTracking()
                .Where(p =>
                    !string.IsNullOrWhiteSpace(txId) && p.AcquirerTransactionId == txId)
                .Select(p => new
                {
                    p.Id,
                    p.MerchantId,
                    MerchantName = p.Merchant.Name,
                    MerchantDocument = p.Merchant.MerchantKyc != null ? p.Merchant.MerchantKyc.DocumentNumber : null,
                    AcquirerId = p.MerchantAcquirer.AcquirerId
                })
                .FirstOrDefaultAsync(ct);

            if (payoutInfo != null)
            {
                return (payoutInfo.MerchantId, payoutInfo.MerchantName, payoutInfo.MerchantDocument, payoutInfo.AcquirerId, payoutInfo.Id, ApiLogResourceType.Payout);
            }
        }

        return null;
    }

    private static string? SerializeSafely(object? value)
    {
        if (value == null)
        {
            return null;
        }

        try
        {
            return JsonSerializer.Serialize(value, JsonOptions);
        }
        catch
        {
            return null;
        }
    }
}
