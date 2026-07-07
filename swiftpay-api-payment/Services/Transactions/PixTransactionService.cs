using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Calculation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Internal;
using swiftpay_api_payment.Interfaces.Transactions;
using swiftpay_api_payment.Services.Sandbox;

namespace swiftpay_api_payment.Services.Transactions;

public class PixTransactionService(
    PrimaryDbContext dbContext,
    IPixService pixService,
    IMessagePublisher messagePublisher,
    ISandboxService sandboxService,
    IMerchantCalculationService merchantCalculationService,
    IAcquirerNominalTrackingService acquirerNominalTrackingService,
    ISubmerchantValidationService submerchantValidationService,
    ILogger<PixTransactionService> logger
) : IPaymentMethodService
{
    private static readonly string[] FallbackCustomerNames =
    [
        "Cliente Checkout",
        "Comprador Online",
        "Cliente Digital",
        "Pagador Web"
    ];

    private static readonly string[] FallbackEmailPrefixes =
    [
        "cliente",
        "comprador",
        "pagador",
        "checkout"
    ];

    public PaymentMethod Method => PaymentMethod.Pix;

    public async Task<PaymentMethodResult> CreateAsync(PaymentMethodInput input, CancellationToken ct = default)
    {
        try
        {
            var merchantAcquirer = await GetMerchantAcquirerAsync(input.MerchantId, ct);
            if (merchantAcquirer == null)
            {
                return PaymentMethodResult.Fail(
                    "Nenhum adquirente configurado. Entre em contato com o suporte.",
                    PaymentApiErrorCodes.NoAcquirerConfigured,
                    400);
            }

            if (!merchantAcquirer.Acquirer.IsActive)
            {
                return PaymentMethodResult.Fail(
                    "A nominal ativa desta organizacao esta desabilitada. Altere para outra nominal nas configuracoes da organizacao.",
                    PaymentApiErrorCodes.NominalDisabled,
                    400);
            }

            var submerchantValidation = submerchantValidationService.ValidateForPayment(merchantAcquirer, PaymentMethod.Pix);
            if (!submerchantValidation.IsValid)
            {
                return PaymentMethodResult.Fail(
                    submerchantValidation.ErrorMessage ?? "Subconta externa nao ativa para operacao.",
                    submerchantValidation.ErrorCode,
                    submerchantValidation.StatusCode);
            }

            if (!merchantAcquirer.Acquirer.SupportsPix)
            {
                return PaymentMethodResult.Fail(
                    "Adquirente configurado não suporta PIX.",
                    PaymentApiErrorCodes.UnsupportedPaymentMethod,
                    400);
            }

            if (!merchantAcquirer.IsPixEnabled())
            {
                return PaymentMethodResult.Fail(
                    "Pagamentos via PIX não estão habilitados para esta conta.",
                    PaymentApiErrorCodes.PaymentMethodDisabled,
                    400);
            }

            if (!await IsPixEnabledForMerchantAsync(input.MerchantId, ct))
            {
                return PaymentMethodResult.Fail(
                    "Pagamentos via PIX não estão habilitados para esta conta.",
                    PaymentApiErrorCodes.PaymentMethodDisabled,
                    400);
            }

            var acquirer = merchantAcquirer.Acquirer;
            var acquirerLimitsError = ValidateAcquirerPixLimits(input.Amount, acquirer);
            if (acquirerLimitsError != null)
                return acquirerLimitsError;

            var feeContext = input.IsPaymentLinkPayment
                ? PaymentFeeContext.PaymentLink
                : input.IsCheckoutPayment
                    ? PaymentFeeContext.Checkout
                    : PaymentFeeContext.Api;

            var limits = await merchantCalculationService.GetPaymentFeeSettingsAsync(
                input.MerchantId,
                PaymentMethod.Pix,
                feeContext,
                ct);

            if (input.Amount < limits.MinTransactionAmount)
            {
                return PaymentMethodResult.Fail(
                    $"Valor abaixo do mínimo permitido. Mínimo: R$ {limits.MinTransactionAmount / 100.0m:N2}",
                    PaymentApiErrorCodes.AmountBelowMinimum,
                    400);
            }

            if (input.Amount > limits.MaxTransactionAmount)
            {
                return PaymentMethodResult.Fail(
                    $"Valor acima do máximo permitido. Máximo: R$ {limits.MaxTransactionAmount / 100.0m:N2}",
                    PaymentApiErrorCodes.AmountAboveMaximum,
                    400);
            }

            if (!await ValidateExternalIdAsync(input, ct))
            {
                return PaymentMethodResult.Fail(
                    "Já existe uma transação com este external_id.",
                    "duplicate_external_id",
                    409);
            }

            if (!await ValidateCustomerAsync(input, ct))
            {
                return PaymentMethodResult.Fail(
                    "Cliente não encontrado.",
                    PaymentApiErrorCodes.CustomerNotFound,
                    400);
            }

            var basePlatformFee = FeeCalculator.Calculate(
                input.Amount,
                limits.FeeMode,
                limits.FeeFixed,
                limits.FeePercentage);

            var checkoutTemplateFee = CheckoutTemplateFeeCalculator.Calculate(
                input.Amount,
                input.CheckoutTemplateFeeMode,
                input.CheckoutTemplateFeeFixed,
                input.CheckoutTemplateFeePercentage);

            var netAmount = FeeCalculator.CalculateNetAmount(input.Amount, basePlatformFee, checkoutTemplateFee);
            var merchantSettlementAmount = merchantCalculationService.CalculateMerchantSettlementAmount(netAmount, limits);
            var expirationMinutes = input.ExpirationMinutes ?? 30;

            var acquirerFee = FeeCalculator.Calculate(
                input.Amount,
                merchantAcquirer.PixInFeeMode,
                merchantAcquirer.PixInFeeFixed,
                merchantAcquirer.PixInFeePercentage);

            var acquirerNetAmount = FeeCalculator.CalculateAcquirerNetAmount(input.Amount, acquirerFee);

            var payment = CreatePaymentEntity(
                input,
                merchantAcquirer,
                checkoutTemplateFee,
                basePlatformFee,
                acquirerFee,
                netAmount,
                merchantSettlementAmount,
                acquirerNetAmount,
                expirationMinutes);

            dbContext.Payments.Add(payment);

            PaymentPix paymentPix;
            try
            {
                paymentPix = await CreatePaymentPixAsync(input, payment, expirationMinutes, ct);
            }
            catch (InvalidOperationException ex)
            {
                logger.LogError(
                    "PIX generation failed for merchant {MerchantId}: {ErrorMessage}",
                    input.MerchantId,
                    ex.Message);

                return PaymentMethodResult.Fail(
                    ex.Message,
                    PaymentApiErrorCodes.PixGenerationFailed,
                    400);
            }

            dbContext.PaymentsPix.Add(paymentPix);

            await dbContext.SaveChangesAsync(ct);

            await PublishLedgerPendingAsync(payment);

            if (input.Environment == ApiEnvironment.Production && !string.IsNullOrEmpty(paymentPix.CopyAndPaste))
            {
                try
                {
                    await acquirerNominalTrackingService.TrackNominalFromPixAsync(
                        merchantAcquirer.AcquirerId,
                        payment.Id,
                        paymentPix.CopyAndPaste,
                        ct);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error tracking PIX nominal for acquirer {AcquirerId}", merchantAcquirer.AcquirerId);
                }
            }

            return new PaymentMethodResult
            {
                Success = true,
                Payment = payment,
                PaymentPix = paymentPix,
                StatusCode = 201
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating PIX transaction for merchant {MerchantId}", input.MerchantId);
            return PaymentMethodResult.Fail(
                "Erro interno ao criar transação PIX.",
                PaymentApiErrorCodes.InternalError,
                500);
        }
    }

    private async Task<bool> IsPixEnabledForMerchantAsync(Guid merchantId, CancellationToken ct)
    {
        var platformSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct);

        if (platformSettings == null)
            return true;

        var merchantSettings = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == merchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        return merchantSettings?.PixEnabled ?? platformSettings.PixEnabled;
    }

    private static PaymentMethodResult? ValidateAcquirerPixLimits(long amount, Acquirer acquirer)
    {
        if (amount < acquirer.MinPixAmount)
        {
            return PaymentMethodResult.Fail(
                "O valor informado é inválido.",
                PaymentApiErrorCodes.InvalidAmount,
                400);
        }

        if (acquirer.MaxPixAmount > 0 && amount > acquirer.MaxPixAmount)
        {
            return PaymentMethodResult.Fail(
                "O valor informado é inválido.",
                PaymentApiErrorCodes.InvalidAmount,
                400);
        }

        return null;
    }

    private async Task<bool> ValidateExternalIdAsync(PaymentMethodInput input, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(input.ExternalId))
            return true;

        var exists = await dbContext.Payments
            .AsNoTracking()
            .AnyAsync(p => p.MerchantId == input.MerchantId
                && p.ExternalId == input.ExternalId, ct);

        return !exists;
    }

    private async Task<bool> ValidateCustomerAsync(PaymentMethodInput input, CancellationToken ct)
    {
        if (!input.CustomerId.HasValue)
            return true;

        return await dbContext.Customers
            .AsNoTracking()
            .AnyAsync(c => c.Id == input.CustomerId.Value
                && c.MerchantId == input.MerchantId, ct);
    }

    private async Task<MerchantAcquirer?> GetMerchantAcquirerAsync(Guid merchantId, CancellationToken ct)
    {
        var currentActive = await dbContext.MerchantAcquirers
            .AsNoTracking()
            .Include(ma => ma.Acquirer)
            .Where(ma => ma.MerchantId == merchantId && ma.IsActive)
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync(ct);

        var activeAbTest = await dbContext.MerchantNominalAbTests
            .AsNoTracking()
            .OrderByDescending(t => t.StartedAt)
            .FirstOrDefaultAsync(t => t.MerchantId == merchantId && t.IsActive, ct);

        if (activeAbTest != null)
        {
            activeAbTest = await EnsureAbTestStillActiveAsync(activeAbTest, currentActive?.Id, ct);
        }

        if (activeAbTest == null)
        {
            return currentActive;
        }

        var variants = await dbContext.MerchantAcquirers
            .AsNoTracking()
            .Include(ma => ma.Acquirer)
            .Where(ma => ma.MerchantId == merchantId
                && (ma.Id == activeAbTest.VariantAMerchantAcquirerId || ma.Id == activeAbTest.VariantBMerchantAcquirerId))
            .ToListAsync(ct);

        if (variants.Count == 0)
        {
            return currentActive;
        }

        var pickA = Random.Shared.NextDouble() * 100d < (double)activeAbTest.VariantAWeightPercent;
        var primaryId = pickA ? activeAbTest.VariantAMerchantAcquirerId : activeAbTest.VariantBMerchantAcquirerId;
        var secondaryId = pickA ? activeAbTest.VariantBMerchantAcquirerId : activeAbTest.VariantAMerchantAcquirerId;

        var selected = variants.FirstOrDefault(v => v.Id == primaryId
                                                    && v.Acquirer.IsActive
                                                    && v.Acquirer.SupportsPix
                                                    && v.IsPixEnabled()
                                                    && submerchantValidationService.IsReadyForRouting(v))
            ?? variants.FirstOrDefault(v => v.Id == secondaryId
                                            && v.Acquirer.IsActive
                                            && v.Acquirer.SupportsPix
                                            && v.IsPixEnabled()
                                            && submerchantValidationService.IsReadyForRouting(v))
            ?? variants.FirstOrDefault(v => v.Acquirer.IsActive
                                            && v.Acquirer.SupportsPix
                                            && v.IsPixEnabled()
                                            && submerchantValidationService.IsReadyForRouting(v));

        return selected ?? currentActive;
    }

    private async Task<MerchantNominalAbTest?> EnsureAbTestStillActiveAsync(
        MerchantNominalAbTest activeAbTest,
        Guid? currentActiveMerchantAcquirerId,
        CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var shouldFinishByDays = activeAbTest.LimitType == MerchantNominalAbTestLimitType.Days
            && activeAbTest.MaxDurationDays.HasValue
            && activeAbTest.MaxDurationDays.Value > 0
            && now >= activeAbTest.StartedAt.AddDays(activeAbTest.MaxDurationDays.Value);

        var shouldFinishByTransactions = false;
        if (activeAbTest.LimitType == MerchantNominalAbTestLimitType.Transactions
            && activeAbTest.MaxTransactions.HasValue
            && activeAbTest.MaxTransactions.Value > 0)
        {
            var totalInTest = await dbContext.Payments
                .AsNoTracking()
                .Where(p => p.MerchantId == activeAbTest.MerchantId
                    && p.CreatedAt >= activeAbTest.StartedAt
                    && (p.MerchantAcquirerId == activeAbTest.VariantAMerchantAcquirerId
                        || p.MerchantAcquirerId == activeAbTest.VariantBMerchantAcquirerId))
                .LongCountAsync(ct);

            shouldFinishByTransactions = totalInTest >= activeAbTest.MaxTransactions.Value;
        }

        if (!shouldFinishByDays && !shouldFinishByTransactions)
        {
            return activeAbTest;
        }

        var grouped = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == activeAbTest.MerchantId
                && p.CreatedAt >= activeAbTest.StartedAt
                && (p.MerchantAcquirerId == activeAbTest.VariantAMerchantAcquirerId
                    || p.MerchantAcquirerId == activeAbTest.VariantBMerchantAcquirerId))
            .GroupBy(p => p.MerchantAcquirerId)
            .Select(g => new
            {
                MerchantAcquirerId = g.Key,
                Total = g.LongCount(),
                Completed = g.LongCount(x => x.Status == PaymentStatus.Completed)
            })
            .ToListAsync(ct);

        var aStats = grouped.FirstOrDefault(x => x.MerchantAcquirerId == activeAbTest.VariantAMerchantAcquirerId);
        var bStats = grouped.FirstOrDefault(x => x.MerchantAcquirerId == activeAbTest.VariantBMerchantAcquirerId);

        decimal rateA = aStats == null || aStats.Total == 0 ? -1 : Math.Round((decimal)aStats.Completed / aStats.Total * 100, 4);
        decimal rateB = bStats == null || bStats.Total == 0 ? -1 : Math.Round((decimal)bStats.Completed / bStats.Total * 100, 4);

        Guid winnerId;
        if (rateA > rateB)
        {
            winnerId = activeAbTest.VariantAMerchantAcquirerId;
        }
        else if (rateB > rateA)
        {
            winnerId = activeAbTest.VariantBMerchantAcquirerId;
        }
        else
        {
            var totalA = aStats?.Total ?? 0;
            var totalB = bStats?.Total ?? 0;
            winnerId = totalB > totalA
                ? activeAbTest.VariantBMerchantAcquirerId
                : activeAbTest.VariantAMerchantAcquirerId;
        }

        try
        {
            await FinishAbTestAndActivateWinnerAsync(activeAbTest.Id, winnerId, currentActiveMerchantAcquirerId, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Failed to auto-finish nominal A/B test for merchant {MerchantId}.",
                activeAbTest.MerchantId);
            return activeAbTest;
        }

        return null;
    }

    private async Task FinishAbTestAndActivateWinnerAsync(
        Guid abTestId,
        Guid winnerMerchantAcquirerId,
        Guid? currentActiveMerchantAcquirerId,
        CancellationToken ct)
    {
        var activeTest = await dbContext.MerchantNominalAbTests
            .FirstOrDefaultAsync(t => t.Id == abTestId && t.IsActive, ct);

        if (activeTest == null)
        {
            return;
        }

        var winner = await dbContext.MerchantAcquirers
            .Include(ma => ma.Acquirer)
            .FirstOrDefaultAsync(ma => ma.MerchantId == activeTest.MerchantId && ma.Id == winnerMerchantAcquirerId, ct);

        if (winner == null || !winner.Acquirer.IsActive)
        {
            return;
        }

        if (currentActiveMerchantAcquirerId.HasValue
            && currentActiveMerchantAcquirerId.Value != winnerMerchantAcquirerId)
        {
            await RelinkLegacyMerchantAccountsAsync(activeTest.MerchantId, currentActiveMerchantAcquirerId.Value, ct);
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);

        var now = DateTime.UtcNow;

        await dbContext.MerchantAcquirers
            .Where(ma => ma.MerchantId == activeTest.MerchantId
                && ma.Id != winnerMerchantAcquirerId
                && (ma.IsActive || ma.IsDefault))
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(ma => ma.IsActive, false)
                .SetProperty(ma => ma.IsDefault, false)
                .SetProperty(ma => ma.UpdatedAt, now), ct);

        winner.IsActive = true;
        winner.IsDefault = true;
        winner.ActivatedAt = now;
        winner.UpdatedAt = now;

        activeTest.IsActive = false;
        activeTest.IsAutoFinished = true;
        activeTest.WinnerMerchantAcquirerId = winnerMerchantAcquirerId;
        activeTest.EndedAt = now;
        activeTest.EndReason = activeTest.LimitType == MerchantNominalAbTestLimitType.Days
            ? "Finalizado automaticamente por limite de dias"
            : "Finalizado automaticamente por limite de transacoes";
        activeTest.UpdatedAt = now;

        await dbContext.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }

    private async Task RelinkLegacyMerchantAccountsAsync(Guid merchantId, Guid previousMerchantAcquirerId, CancellationToken ct)
    {
        var legacyAccounts = await dbContext.Accounts
            .Where(a => a.MerchantId == merchantId
                && a.MerchantAcquirerId == null
                && (a.Type == AccountType.MerchantAvailable
                    || a.Type == AccountType.MerchantPending
                    || a.Type == AccountType.MerchantBlocked
                    || a.Type == AccountType.MerchantPayoutsOut))
            .ToListAsync(ct);

        if (legacyAccounts.Count == 0)
        {
            return;
        }

        var legacyTypes = legacyAccounts.Select(a => a.Type).Distinct().ToList();
        var legacyEnvironments = legacyAccounts.Select(a => a.Environment).Distinct().ToList();

        var targetAccounts = await dbContext.Accounts
            .Where(a => a.MerchantId == merchantId
                && a.MerchantAcquirerId == previousMerchantAcquirerId
                && legacyTypes.Contains(a.Type)
                && legacyEnvironments.Contains(a.Environment))
            .ToListAsync(ct);

        var targetMap = targetAccounts.ToDictionary(a => (a.Type, a.Environment), a => a);
        var now = DateTime.UtcNow;

        foreach (var legacyAccount in legacyAccounts)
        {
            if (targetMap.TryGetValue((legacyAccount.Type, legacyAccount.Environment), out var targetAccount))
            {
                if (legacyAccount.Balance != 0)
                {
                    targetAccount.Balance += legacyAccount.Balance;
                    targetAccount.UpdatedAt = now;
                }

                legacyAccount.Balance = 0;
                legacyAccount.UpdatedAt = now;
                continue;
            }

            legacyAccount.MerchantAcquirerId = previousMerchantAcquirerId;
            legacyAccount.UpdatedAt = now;
        }

        await dbContext.SaveChangesAsync(ct);
    }

    private static Payment CreatePaymentEntity(
        PaymentMethodInput input,
        MerchantAcquirer merchantAcquirer,
        long checkoutTemplateFee,
        long platformFee,
        long acquirerFee,
        long netAmount,
        long merchantSettlementAmount,
        long acquirerNetAmount,
        int expirationMinutes)
    {
        return new Payment
        {
            Id = Guid.CreateVersion7(),
            MerchantId = input.MerchantId,
            MerchantAcquirerId = merchantAcquirer.Id,
            AcquirerId = merchantAcquirer.AcquirerId,
            AcquirerDisplayName = merchantAcquirer.Acquirer?.DisplayName ?? merchantAcquirer.Acquirer?.Name,
            AcquirerNominal = merchantAcquirer.Acquirer?.Nominal,
            CustomerId = input.CustomerId,
            ExternalId = input.ExternalId,
            Amount = input.Amount,
            PlatformFee = platformFee,
            CheckoutTemplateFee = checkoutTemplateFee,
            AcquirerFee = acquirerFee,
            NetAmount = netAmount,
            MerchantSettlementAmount = merchantSettlementAmount,
            AcquirerNetAmount = acquirerNetAmount,
            Currency = input.Currency,
            Method = PaymentMethod.Pix,
            Status = PaymentStatus.Pending,
            Description = input.Description,
            CallbackUrl = input.CallbackUrl,
            Environment = input.Environment,
            RequestOrigin = input.RequestOrigin,
            RequestSource = input.RequestSource,
            Metadata = input.Metadata,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes)
        };
    }

    private async Task<PaymentPix> CreatePaymentPixAsync(
        PaymentMethodInput input,
        Payment payment,
        int expirationMinutes,
        CancellationToken ct)
    {
        if (input.Environment == ApiEnvironment.Sandbox)
        {
            var sandboxData = sandboxService.GenerateSandboxPixData(
                input.Amount,
                input.Description,
                expirationMinutes);

            payment.AcquirerPaymentId = sandboxData.TxId;

            return new PaymentPix
            {
                Id = Guid.CreateVersion7(),
                PaymentId = payment.Id,
                TxId = sandboxData.TxId,
                QrCode = sandboxData.QrCode,
                CopyAndPaste = sandboxData.CopyAndPaste,
                ExpiresAt = sandboxData.ExpiresAt
            };
        }

        var customerName = ResolveCustomerName(input.CustomerName, input.ExternalId);
        var customerDocument = ResolveCustomerDocument(input.CustomerDocument);
        var customerEmail = ResolveCustomerEmail(input.CustomerEmail, input.ExternalId);
        var customerPhone = ResolveCustomerPhone(input.CustomerPhone, input.ExternalId);

        var pixResult = await pixService.GeneratePixAsync(
            input.MerchantId,
            input.Amount,
            input.Description,
            payment.Id.ToString(),
            input.Environment,
            expirationMinutes,
            customerName,
            customerDocument,
            customerEmail,
            customerPhone,
            payment.MerchantAcquirerId);

        if (!pixResult.Success)
        {
            throw new InvalidOperationException(pixResult.ErrorMessage ?? "Falha ao gerar PIX.");
        }

        if (pixResult.MerchantAcquirerId.HasValue && pixResult.MerchantAcquirerId.Value != payment.MerchantAcquirerId)
        {
            throw new InvalidOperationException("Inconsistencia na adquirente selecionada para geracao do PIX.");
        }

        if (pixResult.AcquirerId.HasValue && payment.AcquirerId.HasValue && pixResult.AcquirerId.Value != payment.AcquirerId.Value)
        {
            throw new InvalidOperationException("Inconsistencia na adquirente configurada para geracao do PIX.");
        }

        payment.AcquirerPaymentId = pixResult.AcquirerPaymentId;

        return new PaymentPix
        {
            Id = Guid.CreateVersion7(),
            PaymentId = payment.Id,
            TxId = pixResult.TxId,
            QrCode = pixResult.QrCode ?? "",
            CopyAndPaste = pixResult.CopyAndPaste ?? "",
            ExpiresAt = EnsureUtc(pixResult.ExpiresAt ?? payment.ExpiresAt!.Value)
        };
    }

    private async Task PublishLedgerPendingAsync(Payment payment)
    {
        var totalPlatformFee = payment.PlatformFee + payment.CheckoutTemplateFee;

        await messagePublisher.PublishAsync(
            RabbitMQQueues.RecordLedgerPending,
            new RecordLedgerPendingMessage
            {
                MerchantId = payment.MerchantId,
                MerchantAcquirerId = payment.MerchantAcquirerId,
                PaymentId = payment.Id,
                Amount = payment.Amount,
                PlatformFee = totalPlatformFee,
                MerchantSettlementAmount = payment.MerchantSettlementAmount,
                Description = $"Pagamento PIX pendente - {payment.Description}",
                Environment = payment.Environment
            });
    }

    private static string ResolveCustomerName(string? customerName, string? source)
    {
        if (!string.IsNullOrWhiteSpace(customerName))
            return customerName.Trim();

        var index = ResolveFallbackIndex(source, FallbackCustomerNames.Length);
        return FallbackCustomerNames[index];
    }

    private static string ResolveCustomerDocument(string? customerDocument)
    {
        if (!string.IsNullOrWhiteSpace(customerDocument))
        {
            var digits = new string(customerDocument.Where(char.IsDigit).ToArray());
            if (digits.Length is 11 or 14)
                return digits;
        }

        return DocumentUtils.GenerateValidCpf();
    }

    private static string ResolveCustomerEmail(string? customerEmail, string? source)
    {
        if (!string.IsNullOrWhiteSpace(customerEmail))
            return customerEmail.Trim().ToLowerInvariant();

        var prefixIndex = ResolveFallbackIndex(source, FallbackEmailPrefixes.Length);
        var prefix = FallbackEmailPrefixes[prefixIndex];
        var suffix = ResolveEmailSuffix(source);

        return $"{prefix}+{suffix}@transactions.swiftpay.app";
    }

    private static string ResolveCustomerPhone(string? customerPhone, string? source)
    {
        var digits = SanitizeUtils.SanitizePhone(customerPhone);
        if (!string.IsNullOrWhiteSpace(digits) && digits.Length >= 10)
        {
            return digits.Length > 11 ? digits[^11..] : digits;
        }

        var hash = ComputeStablePositiveHash(ResolveFallbackSource(source));
        var suffix = (hash % 90000000) + 10000000;
        return $"119{suffix}";
    }

    private static int ResolveFallbackIndex(string? source, int size)
    {
        if (size <= 1)
            return 0;

        var hash = ComputeStablePositiveHash(ResolveFallbackSource(source));
        return hash % size;
    }

    private static string ResolveEmailSuffix(string? source)
    {
        var raw = string.IsNullOrWhiteSpace(source)
            ? Guid.CreateVersion7().ToString("N")
            : source.Trim().ToLowerInvariant();

        var sanitized = new string(raw.Where(char.IsLetterOrDigit).ToArray());
        if (string.IsNullOrWhiteSpace(sanitized))
            sanitized = Guid.CreateVersion7().ToString("N");

        return sanitized.Length <= 24 ? sanitized : sanitized[^24..];
    }

    private static string ResolveFallbackSource(string? source)
    {
        return string.IsNullOrWhiteSpace(source)
            ? Guid.CreateVersion7().ToString("N")
            : source.Trim();
    }

    private static int ComputeStablePositiveHash(string value)
    {
        unchecked
        {
            var hash = 17;
            foreach (var ch in value)
            {
                hash = (hash * 31) + ch;
            }

            return hash & int.MaxValue;
        }
    }

    private static DateTime EnsureUtc(DateTime dt)
    {
        return dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);
    }
}
