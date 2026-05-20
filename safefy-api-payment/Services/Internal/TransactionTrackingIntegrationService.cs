using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Integrations;
using safefy_api_payment.Interfaces.Internal;
using safefy_api_payment.Services.Internal.Tracking;

namespace safefy_api_payment.Services.Internal;

public sealed class TransactionTrackingIntegrationService(
    PrimaryDbContext dbContext,
    IHttpClientFactory httpClientFactory,
    ILogger<TransactionTrackingIntegrationService> logger
) : ITransactionTrackingIntegrationService
{
    public async Task NotifyPaymentStatusAsync(
        Guid paymentId,
        Guid merchantId,
        PaymentStatus status,
        ApiEnvironment environment,
        CancellationToken ct = default)
    {
        try
        {
            var notificationKey = GetNotificationKey(status);
            var utmifyStatusValue = GetUtmifyStatus(status);
            var otimizeyStatusValue = GetOtimizeyStatus(status);
            var facebookCapiEventName = GetFacebookCapiEventName(status);

            if (notificationKey == null)
                return;

            var payments = dbContext.Payments!;

            var payment = await payments
                .IgnoreQueryFilters()
                .OrderBy(p => p.Id)
                .FirstOrDefaultAsync(
                    p => p.Id == paymentId
                      && p.MerchantId == merchantId
                      && p.Environment == environment,
                    ct);

            if (payment == null)
                return;

            Customer? customer = null;
            if (payment.CustomerId.HasValue)
            {
                var customers = dbContext.Customers!;

                customer = await customers
                    .IgnoreQueryFilters()
                    .OrderBy(c => c.Id)
                    .FirstOrDefaultAsync(c => c.Id == payment.CustomerId.Value && c.Environment == environment, ct);
            }

            List<OrderItem>? orderItems = null;
            if (payment.OrderId.HasValue)
            {
                var orderItemsSet = dbContext.OrderItems!;

                orderItems = await orderItemsSet
                    .IgnoreQueryFilters()
                    .Where(i => i.OrderId == payment.OrderId.Value)
                    .OrderBy(i => i.Id)
                    .ToListAsync(ct);
            }

            var merchantIntegrations = dbContext.MerchantIntegrations!;

            var integrations = await merchantIntegrations
                .IgnoreQueryFilters()
                .Where(mi =>
                    mi.MerchantId == merchantId
                    && mi.Environment == environment
                    && (mi.Provider == MerchantIntegrationProvider.Utmify
                        || mi.Provider == MerchantIntegrationProvider.Otimizey
                        || mi.Provider == MerchantIntegrationProvider.FacebookCapi))
                .OrderBy(mi => mi.Provider)
                .ThenBy(mi => mi.Id)
                .ToListAsync(ct);

            var utmifyIntegration = integrations.FirstOrDefault(i => i.Provider == MerchantIntegrationProvider.Utmify);
            var otimizeyIntegration = integrations.FirstOrDefault(i => i.Provider == MerchantIntegrationProvider.Otimizey);
            var facebookCapiIntegration = integrations.FirstOrDefault(i => i.Provider == MerchantIntegrationProvider.FacebookCapi);

            if (utmifyStatusValue != null)
            {
                var utmifyApiToken = GetProviderCredential(utmifyIntegration, MerchantIntegrationProvider.Utmify);

                if (utmifyIntegration != null
                    && utmifyIntegration.IsEnabled
                    && GetNotificationEnabled(utmifyIntegration, notificationKey)
                    && !string.IsNullOrWhiteSpace(utmifyApiToken))
                {
                    await UtmifyTrackingDispatcher.SendAsync(
                        httpClientFactory,
                        logger,
                        paymentId,
                        status,
                        utmifyApiToken,
                        payment,
                        utmifyStatusValue,
                        customer,
                        orderItems,
                        ct);
                }
            }

            var otimizeyCredentialId = GetProviderCredential(otimizeyIntegration, MerchantIntegrationProvider.Otimizey);

            if (otimizeyStatusValue != null
                && otimizeyIntegration != null
                && otimizeyIntegration.IsEnabled
                && GetNotificationEnabled(otimizeyIntegration, notificationKey)
                && !string.IsNullOrWhiteSpace(otimizeyCredentialId))
            {
                await OtimizeyTrackingDispatcher.SendAsync(
                    httpClientFactory,
                    logger,
                    paymentId,
                    status,
                    otimizeyCredentialId,
                    payment,
                    otimizeyStatusValue,
                    customer,
                    orderItems,
                    ct);
            }

            if (facebookCapiEventName != null
                && facebookCapiIntegration != null
                && facebookCapiIntegration.IsEnabled
                && GetNotificationEnabled(facebookCapiIntegration, notificationKey)
                && TryGetFacebookCapiConfig(facebookCapiIntegration, out var pixelId, out var accessToken, out var testEventCode))
            {
                await FacebookCapiTrackingDispatcher.SendAsync(
                    httpClientFactory,
                    logger,
                    paymentId,
                    status,
                    pixelId,
                    accessToken,
                    testEventCode,
                    payment,
                    facebookCapiEventName,
                    customer,
                    orderItems,
                    ct);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Error sending payment tracking event: PaymentId={PaymentId}, Status={Status}",
                paymentId,
                status);
        }
    }

    private static bool GetNotificationEnabled(MerchantIntegration integration, string notificationKey)
    {
        return notificationKey switch
        {
            "waitingPayment" => integration.WaitingPaymentEnabled,
            "paid" => integration.PaidEnabled,
            "refused" => integration.RefusedEnabled,
            "refunded" => integration.RefundedEnabled,
            "chargedback" => integration.ChargedbackEnabled,
            _ => true,
        };
    }

    private static string? GetProviderCredential(MerchantIntegration? integration, MerchantIntegrationProvider provider)
    {
        if (integration == null)
            return null;

        var values = integration.ConfigValues;
        if (values == null)
            return null;

        var key = provider switch
        {
            MerchantIntegrationProvider.Utmify => "apiToken",
            MerchantIntegrationProvider.Otimizey => "credentialId",
            _ => null,
        };

        if (string.IsNullOrWhiteSpace(key))
            return null;

        if (!values.TryGetValue(key, out var credential) || string.IsNullOrWhiteSpace(credential))
            return null;

        return credential.Trim();
    }

    private static bool TryGetFacebookCapiConfig(
        MerchantIntegration integration,
        out string pixelId,
        out string accessToken,
        out string? testEventCode)
    {
        pixelId = string.Empty;
        accessToken = string.Empty;
        testEventCode = null;

        var values = integration.ConfigValues;
        if (values == null)
            return false;

        if (!values.TryGetValue("pixelId", out var rawPixelId) || string.IsNullOrWhiteSpace(rawPixelId))
            return false;

        if (!values.TryGetValue("accessToken", out var rawAccessToken) || string.IsNullOrWhiteSpace(rawAccessToken))
            return false;

        pixelId = rawPixelId.Trim();
        accessToken = rawAccessToken.Trim();
        testEventCode = values.TryGetValue("testEventCode", out var rawTestEventCode) && !string.IsNullOrWhiteSpace(rawTestEventCode)
            ? rawTestEventCode.Trim()
            : null;

        return true;
    }

    private static string? GetNotificationKey(PaymentStatus status)
    {
        return status switch
        {
            PaymentStatus.Pending => "waitingPayment",
            PaymentStatus.Completed => "paid",
            PaymentStatus.Failed => "refused",
            PaymentStatus.Cancelled => "refused",
            PaymentStatus.Expired => "refused",
            PaymentStatus.Refunded => "refunded",
            PaymentStatus.PartiallyRefunded => "refunded",
            PaymentStatus.Disputed => "chargedback",
            _ => null
        };
    }

    private static string? GetUtmifyStatus(PaymentStatus status)
    {
        return status switch
        {
            PaymentStatus.Pending => "waiting_payment",
            PaymentStatus.Completed => "paid",
            PaymentStatus.Failed => "refused",
            PaymentStatus.Cancelled => "refused",
            PaymentStatus.Expired => "refused",
            PaymentStatus.Refunded => "refunded",
            PaymentStatus.PartiallyRefunded => "refunded",
            PaymentStatus.Disputed => "chargedback",
            _ => null
        };
    }

    private static string? GetOtimizeyStatus(PaymentStatus status)
    {
        return status switch
        {
            PaymentStatus.Pending => "waiting_payment",
            PaymentStatus.Processing => "in_process",
            PaymentStatus.Completed => "paid",
            PaymentStatus.Failed => "refused",
            PaymentStatus.Cancelled => "refused",
            PaymentStatus.Expired => "expired",
            PaymentStatus.Refunded => "refunded",
            PaymentStatus.PartiallyRefunded => "refunded",
            PaymentStatus.Disputed => "in_dispute",
            _ => null
        };
    }

    private static string? GetFacebookCapiEventName(PaymentStatus status)
    {
        return status switch
        {
            PaymentStatus.Completed => "Purchase",
            PaymentStatus.Pending => null,
            PaymentStatus.Processing => null,
            PaymentStatus.Failed => null,
            PaymentStatus.Cancelled => null,
            PaymentStatus.Expired => null,
            PaymentStatus.Refunded => null,
            PaymentStatus.PartiallyRefunded => null,
            PaymentStatus.Disputed => null,
            _ => null
        };
    }

}
