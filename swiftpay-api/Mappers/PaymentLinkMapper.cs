using swiftpay_api.Endpoints.Merchants.Payments.ReadListPaymentLinks;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Mappers;

public static class PaymentLinkMapper
{
    public static MinimalPaymentLink ToMinimalData(
        PaymentLink paymentLink,
        PlatformSettings platformSettings,
        MerchantSettings? merchantSettings = null)
    {
        var payment = paymentLink.Payment;
        var enabledMethods = ParseEnabledMethods(paymentLink.EnabledMethods);
        var fallbackMethod = enabledMethods.FirstOrDefault();

        return new MinimalPaymentLink
        {
            Id = paymentLink.Id,
            PaymentId = paymentLink.PaymentId,
            PaymentLinkUrl = PlatformLinkResolver.BuildPaymentLinkUrl(
                platformSettings,
                paymentLink.Token,
                payment?.Method ?? fallbackMethod,
                enabledMethods,
                merchantSettings),
            Amount = payment?.Amount ?? paymentLink.Amount,
            Method = payment?.Method ?? fallbackMethod,
            EnabledMethods = enabledMethods,
            Status = payment?.Status ?? PaymentStatus.Pending,
            Description = payment?.Description ?? paymentLink.Description,
            CreatedAt = paymentLink.CreatedAt,
            ExpiresAt = paymentLink.ExpiresAt,
            IsExpired = paymentLink.ExpiresAt.HasValue && paymentLink.ExpiresAt.Value < DateTime.UtcNow,
            LifetimeStatus = GetLifetimeStatus(paymentLink.ExpiresAt),
            Customer = payment?.Customer != null
                ? new MinimalPaymentLinkCustomer
                {
                    Id = payment.Customer.Id,
                    Name = payment.Customer.Name,
                    Email = payment.Customer.Email
                }
                : null
        };
    }

    private static string GetLifetimeStatus(DateTime? expiresAt)
    {
        if (!expiresAt.HasValue)
        {
            return "NeverExpires";
        }

        return expiresAt.Value < DateTime.UtcNow ? "Expired" : "Active";
    }

    private static List<PaymentMethod> ParseEnabledMethods(string enabledMethods)
    {
        if (string.IsNullOrWhiteSpace(enabledMethods))
        {
            return [PaymentMethod.Pix];
        }

        return enabledMethods
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(value => Enum.TryParse<PaymentMethod>(value, true, out var method) ? method : (PaymentMethod?)null)
            .Where(method => method.HasValue)
            .Select(method => method!.Value)
            .Distinct()
            .ToList();
    }
}
