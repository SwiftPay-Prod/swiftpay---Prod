using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Models.Database;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Admin.Settings.UpdatePlatformSettings;

public sealed class UpdatePlatformSettingsEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog
) : Endpoint<UpdatePlatformSettingsRequest, UpdatePlatformSettingsResponse>
{
    public override void Configure()
    {
        Patch("platform-settings");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(UpdatePlatformSettingsRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        var userRole = EndpointUtils.GetUserRole(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new UpdatePlatformSettingsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        if (req.AutomaticCashoutFrequency == AutomaticCashoutFrequency.Minutely && userRole != nameof(UserRole.God))
        {
            await Send.ResponseAsync(new UpdatePlatformSettingsResponse
            {
                Error = new("A frequência por minuto é permitida apenas para usuários God.")
            }, 403, ct);
            return;
        }

        var settings = await dbContext.PlatformSettings.OrderBy(p => p.Id).FirstOrDefaultAsync(ct);

        if (settings == null)
        {
            await Send.ResponseAsync(new UpdatePlatformSettingsResponse
            {
                Error = new("Configurações da plataforma não encontradas.")
            }, 404, ct);
            return;
        }

        // Update only provided fields
        // PIX Limits
        if (req.PixMinTransactionAmount.HasValue)
            settings.PixMinTransactionAmount = req.PixMinTransactionAmount.Value;
        if (req.PixMaxTransactionAmount.HasValue)
            settings.PixMaxTransactionAmount = req.PixMaxTransactionAmount.Value;
        if (req.PixTimeoutMinutes.HasValue)
            settings.PixTimeoutMinutes = req.PixTimeoutMinutes.Value;
        if (req.PixEnabled.HasValue)
            settings.PixEnabled = req.PixEnabled.Value;

        // PIX API Fee
        if (req.PixApiFeeMode.HasValue)
            settings.PixApiFeeMode = req.PixApiFeeMode.Value;
        if (req.PixApiFeeFixed.HasValue)
            settings.PixApiFeeFixed = req.PixApiFeeFixed.Value;
        if (req.PixApiFeePercentage.HasValue)
            settings.PixApiFeePercentage = req.PixApiFeePercentage.Value;
        if (req.PixReservePercentage.HasValue)
            settings.PixReservePercentage = req.PixReservePercentage.Value;
        if (req.PixReserveCompensationDays.HasValue)
            settings.PixReserveCompensationDays = req.PixReserveCompensationDays.Value;

        // PIX Checkout Fee
        if (req.PixCheckoutFeeMode.HasValue)
            settings.PixCheckoutFeeMode = req.PixCheckoutFeeMode.Value;
        if (req.PixCheckoutFeeFixed.HasValue)
            settings.PixCheckoutFeeFixed = req.PixCheckoutFeeFixed.Value;
        if (req.PixCheckoutFeePercentage.HasValue)
            settings.PixCheckoutFeePercentage = req.PixCheckoutFeePercentage.Value;

        // PIX Payment Link Fee
        if (req.PixPaymentLinkFeeMode.HasValue)
            settings.PixPaymentLinkFeeMode = req.PixPaymentLinkFeeMode.Value;
        if (req.PixPaymentLinkFeeFixed.HasValue)
            settings.PixPaymentLinkFeeFixed = req.PixPaymentLinkFeeFixed.Value;
        if (req.PixPaymentLinkFeePercentage.HasValue)
            settings.PixPaymentLinkFeePercentage = req.PixPaymentLinkFeePercentage.Value;

        // BOLETO Limits
        if (req.BoletoMinTransactionAmount.HasValue)
            settings.BoletoMinTransactionAmount = req.BoletoMinTransactionAmount.Value;
        if (req.BoletoMaxTransactionAmount.HasValue)
            settings.BoletoMaxTransactionAmount = req.BoletoMaxTransactionAmount.Value;
        if (req.BoletoEnabled.HasValue)
            settings.BoletoEnabled = req.BoletoEnabled.Value;
        if (req.CreditCardEnabled.HasValue)
            settings.CreditCardEnabled = req.CreditCardEnabled.Value;

        // BOLETO API Fee
        if (req.BoletoApiFeeMode.HasValue)
            settings.BoletoApiFeeMode = req.BoletoApiFeeMode.Value;
        if (req.BoletoApiFeeFixed.HasValue)
            settings.BoletoApiFeeFixed = req.BoletoApiFeeFixed.Value;
        if (req.BoletoApiFeePercentage.HasValue)
            settings.BoletoApiFeePercentage = req.BoletoApiFeePercentage.Value;
        if (req.BoletoReservePercentage.HasValue)
            settings.BoletoReservePercentage = req.BoletoReservePercentage.Value;
        if (req.BoletoReserveCompensationDays.HasValue)
            settings.BoletoReserveCompensationDays = req.BoletoReserveCompensationDays.Value;

        // CREDIT CARD API Fee
        if (req.CreditCardApiFeeMode.HasValue)
            settings.CreditCardApiFeeMode = req.CreditCardApiFeeMode.Value;
        if (req.CreditCardApiFeeFixed.HasValue)
            settings.CreditCardApiFeeFixed = req.CreditCardApiFeeFixed.Value;
        if (req.CreditCardApiFeePercentage.HasValue)
            settings.CreditCardApiFeePercentage = req.CreditCardApiFeePercentage.Value;
        if (req.CreditCardApiInstallmentFeePercentage.HasValue)
            settings.CreditCardApiInstallmentFeePercentage = req.CreditCardApiInstallmentFeePercentage.Value;

        // CREDIT CARD Checkout Fee
        if (req.CreditCardCheckoutFeeMode.HasValue)
            settings.CreditCardCheckoutFeeMode = req.CreditCardCheckoutFeeMode.Value;
        if (req.CreditCardCheckoutFeeFixed.HasValue)
            settings.CreditCardCheckoutFeeFixed = req.CreditCardCheckoutFeeFixed.Value;
        if (req.CreditCardCheckoutFeePercentage.HasValue)
            settings.CreditCardCheckoutFeePercentage = req.CreditCardCheckoutFeePercentage.Value;
        if (req.CreditCardCheckoutInstallmentFeePercentage.HasValue)
            settings.CreditCardCheckoutInstallmentFeePercentage = req.CreditCardCheckoutInstallmentFeePercentage.Value;

        // CREDIT CARD Payment Link Fee
        if (req.CreditCardPaymentLinkFeeMode.HasValue)
            settings.CreditCardPaymentLinkFeeMode = req.CreditCardPaymentLinkFeeMode.Value;
        if (req.CreditCardPaymentLinkFeeFixed.HasValue)
            settings.CreditCardPaymentLinkFeeFixed = req.CreditCardPaymentLinkFeeFixed.Value;
        if (req.CreditCardPaymentLinkFeePercentage.HasValue)
            settings.CreditCardPaymentLinkFeePercentage = req.CreditCardPaymentLinkFeePercentage.Value;
        if (req.CreditCardPaymentLinkInstallmentFeePercentage.HasValue)
            settings.CreditCardPaymentLinkInstallmentFeePercentage = req.CreditCardPaymentLinkInstallmentFeePercentage.Value;

        if (req.CreditCardReservePercentage.HasValue)
            settings.CreditCardReservePercentage = req.CreditCardReservePercentage.Value;
        if (req.CreditCardReserveCompensationDays.HasValue)
            settings.CreditCardReserveCompensationDays = req.CreditCardReserveCompensationDays.Value;

        // BOLETO Checkout Fee
        if (req.BoletoCheckoutFeeMode.HasValue)
            settings.BoletoCheckoutFeeMode = req.BoletoCheckoutFeeMode.Value;
        if (req.BoletoCheckoutFeeFixed.HasValue)
            settings.BoletoCheckoutFeeFixed = req.BoletoCheckoutFeeFixed.Value;
        if (req.BoletoCheckoutFeePercentage.HasValue)
            settings.BoletoCheckoutFeePercentage = req.BoletoCheckoutFeePercentage.Value;

        // BOLETO Payment Link Fee
        if (req.BoletoPaymentLinkFeeMode.HasValue)
            settings.BoletoPaymentLinkFeeMode = req.BoletoPaymentLinkFeeMode.Value;
        if (req.BoletoPaymentLinkFeeFixed.HasValue)
            settings.BoletoPaymentLinkFeeFixed = req.BoletoPaymentLinkFeeFixed.Value;
        if (req.BoletoPaymentLinkFeePercentage.HasValue)
            settings.BoletoPaymentLinkFeePercentage = req.BoletoPaymentLinkFeePercentage.Value;
        if (req.PixPaymentLinkBaseUrl != null)
            settings.PixPaymentLinkBaseUrl = req.PixPaymentLinkBaseUrl.Trim();
        if (req.BoletoPaymentLinkBaseUrl != null)
            settings.BoletoPaymentLinkBaseUrl = req.BoletoPaymentLinkBaseUrl.Trim();
        if (req.CreditCardPaymentLinkBaseUrl != null)
            settings.CreditCardPaymentLinkBaseUrl = req.CreditCardPaymentLinkBaseUrl.Trim();
        if (req.PaymentLinkDomainOptions != null)
        {
            settings.PaymentLinkDomainOptionsJson = JsonSerializer.Serialize(req.PaymentLinkDomainOptions);
            ApplyLegacyPaymentLinkBaseUrlsFromDomainOptions(settings, req.PaymentLinkDomainOptions);
        }

        // Withdrawal Fee
        if (req.WithdrawalFeeMode.HasValue)
            settings.WithdrawalFeeMode = req.WithdrawalFeeMode.Value;
        if (req.WithdrawalFeeFixed.HasValue)
            settings.WithdrawalFeeFixed = req.WithdrawalFeeFixed.Value;
        if (req.WithdrawalFeePercentage.HasValue)
            settings.WithdrawalFeePercentage = req.WithdrawalFeePercentage.Value;
        if (req.MinWithdrawalAmount.HasValue)
            settings.MinWithdrawalAmount = req.MinWithdrawalAmount.Value;
        if (req.WithdrawalEnabled.HasValue)
            settings.WithdrawalEnabled = req.WithdrawalEnabled.Value;
        if (req.SelfNominalSwitchEnabled.HasValue)
            settings.SelfNominalSwitchEnabled = req.SelfNominalSwitchEnabled.Value;
        if (req.WithdrawalApprovalMode.HasValue)
            settings.WithdrawalApprovalMode = req.WithdrawalApprovalMode.Value;

        // Rate Limiting
        if (req.RateLimitPerMinute.HasValue)
            settings.RateLimitPerMinute = req.RateLimitPerMinute.Value;
        if (req.RateLimitPerHour.HasValue)
            settings.RateLimitPerHour = req.RateLimitPerHour.Value;
        if (req.RateLimitPerDay.HasValue)
            settings.RateLimitPerDay = req.RateLimitPerDay.Value;

        // Referral Settings
        if (req.ReferralDurationMonths.HasValue)
            settings.ReferralDurationMonths = req.ReferralDurationMonths.Value;
        if (req.ReferralCommissionPercentage.HasValue)
            settings.ReferralCommissionPercentage = req.ReferralCommissionPercentage.Value;
        if (req.ReferralCommissionWithdrawalIntervalValue.HasValue)
            settings.ReferralCommissionWithdrawalIntervalValue = req.ReferralCommissionWithdrawalIntervalValue.Value;
        if (req.ReferralCommissionWithdrawalIntervalUnit.HasValue)
            settings.ReferralCommissionWithdrawalIntervalUnit = req.ReferralCommissionWithdrawalIntervalUnit.Value;
        if (req.ReferralCommissionMinWithdrawalAmount.HasValue)
            settings.ReferralCommissionMinWithdrawalAmount = req.ReferralCommissionMinWithdrawalAmount.Value;
        if (req.ReferralCommissionWithdrawalFeeFixed.HasValue)
            settings.ReferralCommissionWithdrawalFeeFixed = req.ReferralCommissionWithdrawalFeeFixed.Value;

        // Automatic Cashout
        if (req.IsAutomaticCashoutEnabled.HasValue)
            settings.IsAutomaticCashoutEnabled = req.IsAutomaticCashoutEnabled.Value;
        if (req.AutomaticCashoutFrequency.HasValue)
            settings.AutomaticCashoutFrequency = req.AutomaticCashoutFrequency.Value;
        if (req.AutomaticCashoutMinAmount.HasValue)
            settings.AutomaticCashoutMinAmount = req.AutomaticCashoutMinAmount.Value;
        if (req.AutomaticCashoutMaxAmount.HasValue)
            settings.AutomaticCashoutMaxAmount = req.AutomaticCashoutMaxAmount.Value;
        if (req.AutomaticCashoutPayoutAccountId.HasValue)
        {
            var payoutAccountExists = await dbContext.PlatformPayoutAccounts
                .AsNoTracking()
                .AnyAsync(a => a.Id == req.AutomaticCashoutPayoutAccountId.Value
                            && a.DeactivatedAt == null, ct);

            if (!payoutAccountExists)
            {
                await Send.ResponseAsync(new UpdatePlatformSettingsResponse
                {
                    Error = new("A conta de saque automatizado da plataforma não foi encontrada ou está desativada.")
                }, 400, ct);
                return;
            }

            settings.AutomaticCashoutPayoutAccountId = req.AutomaticCashoutPayoutAccountId.Value;
        }

        settings.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.PlatformSettingsUpdated,
            Status = SecurityLogStatus.Success,
            UserId = adminId,
            Details = "Platform settings updated by admin"
        });

        await Send.OkAsync(new UpdatePlatformSettingsResponse
        {
            Data = PlatformSettingsMapper.ToData(settings),
            Message = "Configurações da plataforma atualizadas com sucesso!"
        }, ct);
    }

    private static void ApplyLegacyPaymentLinkBaseUrlsFromDomainOptions(
        PlatformSettings settings,
        IEnumerable<PaymentLinkDomainMethodOptions> methodOptions)
    {
        foreach (var methodOption in methodOptions)
        {
            var selected = methodOption.Options.FirstOrDefault(option => option.IsDefault)
                ?? methodOption.Options.FirstOrDefault();

            if (selected == null || string.IsNullOrWhiteSpace(selected.BaseUrl))
            {
                continue;
            }

            var normalizedBaseUrl = selected.BaseUrl.TrimEnd('/');
            switch (methodOption.Method)
            {
                case PaymentMethod.Boleto:
                    settings.BoletoPaymentLinkBaseUrl = normalizedBaseUrl;
                    break;
                case PaymentMethod.CreditCard:
                    settings.CreditCardPaymentLinkBaseUrl = normalizedBaseUrl;
                    break;
                default:
                    settings.PixPaymentLinkBaseUrl = normalizedBaseUrl;
                    break;
            }
        }
    }
}
