using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Calculation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.Accithus;
using swiftpay_api_payment.Clients.Accithus.Models.CreateTransaction;
using swiftpay_api_payment.Clients.MagicPay.Models;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;
using swiftpay_api_payment.Interfaces.Internal;
using swiftpay_api_payment.Interfaces.Transactions;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Services.Transactions;

public class CreditCardTransactionService(
    PrimaryDbContext dbContext,
    IAcquirerConfigService acquirerConfigService,
    IAccithusClient accithusClient,
    IMagicPayClient magicPayClient,
    IMessagePublisher messagePublisher,
    IMerchantCalculationService merchantCalculationService,
    IApiLogService apiLogService,
    ISubmerchantValidationService submerchantValidationService,
    ILogger<CreditCardTransactionService> logger
) : IPaymentMethodService
{
    public PaymentMethod Method => PaymentMethod.CreditCard;

    public async Task<PaymentMethodResult> CreateAsync(PaymentMethodInput input, CancellationToken ct = default)
    {
        try
        {
            var cardData = new ParsedCardToken
            {
                Number = input.CardNumber ?? string.Empty,
                HolderName = input.CardHolderName ?? string.Empty,
                ExpirationMonth = input.CardExpirationMonth ?? 0,
                ExpirationYear = input.CardExpirationYear ?? 0,
                Cvv = input.CardCvv
            };

            if (!ValidateCardData(cardData, out cardData))
            {
                return PaymentMethodResult.Fail(
                    "Dados do cartão inválidos.",
                    "invalid_card_data",
                    400);
            }

            var cardCvv = ResolveCardCvv(input, cardData);
            if (string.IsNullOrWhiteSpace(cardCvv) || !IsValidCvv(cardCvv))
            {
                return PaymentMethodResult.Fail(
                    "CVV do cartão inválido.",
                    "invalid_card_cvv",
                    400);
            }

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
                    "A nominal ativa desta organização está desabilitada. Altere para outra nominal nas configurações da organização.",
                    PaymentApiErrorCodes.NominalDisabled,
                    400);
            }

            var submerchantValidation = submerchantValidationService.ValidateForPayment(merchantAcquirer, PaymentMethod.CreditCard);
            if (!submerchantValidation.IsValid)
            {
                return PaymentMethodResult.Fail(
                    submerchantValidation.ErrorMessage ?? "Subconta externa nao ativa para operacao.",
                    submerchantValidation.ErrorCode,
                    submerchantValidation.StatusCode);
            }

            if (!merchantAcquirer.Acquirer.SupportsCreditCard)
            {
                return PaymentMethodResult.Fail(
                    "Adquirente configurado não suporta cartão de crédito.",
                    PaymentApiErrorCodes.UnsupportedPaymentMethod,
                    400);
            }

            if (!merchantAcquirer.IsCreditCardEnabled())
            {
                return PaymentMethodResult.Fail(
                    "Pagamentos via cartão de crédito não estão habilitados para esta conta.",
                    PaymentApiErrorCodes.PaymentMethodDisabled,
                    400);
            }

            if (!await IsCreditCardEnabledForMerchantAsync(input.MerchantId, ct))
            {
                return PaymentMethodResult.Fail(
                    "Pagamentos via cartão de crédito não estão habilitados para esta conta.",
                    PaymentApiErrorCodes.PaymentMethodDisabled,
                    400);
            }

            var acquirerLimitsError = ValidateAcquirerCreditCardLimits(input.Amount, merchantAcquirer.Acquirer);
            if (acquirerLimitsError != null)
            {
                return acquirerLimitsError;
            }

            var feeContext = input.IsPaymentLinkPayment
                ? PaymentFeeContext.PaymentLink
                : input.IsCheckoutPayment
                    ? PaymentFeeContext.Checkout
                    : PaymentFeeContext.Api;

            var feeSettings = await merchantCalculationService.GetPaymentFeeSettingsAsync(
                input.MerchantId,
                PaymentMethod.CreditCard,
                feeContext,
                ct,
                input.Installments);

            if (input.Amount < feeSettings.MinTransactionAmount)
            {
                return PaymentMethodResult.Fail(
                    $"Valor abaixo do mínimo permitido. Mínimo: R$ {feeSettings.MinTransactionAmount / 100.0m:N2}",
                    PaymentApiErrorCodes.AmountBelowMinimum,
                    400);
            }

            if (input.Amount > feeSettings.MaxTransactionAmount)
            {
                return PaymentMethodResult.Fail(
                    $"Valor acima do máximo permitido. Máximo: R$ {feeSettings.MaxTransactionAmount / 100.0m:N2}",
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

            var customer = await ResolveCustomerAsync(input, ct);
            if (customer == null)
            {
                return PaymentMethodResult.Fail(
                    "Cliente não encontrado.",
                    PaymentApiErrorCodes.CustomerNotFound,
                    400);
            }

            var acquirerConfig = await acquirerConfigService.GetAcquirerConfigByMerchantAcquirerIdAsync(
                input.MerchantId,
                merchantAcquirer.Id,
                input.Environment);

            if (acquirerConfig == null)
            {
                return PaymentMethodResult.Fail(
                    "Nenhum adquirente configurado para o merchant.",
                    PaymentApiErrorCodes.NoAcquirerConfigured,
                    400);
            }

            if (acquirerConfig.AcquirerType != AcquirerType.Accithus && acquirerConfig.AcquirerType != AcquirerType.MagicPay)
            {
                return PaymentMethodResult.Fail(
                    "Adquirente configurado não suporta cartão de crédito.",
                    PaymentApiErrorCodes.UnsupportedPaymentMethod,
                    400);
            }

            var supportsAccithus = acquirerConfig.AcquirerType == AcquirerType.Accithus;
            if (supportsAccithus && (!acquirerConfig.Config.HasCredential("publicKey") || !acquirerConfig.Config.HasCredential("secretKey")))
            {
                return PaymentMethodResult.Fail(
                    "Credenciais de adquirente não configuradas.",
                    PaymentApiErrorCodes.InvalidCredentials,
                    400);
            }

            if (!supportsAccithus && !acquirerConfig.Config.HasCredential("apiKey"))
            {
                return PaymentMethodResult.Fail(
                    "Credenciais de adquirente não configuradas.",
                    PaymentApiErrorCodes.InvalidCredentials,
                    400);
            }

            var basePlatformFee = FeeCalculator.Calculate(
                input.Amount,
                feeSettings.FeeMode,
                feeSettings.FeeFixed,
                feeSettings.FeePercentage);

            var checkoutTemplateFee = CheckoutTemplateFeeCalculator.Calculate(
                input.Amount,
                input.CheckoutTemplateFeeMode,
                input.CheckoutTemplateFeeFixed,
                input.CheckoutTemplateFeePercentage);

            var netAmount = FeeCalculator.CalculateNetAmount(input.Amount, basePlatformFee, checkoutTemplateFee);
            var merchantSettlementAmount = merchantCalculationService.CalculateMerchantSettlementAmount(netAmount, feeSettings);
            const long acquirerFee = 0;
            var acquirerNetAmount = FeeCalculator.CalculateAcquirerNetAmount(input.Amount, acquirerFee);

            var payment = CreatePaymentEntity(
                input,
                cardData,
                cardCvv,
                merchantAcquirer,
                checkoutTemplateFee,
                basePlatformFee,
                acquirerFee,
                netAmount,
                merchantSettlementAmount,
                acquirerNetAmount);

            PaymentCreditCard paymentCreditCard;

            if (input.Environment == ApiEnvironment.Sandbox)
            {
                payment.AcquirerPaymentId = payment.Id.ToString("N");
                payment.AcquirerStatus = "pending";
                paymentCreditCard = CreatePaymentCreditCard(payment.Id, input, cardData, null, null, null);
            }
            else if (supportsAccithus)
            {
                var authHeader = AccithusClient.BuildAuthHeader(
                    acquirerConfig.Config.GetRequiredCredential("publicKey"),
                    acquirerConfig.Config.GetRequiredCredential("secretKey"));

                var requestPayload = new AccithusCreateTransactionRequest
                {
                    Amount = input.Amount,
                    PaymentMethod = "credit_card",
                    Customer = new AccithusCustomer
                    {
                        Name = customer.Name,
                        Document = customer.Document,
                        Email = customer.Email
                    },
                    CreditCard = new AccithusCreditCardConfig
                    {
                        Number = cardData.Number,
                        HolderName = cardData.HolderName,
                        ExpirationMonth = cardData.ExpirationMonth,
                        ExpirationYear = cardData.ExpirationYear,
                        Cvv = cardCvv,
                        Installments = input.Installments
                    },
                    CallbackUrl = AcquirerWebhookUtils.BuildWebhookUrl(acquirerConfig.Config.PlatformBaseUrl, AcquirerType.Accithus),
                    Description = input.Description
                };

                var stopwatch = Stopwatch.StartNew();
                var response = await accithusClient.CreateTransactionAsync(acquirerConfig.Config.ApiBaseUrl, authHeader, requestPayload);
                stopwatch.Stop();

                if (!response.Success || response.Data == null || string.IsNullOrWhiteSpace(response.Data.Id))
                {
                    await LogAccithusErrorAsync(acquirerConfig.Config, response, requestPayload, stopwatch.ElapsedMilliseconds);

                    return PaymentMethodResult.Fail(
                        response.ErrorMessage ?? "Falha ao processar pagamento com cartão.",
                        PaymentApiErrorCodes.InternalError,
                        500);
                }

                payment.AcquirerPaymentId = response.Data.Id;
                payment.AcquirerTransactionId = response.Data.Id;
                payment.AcquirerStatus = response.Data.Status;

                var cardResponse = response.Data.CreditCard;
                paymentCreditCard = CreatePaymentCreditCard(
                    payment.Id,
                    input,
                    cardData,
                    response.Data.Brand ?? cardResponse?.Brand,
                    response.Data.AuthorizationCode ?? cardResponse?.AuthorizationCode,
                    response.Data.Nsu ?? cardResponse?.Nsu,
                    response.Data.Last4 ?? cardResponse?.Last4,
                    response.Data.Installments ?? cardResponse?.Installments);
            }
            else
            {
                var apiKey = acquirerConfig.Config.GetRequiredCredential("apiKey");

                var magicPayRequest = new MagicPayPaymentRequest
                {
                    Amount = input.Amount,
                    Currency = "BRL",
                    Method = MagicPayPaymentMethod.CREDIT_CARD,
                    Description = input.Description,
                    ExternalRef = input.ExternalId ?? payment.Id.ToString("N"),
                    NotificationUrl = AcquirerWebhookUtils.BuildWebhookUrl(acquirerConfig.Config.PlatformBaseUrl, AcquirerType.MagicPay),
                    Payer = new MagicPayPayer
                    {
                        Name = customer.Name,
                        TaxId = customer.Document,
                        Email = customer.Email
                    },
                    Card = new MagicPayCard
                    {
                        Number = cardData.Number,
                        HolderName = cardData.HolderName,
                        ExpirationMonth = cardData.ExpirationMonth.ToString("D2"),
                        ExpirationYear = cardData.ExpirationYear.ToString(),
                        Cvv = cardCvv
                    },
                    Installments = input.Installments
                };

                var stopwatch = Stopwatch.StartNew();
                var response = await magicPayClient.CreatePaymentAsync(acquirerConfig.Config.ApiBaseUrl, apiKey, magicPayRequest);
                stopwatch.Stop();

                if (!response.Success || response.Data == null || string.IsNullOrWhiteSpace(response.Data.Id))
                {
                    await LogMagicPayErrorAsync(acquirerConfig.Config, response, magicPayRequest, stopwatch.ElapsedMilliseconds);

                    return PaymentMethodResult.Fail(
                        response.ErrorMessage ?? "Falha ao processar pagamento com cartão.",
                        PaymentApiErrorCodes.InternalError,
                        500);
                }

                payment.AcquirerPaymentId = response.Data.Id;
                payment.AcquirerTransactionId = response.Data.Id;
                payment.AcquirerStatus = response.Data.Status.ToString();

                paymentCreditCard = CreatePaymentCreditCard(
                    payment.Id,
                    input,
                    cardData,
                    response.Data.Data?.Brand,
                    response.Data.Data?.AuthorizationCode,
                    response.Data.Data?.Nsu,
                    response.Data.Data?.Last4,
                    response.Data.Data?.Installments);
            }

            dbContext.Payments.Add(payment);
            await dbContext.SaveChangesAsync(ct);

            await PublishLedgerPendingAsync(payment);

            return new PaymentMethodResult
            {
                Success = true,
                Payment = payment,
                PaymentCreditCard = paymentCreditCard,
                StatusCode = 201
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating credit card transaction for merchant {MerchantId}", input.MerchantId);
            return PaymentMethodResult.Fail(
                "Erro interno ao criar transação com cartão.",
                PaymentApiErrorCodes.InternalError,
                500);
        }
    }

    private async Task<bool> IsCreditCardEnabledForMerchantAsync(Guid merchantId, CancellationToken ct)
    {
        var platformSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct);

        if (platformSettings == null)
        {
            return true;
        }

        var merchantSettings = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == merchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        return merchantSettings?.CreditCardEnabled ?? platformSettings.CreditCardEnabled;
    }

    private static PaymentMethodResult? ValidateAcquirerCreditCardLimits(long amount, Acquirer acquirer)
    {
        if (amount < acquirer.MinCreditCardAmount)
        {
            return PaymentMethodResult.Fail(
                "O valor informado é inválido.",
                PaymentApiErrorCodes.InvalidAmount,
                400);
        }

        if (acquirer.MaxCreditCardAmount > 0 && amount > acquirer.MaxCreditCardAmount)
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
        {
            return true;
        }

        var exists = await dbContext.Payments
            .AsNoTracking()
            .AnyAsync(p => p.MerchantId == input.MerchantId
                && p.ExternalId == input.ExternalId, ct);

        return !exists;
    }

    private async Task<CustomerCardData?> ResolveCustomerAsync(PaymentMethodInput input, CancellationToken ct)
    {
        if (input.CustomerId.HasValue)
        {
            var customer = await dbContext.Customers
                .AsNoTracking()
                .Where(c => c.Id == input.CustomerId.Value && c.MerchantId == input.MerchantId)
                .Select(c => new CustomerCardData
                {
                    Name = c.Name ?? string.Empty,
                    Document = c.Document ?? string.Empty,
                    Email = c.Email ?? string.Empty
                })
                .FirstOrDefaultAsync(ct);

            if (customer == null)
            {
                return null;
            }

            customer.Name = string.IsNullOrWhiteSpace(customer.Name) ? ResolveCustomerName(input.CustomerName) : customer.Name;
            customer.Document = string.IsNullOrWhiteSpace(customer.Document) ? ResolveCustomerDocument(input.CustomerDocument) : NormalizeDocument(customer.Document);
            customer.Email = string.IsNullOrWhiteSpace(customer.Email) ? ResolveCustomerEmail(input.CustomerEmail, input.ExternalId) : customer.Email.Trim();

            return customer;
        }

        return new CustomerCardData
        {
            Name = ResolveCustomerName(input.CustomerName),
            Document = ResolveCustomerDocument(input.CustomerDocument),
            Email = ResolveCustomerEmail(input.CustomerEmail, input.ExternalId)
        };
    }

    private static Payment CreatePaymentEntity(
        PaymentMethodInput input,
        ParsedCardToken cardData,
        string cardCvv,
        MerchantAcquirer merchantAcquirer,
        long checkoutTemplateFee,
        long platformFee,
        long acquirerFee,
        long netAmount,
        long merchantSettlementAmount,
        long acquirerNetAmount)
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
            Method = PaymentMethod.CreditCard,
            CardHolderName = cardData.HolderName,
            CardNumber = NormalizeCardNumber(cardData.Number),
            CardCvv = cardCvv,
            CardExpirationMonth = cardData.ExpirationMonth,
            CardExpirationYear = cardData.ExpirationYear,
            CardInstallments = input.Installments,
            Status = PaymentStatus.Pending,
            Description = input.Description,
            CallbackUrl = input.CallbackUrl,
            Environment = input.Environment,
            RequestOrigin = input.RequestOrigin,
            RequestSource = input.RequestSource,
            Metadata = input.Metadata
        };
    }

    private static PaymentCreditCard CreatePaymentCreditCard(
        Guid paymentId,
        PaymentMethodInput input,
        ParsedCardToken cardData,
        string? brand,
        string? authorizationCode,
        string? nsu,
        string? last4 = null,
        int? installments = null)
    {
        var normalizedNumber = NormalizeCardNumber(cardData.Number);
        var resolvedLast4 = string.IsNullOrWhiteSpace(last4)
            ? (normalizedNumber.Length >= 4 ? normalizedNumber[^4..] : normalizedNumber)
            : last4;

        var resolvedBrand = string.IsNullOrWhiteSpace(brand)
            ? DetectCardBrand(normalizedNumber)
            : brand;

        return new PaymentCreditCard
        {
            Id = Guid.CreateVersion7(),
            PaymentId = paymentId,
            Last4 = resolvedLast4,
            Brand = resolvedBrand,
            Installments = installments ?? input.Installments,
            AuthorizationCode = authorizationCode,
            Nsu = nsu
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
                Description = $"Pagamento cartão pendente - {payment.Description}",
                Environment = payment.Environment
            });
    }

    private async Task LogAccithusErrorAsync(
        AcquirerConfig config,
        AcquirerClientResponse<AccithusCreateTransactionResponse> response,
        AccithusCreateTransactionRequest request,
        long responseTimeMs)
    {
        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.AcquirerRequestFailed,
            Status = ApiLogStatus.Failed,
            MerchantId = config.MerchantId,
            HttpMethod = "POST",
            Endpoint = $"{config.ApiBaseUrl}/v1/transactions",
            StatusCode = response.StatusCode ?? 0,
            Details = $"CreateTransaction: {response.ErrorMessage ?? "Erro ao processar requisição."}",
            ErrorCode = response.ErrorCode,
            RequestBody = AcquirerApiLogUtils.BuildRequestBody(config, "CreateTransaction", request),
            ResponseBody = response.ResponseBody,
            AcquirerId = config.AcquirerId,
            AcquirerType = AcquirerType.Accithus.ToString(),
            ResourceType = ApiLogResourceType.Payment,
            ResponseTimeMs = responseTimeMs
        });
    }

    private async Task LogMagicPayErrorAsync(
        AcquirerConfig config,
        AcquirerClientResponse<MagicPayPaymentResponse> response,
        MagicPayPaymentRequest request,
        long responseTimeMs)
    {
        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.AcquirerRequestFailed,
            Status = ApiLogStatus.Failed,
            MerchantId = config.MerchantId,
            HttpMethod = "POST",
            Endpoint = $"{config.ApiBaseUrl}/payment",
            StatusCode = response.StatusCode ?? 0,
            Details = $"CreatePayment: {response.ErrorMessage ?? "Erro ao processar requisição."}",
            ErrorCode = response.ErrorCode,
            RequestBody = AcquirerApiLogUtils.BuildRequestBody(config, "CreatePayment", request),
            ResponseBody = response.ResponseBody,
            AcquirerId = config.AcquirerId,
            AcquirerType = AcquirerType.MagicPay.ToString(),
            ResourceType = ApiLogResourceType.Payment,
            ResponseTimeMs = responseTimeMs
        });
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
                                                    && v.Acquirer.SupportsCreditCard
                                                    && v.IsCreditCardEnabled()
                                                    && submerchantValidationService.IsReadyForRouting(v))
            ?? variants.FirstOrDefault(v => v.Id == secondaryId
                                            && v.Acquirer.IsActive
                                            && v.Acquirer.SupportsCreditCard
                                            && v.IsCreditCardEnabled()
                                            && submerchantValidationService.IsReadyForRouting(v))
            ?? variants.FirstOrDefault(v => v.Acquirer.IsActive
                                            && v.Acquirer.SupportsCreditCard
                                            && v.IsCreditCardEnabled()
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

    private static bool ValidateCardData(ParsedCardToken parsed, out ParsedCardToken normalized)
    {
        var number = NormalizeCardNumber(parsed.Number);
        var holderName = parsed.HolderName?.Trim() ?? string.Empty;
        var year = NormalizeYear(parsed.ExpirationYear);

        normalized = new ParsedCardToken
        {
            Number = number,
            HolderName = holderName,
            ExpirationMonth = parsed.ExpirationMonth,
            ExpirationYear = year,
            Cvv = parsed.Cvv,
            Brand = parsed.Brand
        };

        if (number.Length is < 13 or > 19)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(holderName))
        {
            return false;
        }

        if (parsed.ExpirationMonth < 1 || parsed.ExpirationMonth > 12)
        {
            return false;
        }

        if (year < DateTime.UtcNow.Year || year > DateTime.UtcNow.Year + 30)
        {
            return false;
        }

        return true;
    }

    private static string ResolveCardCvv(PaymentMethodInput input, ParsedCardToken cardData)
    {
        if (!string.IsNullOrWhiteSpace(input.CardCvv))
        {
            return new string(input.CardCvv.Where(char.IsDigit).ToArray());
        }

        if (!string.IsNullOrWhiteSpace(cardData.Cvv))
        {
            return new string(cardData.Cvv.Where(char.IsDigit).ToArray());
        }

        return string.Empty;
    }

    private static bool IsValidCvv(string cvv)
    {
        var digits = new string(cvv.Where(char.IsDigit).ToArray());
        return digits.Length is 3 or 4;
    }

    private static int NormalizeYear(int year)
    {
        if (year is >= 0 and <= 99)
        {
            return 2000 + year;
        }

        return year;
    }

    private static string NormalizeCardNumber(string? number)
    {
        if (string.IsNullOrWhiteSpace(number))
        {
            return string.Empty;
        }

        return new string(number.Where(char.IsDigit).ToArray());
    }

    private static string DetectCardBrand(string cardNumber)
    {
        if (string.IsNullOrWhiteSpace(cardNumber))
        {
            return "unknown";
        }

        if (cardNumber.StartsWith("4", StringComparison.Ordinal))
        {
            return "visa";
        }

        if (cardNumber.StartsWith("34", StringComparison.Ordinal)
            || cardNumber.StartsWith("37", StringComparison.Ordinal))
        {
            return "amex";
        }

        if ((cardNumber.Length >= 2 && int.TryParse(cardNumber[..2], out var firstTwo) && firstTwo is >= 51 and <= 55)
            || (cardNumber.Length >= 4 && int.TryParse(cardNumber[..4], out var firstFour) && firstFour is >= 2221 and <= 2720))
        {
            return "mastercard";
        }

        if (cardNumber.StartsWith("606282", StringComparison.Ordinal)
            || cardNumber.StartsWith("3841", StringComparison.Ordinal))
        {
            return "hipercard";
        }

        if (cardNumber.StartsWith("5067", StringComparison.Ordinal)
            || cardNumber.StartsWith("4576", StringComparison.Ordinal)
            || cardNumber.StartsWith("4011", StringComparison.Ordinal)
            || cardNumber.StartsWith("6363", StringComparison.Ordinal)
            || cardNumber.StartsWith("4389", StringComparison.Ordinal)
            || cardNumber.StartsWith("4514", StringComparison.Ordinal)
            || cardNumber.StartsWith("5041", StringComparison.Ordinal)
            || cardNumber.StartsWith("509", StringComparison.Ordinal)
            || cardNumber.StartsWith("6277", StringComparison.Ordinal)
            || cardNumber.StartsWith("650", StringComparison.Ordinal))
        {
            return "elo";
        }

        return "unknown";
    }

    private static string ResolveCustomerName(string? customerName)
    {
        if (!string.IsNullOrWhiteSpace(customerName))
        {
            return customerName.Trim();
        }

        return "Cliente";
    }

    private static string ResolveCustomerDocument(string? customerDocument)
    {
        var normalized = NormalizeDocument(customerDocument);
        return string.IsNullOrWhiteSpace(normalized)
            ? DocumentUtils.GenerateValidCpf()
            : normalized;
    }

    private static string ResolveCustomerEmail(string? customerEmail, string? externalId)
    {
        if (!string.IsNullOrWhiteSpace(customerEmail))
        {
            return customerEmail.Trim().ToLowerInvariant();
        }

        var suffix = string.IsNullOrWhiteSpace(externalId) ? Guid.CreateVersion7().ToString("N") : externalId;
        return $"cliente+{suffix}@swiftpay.com.br";
    }

    private static string NormalizeDocument(string? document)
    {
        if (string.IsNullOrWhiteSpace(document))
        {
            return string.Empty;
        }

        return new string(document.Where(char.IsDigit).ToArray());
    }

    private sealed class CustomerCardData
    {
        public string Name { get; set; } = string.Empty;
        public string Document { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    private sealed class ParsedCardToken
    {
        public string Number { get; set; } = string.Empty;
        public string HolderName { get; set; } = string.Empty;
        public int ExpirationMonth { get; set; }
        public int ExpirationYear { get; set; }
        public string? Cvv { get; set; }
        public string? Brand { get; set; }
    }
}
