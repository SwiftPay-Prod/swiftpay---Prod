using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;
using swiftpay_api.Interfaces;
using swiftpay_api.Models.PaymentApi;

namespace swiftpay_api.Endpoints.Admin.Merchants.UpdateMerchantSettings;

public sealed class UpdateMerchantSettingsEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    INotificationService notificationService,
    IPaymentApiClient paymentApiClient,
    ILogger<UpdateMerchantSettingsEndpoint> logger,
    IApiLogService apiLogService
) : Endpoint<UpdateMerchantSettingsRequest, UpdateMerchantSettingsResponse>
{
    public override void Configure()
    {
        Patch("merchant/{merchantId:guid}/settings");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(UpdateMerchantSettingsRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new UpdateMerchantSettingsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantSettings)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new UpdateMerchantSettingsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (req.IsAutomaticCashoutEnabled.HasValue
            || req.AutomaticCashoutFrequency.HasValue
            || req.AutomaticCashoutMinAmount.HasValue
            || req.AutomaticCashoutMaxAmount.HasValue
            || req.AutomaticCashoutPayoutAccountId.HasValue)
        {
            await Send.ResponseAsync(new UpdateMerchantSettingsResponse
            {
                Error = new("A configuração de saque automatizado deve ser feita pela própria organização.")
            }, 400, ct);
            return;
        }

        var settings = merchant.MerchantSettings;
        var isInitialSetup = settings == null;
        var createdNewSettings = false;

        if (settings == null)
        {
            settings = new MerchantSettings
            {
                MerchantId = merchant.Id
            };
            dbContext.MerchantSettings.Add(settings);
            createdNewSettings = true;
        }

        var previousValues = CaptureSettingsSnapshot(settings);

        ApplySettingsChanges(settings, req);

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (createdNewSettings && IsMerchantSettingsUniqueViolation(ex))
        {
            if (dbContext.Entry(settings).State == EntityState.Added)
            {
                dbContext.Entry(settings).State = EntityState.Detached;
            }

            settings = await dbContext.MerchantSettings
                .OrderBy(s => s.Id)
                .FirstOrDefaultAsync(s => s.MerchantId == merchant.Id, ct);

            if (settings == null)
            {
                throw;
            }

            isInitialSetup = false;
            previousValues = CaptureSettingsSnapshot(settings);

            ApplySettingsChanges(settings, req);
            await dbContext.SaveChangesAsync(ct);
        }

        await TrySyncAccithusSplitConfigAsync(merchant.Id, settings, ct);

        var newValues = CaptureSettingsSnapshot(settings);
        await RecordSettingsHistoryAsync(
            merchant.Id,
            isInitialSetup,
            previousValues,
            newValues,
            adminId.Value,
            req.Reason,
            ct);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.MerchantUpdated, Status = SecurityLogStatus.Success, UserId = adminId, Details = $"Settings do merchant {merchant.Id} atualizadas pelo admin" });

        _ = notificationService.CreateSystemNotificationAsync(
            merchant.Id,
            "Configurações atualizadas",
            "As configurações da sua organização (taxas ou limites) foram atualizadas pela equipe Safefy."
        );

        await Send.OkAsync(new UpdateMerchantSettingsResponse
        {
            Data = new MerchantSettingsData
            {
                Id = settings.Id,
                MerchantId = settings.MerchantId,
                PixMinTransactionAmount = settings.PixMinTransactionAmount,
                PixMaxTransactionAmount = settings.PixMaxTransactionAmount,
                PixEnabled = settings.PixEnabled,
                PixApiFeeMode = settings.PixApiFeeMode,
                PixApiFeeFixed = settings.PixApiFeeFixed,
                PixApiFeePercentage = settings.PixApiFeePercentage,
                PixReservePercentage = settings.PixReservePercentage,
                PixReserveCompensationDays = settings.PixReserveCompensationDays,
                PixCheckoutFeeMode = settings.PixCheckoutFeeMode,
                PixCheckoutFeeFixed = settings.PixCheckoutFeeFixed,
                PixCheckoutFeePercentage = settings.PixCheckoutFeePercentage,
                PixPaymentLinkFeeMode = settings.PixPaymentLinkFeeMode,
                PixPaymentLinkFeeFixed = settings.PixPaymentLinkFeeFixed,
                PixPaymentLinkFeePercentage = settings.PixPaymentLinkFeePercentage,
                BoletoMinTransactionAmount = settings.BoletoMinTransactionAmount,
                BoletoMaxTransactionAmount = settings.BoletoMaxTransactionAmount,
                BoletoEnabled = settings.BoletoEnabled,
                CreditCardEnabled = settings.CreditCardEnabled,
                BoletoApiFeeMode = settings.BoletoApiFeeMode,
                BoletoApiFeeFixed = settings.BoletoApiFeeFixed,
                BoletoApiFeePercentage = settings.BoletoApiFeePercentage,
                BoletoReservePercentage = settings.BoletoReservePercentage,
                BoletoReserveCompensationDays = settings.BoletoReserveCompensationDays,
                CreditCardApiFeeMode = settings.CreditCardApiFeeMode,
                CreditCardApiFeeFixed = settings.CreditCardApiFeeFixed,
                CreditCardApiFeePercentage = settings.CreditCardApiFeePercentage,
                CreditCardApiInstallmentFeePercentage = settings.CreditCardApiInstallmentFeePercentage,
                CreditCardCheckoutFeeMode = settings.CreditCardCheckoutFeeMode,
                CreditCardCheckoutFeeFixed = settings.CreditCardCheckoutFeeFixed,
                CreditCardCheckoutFeePercentage = settings.CreditCardCheckoutFeePercentage,
                CreditCardCheckoutInstallmentFeePercentage = settings.CreditCardCheckoutInstallmentFeePercentage,
                CreditCardPaymentLinkFeeMode = settings.CreditCardPaymentLinkFeeMode,
                CreditCardPaymentLinkFeeFixed = settings.CreditCardPaymentLinkFeeFixed,
                CreditCardPaymentLinkFeePercentage = settings.CreditCardPaymentLinkFeePercentage,
                CreditCardPaymentLinkInstallmentFeePercentage = settings.CreditCardPaymentLinkInstallmentFeePercentage,
                CreditCardReservePercentage = settings.CreditCardReservePercentage,
                CreditCardReserveCompensationDays = settings.CreditCardReserveCompensationDays,
                BoletoCheckoutFeeMode = settings.BoletoCheckoutFeeMode,
                BoletoCheckoutFeeFixed = settings.BoletoCheckoutFeeFixed,
                BoletoCheckoutFeePercentage = settings.BoletoCheckoutFeePercentage,
                BoletoPaymentLinkFeeMode = settings.BoletoPaymentLinkFeeMode,
                BoletoPaymentLinkFeeFixed = settings.BoletoPaymentLinkFeeFixed,
                BoletoPaymentLinkFeePercentage = settings.BoletoPaymentLinkFeePercentage,
                WithdrawalFeeMode = settings.WithdrawalFeeMode,
                WithdrawalFeeFixed = settings.WithdrawalFeeFixed,
                WithdrawalFeePercentage = settings.WithdrawalFeePercentage,
                MinWithdrawalAmount = settings.MinWithdrawalAmount,
                WithdrawalEnabled = settings.WithdrawalEnabled,
                WithdrawalApprovalMode = settings.WithdrawalApprovalMode,
                RateLimitPerMinute = settings.RateLimitPerMinute,
                RateLimitPerHour = settings.RateLimitPerHour,
                RateLimitPerDay = settings.RateLimitPerDay,
                PaymentLinkDomainSelection = ParseMerchantDomainSelection(settings.PaymentLinkDomainSelectionJson),
                IsAutomaticCashoutEnabled = settings.IsAutomaticCashoutEnabled,
                AutomaticCashoutFrequency = settings.AutomaticCashoutFrequency,
                AutomaticCashoutMinAmount = settings.AutomaticCashoutMinAmount,
                AutomaticCashoutMaxAmount = settings.AutomaticCashoutMaxAmount,
                AutomaticCashoutPayoutAccountId = settings.AutomaticCashoutPayoutAccountId,
                UpdatedAt = settings.UpdatedAt
            }
        }, ct);
    }

    private static void ApplySettingsChanges(MerchantSettings settings, UpdateMerchantSettingsRequest req)
    {
        settings.UpdatedAt = DateTime.UtcNow;

        settings.PixMinTransactionAmount = req.PixMinTransactionAmount;
        settings.PixMaxTransactionAmount = req.PixMaxTransactionAmount;
        settings.PixEnabled = req.PixEnabled;

        settings.PixApiFeeMode = req.PixApiFeeMode;
        settings.PixApiFeeFixed = req.PixApiFeeFixed;
        settings.PixApiFeePercentage = req.PixApiFeePercentage;
        settings.PixReservePercentage = req.PixReservePercentage;
        settings.PixReserveCompensationDays = req.PixReserveCompensationDays;

        settings.PixCheckoutFeeMode = req.PixCheckoutFeeMode;
        settings.PixCheckoutFeeFixed = req.PixCheckoutFeeFixed;
        settings.PixCheckoutFeePercentage = req.PixCheckoutFeePercentage;
        settings.PixPaymentLinkFeeMode = req.PixPaymentLinkFeeMode;
        settings.PixPaymentLinkFeeFixed = req.PixPaymentLinkFeeFixed;
        settings.PixPaymentLinkFeePercentage = req.PixPaymentLinkFeePercentage;

        settings.BoletoMinTransactionAmount = req.BoletoMinTransactionAmount;
        settings.BoletoMaxTransactionAmount = req.BoletoMaxTransactionAmount;
        settings.BoletoEnabled = req.BoletoEnabled;
        settings.CreditCardEnabled = req.CreditCardEnabled;

        settings.BoletoApiFeeMode = req.BoletoApiFeeMode;
        settings.BoletoApiFeeFixed = req.BoletoApiFeeFixed;
        settings.BoletoApiFeePercentage = req.BoletoApiFeePercentage;
        settings.BoletoReservePercentage = req.BoletoReservePercentage;
        settings.BoletoReserveCompensationDays = req.BoletoReserveCompensationDays;

        settings.CreditCardApiFeeMode = req.CreditCardApiFeeMode;
        settings.CreditCardApiFeeFixed = req.CreditCardApiFeeFixed;
        settings.CreditCardApiFeePercentage = req.CreditCardApiFeePercentage;
        settings.CreditCardApiInstallmentFeePercentage = req.CreditCardApiInstallmentFeePercentage;

        settings.CreditCardCheckoutFeeMode = req.CreditCardCheckoutFeeMode;
        settings.CreditCardCheckoutFeeFixed = req.CreditCardCheckoutFeeFixed;
        settings.CreditCardCheckoutFeePercentage = req.CreditCardCheckoutFeePercentage;
        settings.CreditCardCheckoutInstallmentFeePercentage = req.CreditCardCheckoutInstallmentFeePercentage;

        settings.CreditCardPaymentLinkFeeMode = req.CreditCardPaymentLinkFeeMode;
        settings.CreditCardPaymentLinkFeeFixed = req.CreditCardPaymentLinkFeeFixed;
        settings.CreditCardPaymentLinkFeePercentage = req.CreditCardPaymentLinkFeePercentage;
        settings.CreditCardPaymentLinkInstallmentFeePercentage = req.CreditCardPaymentLinkInstallmentFeePercentage;

        settings.CreditCardReservePercentage = req.CreditCardReservePercentage;
        settings.CreditCardReserveCompensationDays = req.CreditCardReserveCompensationDays;

        settings.BoletoCheckoutFeeMode = req.BoletoCheckoutFeeMode;
        settings.BoletoCheckoutFeeFixed = req.BoletoCheckoutFeeFixed;
        settings.BoletoCheckoutFeePercentage = req.BoletoCheckoutFeePercentage;
        settings.BoletoPaymentLinkFeeMode = req.BoletoPaymentLinkFeeMode;
        settings.BoletoPaymentLinkFeeFixed = req.BoletoPaymentLinkFeeFixed;
        settings.BoletoPaymentLinkFeePercentage = req.BoletoPaymentLinkFeePercentage;

        settings.WithdrawalFeeMode = req.WithdrawalFeeMode;
        settings.WithdrawalFeeFixed = req.WithdrawalFeeFixed;
        settings.WithdrawalFeePercentage = req.WithdrawalFeePercentage;
        settings.MinWithdrawalAmount = req.MinWithdrawalAmount;
        settings.WithdrawalEnabled = req.WithdrawalEnabled;
        settings.WithdrawalApprovalMode = req.WithdrawalApprovalMode;

        settings.RateLimitPerMinute = req.RateLimitPerMinute;
        settings.RateLimitPerHour = req.RateLimitPerHour;
        settings.RateLimitPerDay = req.RateLimitPerDay;
        settings.PaymentLinkDomainSelectionJson = req.PaymentLinkDomainSelection == null
            ? null
            : JsonSerializer.Serialize(req.PaymentLinkDomainSelection);
    }

    private static bool IsMerchantSettingsUniqueViolation(DbUpdateException ex)
        => ex.InnerException is PostgresException pgEx
           && pgEx.SqlState == PostgresErrorCodes.UniqueViolation
           && pgEx.ConstraintName == "IX_MerchantSettings_MerchantId";

    private async Task TrySyncAccithusSplitConfigAsync(Guid merchantId, MerchantSettings settings, CancellationToken ct)
    {
        var activeAccithusLink = await dbContext.MerchantAcquirers
            .Include(link => link.Acquirer)
            .FirstOrDefaultAsync(link => link.MerchantId == merchantId
                && link.IsActive
                && link.Acquirer.IsActive
                && link.Acquirer.Type == AcquirerType.Accithus
                && !string.IsNullOrWhiteSpace(link.ExternalSubmerchantId), ct);

        if (activeAccithusLink == null)
        {
            return;
        }

        var platformSettings = await dbContext.PlatformSettings
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct)
            ?? new PlatformSettings();

        var effectiveFeeMode = settings.PixApiFeeMode ?? platformSettings.PixApiFeeMode;
        var effectiveFeeFixed = settings.PixApiFeeFixed ?? platformSettings.PixApiFeeFixed;
        var effectiveFeePercentage = settings.PixApiFeePercentage ?? platformSettings.PixApiFeePercentage;

        var splitConfig = ResolveSplitConfig(effectiveFeeMode, effectiveFeeFixed, effectiveFeePercentage);
        if (splitConfig == null)
        {
            logger.LogError(
                "Skipped split config sync for merchant due unsupported fee mode/value: MerchantId={MerchantId}, FeeMode={FeeMode}, FeeFixed={FeeFixed}, FeePercentage={FeePercentage}",
                merchantId,
                effectiveFeeMode,
                effectiveFeeFixed,
                effectiveFeePercentage);
            return;
        }

        var syncResult = await paymentApiClient.SyncSubmerchantSplitConfigAsync(new SyncSubmerchantSplitConfigApiInput
        {
            AcquirerId = activeAccithusLink.AcquirerId,
            MerchantId = merchantId,
            ExternalSubmerchantId = activeAccithusLink.ExternalSubmerchantId!,
            CommissionType = splitConfig.Value.CommissionType,
            CommissionValue = splitConfig.Value.CommissionValue,
            IsActive = true
        }, ct);

        if (!syncResult.Success)
        {
            logger.LogError(
                "Failed to sync Accithus split config after merchant settings update: MerchantId={MerchantId}, AcquirerId={AcquirerId}, ExternalSubmerchantId={ExternalSubmerchantId}, Error={Error}",
                merchantId,
                activeAccithusLink.AcquirerId,
                activeAccithusLink.ExternalSubmerchantId,
                syncResult.ErrorMessage);

            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.SyncSubmerchantSplitConfig,
                Status = ApiLogStatus.Failed,
                MerchantId = merchantId,
                HttpMethod = "PATCH",
                Endpoint = $"/v1/admin/merchant/{merchantId}/settings",
                StatusCode = 502,
                ResourceId = merchantId,
                ResourceType = ApiLogResourceType.Merchant,
                AcquirerId = activeAccithusLink.AcquirerId,
                AcquirerType = activeAccithusLink.Acquirer.Type.ToString(),
                Details = syncResult.ErrorMessage ?? "Falha ao sincronizar split config do submerchant.",
                RequestBody = JsonSerializer.Serialize(new
                {
                    merchantId,
                    acquirerId = activeAccithusLink.AcquirerId,
                    externalSubmerchantId = activeAccithusLink.ExternalSubmerchantId,
                    commissionType = splitConfig.Value.CommissionType,
                    commissionValue = splitConfig.Value.CommissionValue,
                    feeMode = effectiveFeeMode.ToString(),
                    feeFixed = effectiveFeeFixed,
                    feePercentage = effectiveFeePercentage
                })
            });

            return;
        }

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.SyncSubmerchantSplitConfig,
            Status = ApiLogStatus.Success,
            MerchantId = merchantId,
            HttpMethod = "PATCH",
            Endpoint = $"/v1/admin/merchant/{merchantId}/settings",
            StatusCode = 200,
            ResourceId = merchantId,
            ResourceType = ApiLogResourceType.Merchant,
            AcquirerId = activeAccithusLink.AcquirerId,
            AcquirerType = activeAccithusLink.Acquirer.Type.ToString(),
            Details = "Split config do submerchant sincronizado com sucesso.",
            RequestBody = JsonSerializer.Serialize(new
            {
                merchantId,
                acquirerId = activeAccithusLink.AcquirerId,
                externalSubmerchantId = activeAccithusLink.ExternalSubmerchantId,
                commissionType = splitConfig.Value.CommissionType,
                commissionValue = splitConfig.Value.CommissionValue,
                feeMode = effectiveFeeMode.ToString(),
                feeFixed = effectiveFeeFixed,
                feePercentage = effectiveFeePercentage
            })
        });
    }

    private static (string CommissionType, decimal CommissionValue)? ResolveSplitConfig(FeeChargeMode feeMode, long feeFixedInCents, int feePercentageInBasisPoints)
    {
        return feeMode switch
        {
            FeeChargeMode.PercentageOnly => ("percentage", feePercentageInBasisPoints / 10000m),
            FeeChargeMode.FixedOnly => ("fixed", feeFixedInCents / 100m),
            FeeChargeMode.FixedAndPercentage when feePercentageInBasisPoints > 0 => ("percentage", feePercentageInBasisPoints / 10000m),
            FeeChargeMode.FixedAndPercentage when feeFixedInCents > 0 => ("fixed", feeFixedInCents / 100m),
            _ => null
        };
    }

    private static Dictionary<string, object?> CaptureSettingsSnapshot(MerchantSettings settings)
    {
        return new Dictionary<string, object?>
        {
            ["PixMinTransactionAmount"] = settings.PixMinTransactionAmount,
            ["PixMaxTransactionAmount"] = settings.PixMaxTransactionAmount,
            ["PixEnabled"] = settings.PixEnabled,
            ["PixApiFeeMode"] = settings.PixApiFeeMode?.ToString(),
            ["PixApiFeeFixed"] = settings.PixApiFeeFixed,
            ["PixApiFeePercentage"] = settings.PixApiFeePercentage,
            ["PixReservePercentage"] = settings.PixReservePercentage,
            ["PixReserveCompensationDays"] = settings.PixReserveCompensationDays,
            ["PixCheckoutFeeMode"] = settings.PixCheckoutFeeMode?.ToString(),
            ["PixCheckoutFeeFixed"] = settings.PixCheckoutFeeFixed,
            ["PixCheckoutFeePercentage"] = settings.PixCheckoutFeePercentage,
            ["PixPaymentLinkFeeMode"] = settings.PixPaymentLinkFeeMode?.ToString(),
            ["PixPaymentLinkFeeFixed"] = settings.PixPaymentLinkFeeFixed,
            ["PixPaymentLinkFeePercentage"] = settings.PixPaymentLinkFeePercentage,
            ["BoletoMinTransactionAmount"] = settings.BoletoMinTransactionAmount,
            ["BoletoMaxTransactionAmount"] = settings.BoletoMaxTransactionAmount,
            ["BoletoEnabled"] = settings.BoletoEnabled,
            ["CreditCardEnabled"] = settings.CreditCardEnabled,
            ["BoletoApiFeeMode"] = settings.BoletoApiFeeMode?.ToString(),
            ["BoletoApiFeeFixed"] = settings.BoletoApiFeeFixed,
            ["BoletoApiFeePercentage"] = settings.BoletoApiFeePercentage,
            ["BoletoReservePercentage"] = settings.BoletoReservePercentage,
            ["BoletoReserveCompensationDays"] = settings.BoletoReserveCompensationDays,
            ["CreditCardApiFeeMode"] = settings.CreditCardApiFeeMode?.ToString(),
            ["CreditCardApiFeeFixed"] = settings.CreditCardApiFeeFixed,
            ["CreditCardApiFeePercentage"] = settings.CreditCardApiFeePercentage,
            ["CreditCardApiInstallmentFeePercentage"] = settings.CreditCardApiInstallmentFeePercentage,
            ["CreditCardCheckoutFeeMode"] = settings.CreditCardCheckoutFeeMode?.ToString(),
            ["CreditCardCheckoutFeeFixed"] = settings.CreditCardCheckoutFeeFixed,
            ["CreditCardCheckoutFeePercentage"] = settings.CreditCardCheckoutFeePercentage,
            ["CreditCardCheckoutInstallmentFeePercentage"] = settings.CreditCardCheckoutInstallmentFeePercentage,
            ["CreditCardPaymentLinkFeeMode"] = settings.CreditCardPaymentLinkFeeMode?.ToString(),
            ["CreditCardPaymentLinkFeeFixed"] = settings.CreditCardPaymentLinkFeeFixed,
            ["CreditCardPaymentLinkFeePercentage"] = settings.CreditCardPaymentLinkFeePercentage,
            ["CreditCardPaymentLinkInstallmentFeePercentage"] = settings.CreditCardPaymentLinkInstallmentFeePercentage,
            ["CreditCardReservePercentage"] = settings.CreditCardReservePercentage,
            ["CreditCardReserveCompensationDays"] = settings.CreditCardReserveCompensationDays,
            ["BoletoCheckoutFeeMode"] = settings.BoletoCheckoutFeeMode?.ToString(),
            ["BoletoCheckoutFeeFixed"] = settings.BoletoCheckoutFeeFixed,
            ["BoletoCheckoutFeePercentage"] = settings.BoletoCheckoutFeePercentage,
            ["BoletoPaymentLinkFeeMode"] = settings.BoletoPaymentLinkFeeMode?.ToString(),
            ["BoletoPaymentLinkFeeFixed"] = settings.BoletoPaymentLinkFeeFixed,
            ["BoletoPaymentLinkFeePercentage"] = settings.BoletoPaymentLinkFeePercentage,
            ["WithdrawalFeeMode"] = settings.WithdrawalFeeMode?.ToString(),
            ["WithdrawalFeeFixed"] = settings.WithdrawalFeeFixed,
            ["WithdrawalFeePercentage"] = settings.WithdrawalFeePercentage,
            ["MinWithdrawalAmount"] = settings.MinWithdrawalAmount,
            ["WithdrawalEnabled"] = settings.WithdrawalEnabled,
            ["WithdrawalApprovalMode"] = settings.WithdrawalApprovalMode?.ToString(),
            ["RateLimitPerMinute"] = settings.RateLimitPerMinute,
            ["RateLimitPerHour"] = settings.RateLimitPerHour,
            ["RateLimitPerDay"] = settings.RateLimitPerDay,
            ["PaymentLinkDomainSelectionJson"] = settings.PaymentLinkDomainSelectionJson,
            ["IsAutomaticCashoutEnabled"] = settings.IsAutomaticCashoutEnabled,
            ["AutomaticCashoutFrequency"] = settings.AutomaticCashoutFrequency.ToString(),
            ["AutomaticCashoutMinAmount"] = settings.AutomaticCashoutMinAmount,
            ["AutomaticCashoutMaxAmount"] = settings.AutomaticCashoutMaxAmount,
            ["AutomaticCashoutPayoutAccountId"] = settings.AutomaticCashoutPayoutAccountId
        };
    }

    private async Task RecordSettingsHistoryAsync(
        Guid merchantId,
        bool isInitialSetup,
        Dictionary<string, object?> previousValues,
        Dictionary<string, object?> newValues,
        Guid changedByUserId,
        string? reason,
        CancellationToken ct)
    {
        var changedFields = new List<string>();
        foreach (var key in newValues.Keys)
        {
            var prevVal = previousValues.TryGetValue(key, out var pv) ? pv : null;
            var newVal = newValues[key];
            if (!Equals(prevVal, newVal))
            {
                changedFields.Add(key);
            }
        }

        if (changedFields.Count == 0 && !isInitialSetup) return;

        var categories = DetermineCategories(changedFields);

        foreach (var category in categories)
        {
            var categoryFields = GetFieldsForCategory(category);
            var relevantChangedFields = changedFields.Where(f => categoryFields.Contains(f)).ToList();
            if (relevantChangedFields.Count == 0 && !isInitialSetup) continue;

            var prevSnapshot = categoryFields.ToDictionary(
                f => f,
                f => previousValues.TryGetValue(f, out var v) ? v : null);

            var newSnapshot = categoryFields.ToDictionary(
                f => f,
                f => newValues.TryGetValue(f, out var v) ? v : null);

            var history = new MerchantSettingsChangeHistory
            {
                MerchantId = merchantId,
                Category = isInitialSetup ? MerchantSettingsChangeCategory.InitialSetup : category,
                PreviousValuesJson = JsonSerializer.Serialize(prevSnapshot),
                NewValuesJson = JsonSerializer.Serialize(newSnapshot),
                ChangedFields = string.Join(",", relevantChangedFields),
                Description = GetCategoryDescription(category),
                ChangedByUserId = changedByUserId,
                Reason = reason ?? (isInitialSetup ? "Configuração inicial" : "Atualização de configurações"),
                IsLegacyRecord = false
            };

            dbContext.MerchantSettingsChangeHistories.Add(history);
        }

        await dbContext.SaveChangesAsync(ct);
    }

    private static List<MerchantSettingsChangeCategory> DetermineCategories(List<string> changedFields)
    {
        var categories = new HashSet<MerchantSettingsChangeCategory>();

        foreach (var field in changedFields)
        {
            if (field.StartsWith("PixApi"))
                categories.Add(MerchantSettingsChangeCategory.PixFees);
            else if (field.StartsWith("PixCheckout"))
                categories.Add(MerchantSettingsChangeCategory.PixFees);
            else if (field.StartsWith("PixReserve"))
                categories.Add(MerchantSettingsChangeCategory.PixFees);
            else if (field.StartsWith("BoletoApi"))
                categories.Add(MerchantSettingsChangeCategory.BoletoFees);
            else if (field.StartsWith("BoletoCheckout"))
                categories.Add(MerchantSettingsChangeCategory.BoletoFees);
            else if (field.StartsWith("BoletoReserve"))
                categories.Add(MerchantSettingsChangeCategory.BoletoFees);
            else if (field.StartsWith("PixMin") || field.StartsWith("PixMax"))
                categories.Add(MerchantSettingsChangeCategory.PixLimits);
            else if (field == "PixEnabled" || field == "BoletoEnabled" || field == "CreditCardEnabled" || field == "WithdrawalEnabled")
                categories.Add(MerchantSettingsChangeCategory.General);
            else if (field.StartsWith("Withdrawal") || field == "MinWithdrawalAmount")
                categories.Add(field == "WithdrawalApprovalMode"
                    ? MerchantSettingsChangeCategory.WithdrawalApprovalMode
                    : MerchantSettingsChangeCategory.WithdrawalFees);
            else if (field.StartsWith("RateLimit"))
                categories.Add(MerchantSettingsChangeCategory.RateLimits);
            else if (field.StartsWith("IsAutomaticCashout") || field.StartsWith("AutomaticCashout"))
                categories.Add(MerchantSettingsChangeCategory.AutomaticCashout);
            else
                categories.Add(MerchantSettingsChangeCategory.General);
        }

        return categories.Count > 0 ? categories.ToList() : [MerchantSettingsChangeCategory.General];
    }

    private static List<string> GetFieldsForCategory(MerchantSettingsChangeCategory category)
    {
        return category switch
        {
            MerchantSettingsChangeCategory.PixFees => ["PixApiFeeMode", "PixApiFeeFixed", "PixApiFeePercentage", "PixReservePercentage", "PixReserveCompensationDays", "PixCheckoutFeeMode", "PixCheckoutFeeFixed", "PixCheckoutFeePercentage", "PixPaymentLinkFeeMode", "PixPaymentLinkFeeFixed", "PixPaymentLinkFeePercentage"],
            MerchantSettingsChangeCategory.BoletoFees => ["BoletoApiFeeMode", "BoletoApiFeeFixed", "BoletoApiFeePercentage", "BoletoReservePercentage", "BoletoReserveCompensationDays", "BoletoCheckoutFeeMode", "BoletoCheckoutFeeFixed", "BoletoCheckoutFeePercentage", "BoletoPaymentLinkFeeMode", "BoletoPaymentLinkFeeFixed", "BoletoPaymentLinkFeePercentage"],
            MerchantSettingsChangeCategory.PixLimits => ["PixMinTransactionAmount", "PixMaxTransactionAmount"],
            MerchantSettingsChangeCategory.WithdrawalFees => ["WithdrawalFeeMode", "WithdrawalFeeFixed", "WithdrawalFeePercentage", "MinWithdrawalAmount"],
            MerchantSettingsChangeCategory.WithdrawalApprovalMode => ["WithdrawalApprovalMode"],
            MerchantSettingsChangeCategory.RateLimits => ["RateLimitPerMinute", "RateLimitPerHour", "RateLimitPerDay"],
            MerchantSettingsChangeCategory.AutomaticCashout => ["IsAutomaticCashoutEnabled", "AutomaticCashoutFrequency", "AutomaticCashoutMinAmount", "AutomaticCashoutMaxAmount"],
            _ => ["PixMinTransactionAmount", "PixMaxTransactionAmount", "PixEnabled", "PixApiFeeMode", "PixApiFeeFixed", "PixApiFeePercentage", "PixReservePercentage", "PixReserveCompensationDays", "PixCheckoutFeeMode", "PixCheckoutFeeFixed", "PixCheckoutFeePercentage", "PixPaymentLinkFeeMode", "PixPaymentLinkFeeFixed", "PixPaymentLinkFeePercentage", "BoletoEnabled", "CreditCardEnabled", "BoletoApiFeeMode", "BoletoApiFeeFixed", "BoletoApiFeePercentage", "BoletoReservePercentage", "BoletoReserveCompensationDays", "BoletoCheckoutFeeMode", "BoletoCheckoutFeeFixed", "BoletoCheckoutFeePercentage", "BoletoPaymentLinkFeeMode", "BoletoPaymentLinkFeeFixed", "BoletoPaymentLinkFeePercentage", "CreditCardApiFeeMode", "CreditCardApiFeeFixed", "CreditCardApiFeePercentage", "CreditCardApiInstallmentFeePercentage", "CreditCardCheckoutFeeMode", "CreditCardCheckoutFeeFixed", "CreditCardCheckoutFeePercentage", "CreditCardCheckoutInstallmentFeePercentage", "CreditCardPaymentLinkFeeMode", "CreditCardPaymentLinkFeeFixed", "CreditCardPaymentLinkFeePercentage", "CreditCardPaymentLinkInstallmentFeePercentage", "CreditCardReservePercentage", "CreditCardReserveCompensationDays", "WithdrawalEnabled", "WithdrawalFeeMode", "WithdrawalFeeFixed", "WithdrawalFeePercentage", "MinWithdrawalAmount", "WithdrawalApprovalMode", "RateLimitPerMinute", "RateLimitPerHour", "RateLimitPerDay", "PaymentLinkDomainSelectionJson", "IsAutomaticCashoutEnabled", "AutomaticCashoutFrequency", "AutomaticCashoutMinAmount", "AutomaticCashoutMaxAmount" ]
        };
    }

    private static string GetCategoryDescription(MerchantSettingsChangeCategory category)
    {
        return category switch
        {
            MerchantSettingsChangeCategory.PixFees => "Taxas PIX atualizadas",
            MerchantSettingsChangeCategory.BoletoFees => "Taxas de boleto atualizadas",
            MerchantSettingsChangeCategory.PixLimits => "Limites PIX atualizados",
            MerchantSettingsChangeCategory.WithdrawalFees => "Taxas de saque atualizadas",
            MerchantSettingsChangeCategory.WithdrawalApprovalMode => "Modo de aprovação de saque alterado",
            MerchantSettingsChangeCategory.RateLimits => "Limites de requisições atualizados",
            MerchantSettingsChangeCategory.AutomaticCashout => "Configurações de saque automatizado atualizadas",
            MerchantSettingsChangeCategory.InitialSetup => "Configuração inicial",
            _ => "Configurações atualizadas"
        };
    }

    private static MerchantPaymentLinkDomainSelection? ParseMerchantDomainSelection(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<MerchantPaymentLinkDomainSelection>(json);
        }
        catch
        {
            return null;
        }
    }
}
