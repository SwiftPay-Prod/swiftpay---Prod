using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Calculation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Clients.ActivePayments.Models.CreateBillet;
using swiftpay_api_payment.Clients.Coldfy.Models.Payments;
using swiftpay_api_payment.Clients.HeartPay.Models.Boletos;
using swiftpay_api_payment.Clients.MagicPay.Models;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;
using swiftpay_api_payment.Interfaces.Internal;
using swiftpay_api_payment.Interfaces.Transactions;
using swiftpay_api_payment.Models.Transactions;
using swiftpay_api_payment.Services.Acquirers.Utils;
using PaymentBoletoDto = swiftpay_api_payment.Interfaces.Transactions.PaymentBoleto;

namespace swiftpay_api_payment.Services.Transactions;

public class BoletoTransactionService(
    PrimaryDbContext dbContext,
    IAcquirerConfigService acquirerConfigService,
    IActivePaymentsClient activePaymentsClient,
    IColdfyClient coldfyClient,
    IHeartPayClient heartPayClient,
    IMagicPayClient magicPayClient,
    IMessagePublisher messagePublisher,
    IMerchantCalculationService merchantCalculationService,
    IApiLogService apiLogService,
    ISubmerchantValidationService submerchantValidationService,
    ILogger<BoletoTransactionService> logger
) : IPaymentMethodService
{
    private const string HeartPayCanonicalBaseUrl = "https://app.heartpag.com/api";
    private const string HeartPayLegacyBaseHost = "https://api.heartpay.com.br";

    public PaymentMethod Method => PaymentMethod.Boleto;

    public async Task<PaymentMethodResult> CreateAsync(PaymentMethodInput input, CancellationToken ct = default)
    {
        try
        {
            if (!input.CustomerId.HasValue)
            {
                return PaymentMethodResult.Fail(
                    "Cliente é obrigatório para pagamentos com boleto.",
                    PaymentApiErrorCodes.CustomerNotFound,
                    400);
            }

            if (!input.BoletoDueDate.HasValue)
            {
                return PaymentMethodResult.Fail(
                    "A data de vencimento do boleto é obrigatória.",
                    "invalid_boleto_due_date",
                    400);
            }

            if (input.BoletoDueDate.Value.Date < DateTime.UtcNow.Date.AddDays(2))
            {
                return PaymentMethodResult.Fail(
                    "A data de vencimento do boleto deve ser no mínimo D+2.",
                    "invalid_boleto_due_date",
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
                    "A nominal ativa desta organizacao esta desabilitada. Altere para outra nominal nas configuracoes da organizacao.",
                    PaymentApiErrorCodes.NominalDisabled,
                    400);
            }

            var submerchantValidation = submerchantValidationService.ValidateForPayment(merchantAcquirer, PaymentMethod.Boleto);
            if (!submerchantValidation.IsValid)
            {
                return PaymentMethodResult.Fail(
                    submerchantValidation.ErrorMessage ?? "Subconta externa nao ativa para operacao.",
                    submerchantValidation.ErrorCode,
                    submerchantValidation.StatusCode);
            }

            if (!merchantAcquirer.Acquirer.SupportsBoleto)
            {
                return PaymentMethodResult.Fail(
                    "Adquirente configurado nao suporta boleto.",
                    PaymentApiErrorCodes.UnsupportedPaymentMethod,
                    400);
            }

            if (!merchantAcquirer.IsBoletoEnabled())
            {
                return PaymentMethodResult.Fail(
                    "Pagamentos via Boleto não estão habilitados para esta conta.",
                    PaymentApiErrorCodes.PaymentMethodDisabled,
                    400);
            }

            if (!await IsBoletoEnabledForMerchantAsync(input.MerchantId, ct))
            {
                return PaymentMethodResult.Fail(
                    "Pagamentos via Boleto não estão habilitados para esta conta.",
                    PaymentApiErrorCodes.PaymentMethodDisabled,
                    400);
            }

            var acquirer = merchantAcquirer.Acquirer;
            var acquirerLimitsError = ValidateAcquirerBoletoLimits(input.Amount, acquirer);
            if (acquirerLimitsError != null)
                return acquirerLimitsError;

            var feeContext = input.IsPaymentLinkPayment
                ? PaymentFeeContext.PaymentLink
                : input.IsCheckoutPayment
                    ? PaymentFeeContext.Checkout
                    : PaymentFeeContext.Api;

            var limits = await merchantCalculationService.GetPaymentFeeSettingsAsync(
                input.MerchantId,
                PaymentMethod.Boleto,
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

            var customer = await dbContext.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == input.CustomerId.Value && c.MerchantId == input.MerchantId, ct);

            if (customer == null)
            {
                return PaymentMethodResult.Fail(
                    "Cliente não encontrado.",
                    PaymentApiErrorCodes.CustomerNotFound,
                    400);
            }

            if (string.IsNullOrWhiteSpace(customer.Name) || string.IsNullOrWhiteSpace(customer.Email))
            {
                return PaymentMethodResult.Fail(
                    "Cliente precisa ter nome e email para gerar boleto.",
                    "invalid_customer_data",
                    400);
            }

            var customerDocument = ResolveCustomerDocument(customer);
            var address = ResolveBoletoAddress(customer);

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

            var acquirerFee = FeeCalculator.Calculate(
                input.Amount,
                merchantAcquirer.BoletoInFeeMode,
                merchantAcquirer.BoletoInFeeFixed,
                merchantAcquirer.BoletoInFeePercentage);

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
                EnsureUtc(input.BoletoDueDate.Value));

            dbContext.Payments.Add(payment);

            swiftpay_api_core.Models.Database.PaymentBoleto boletoEntity;
            PaymentBoletoDto boletoDto;

            if (input.Environment == ApiEnvironment.Sandbox)
            {
                boletoEntity = CreateSandboxBoletoEntity(payment.Id, EnsureUtc(input.BoletoDueDate.Value));
                payment.AcquirerPaymentId = boletoEntity.Id.ToString();
                boletoDto = MapBoletoDto(boletoEntity);
            }
            else
            {
                var acquirerConfig = await acquirerConfigService.GetDefaultAcquirerConfigAsync(input.MerchantId, input.Environment);
                if (acquirerConfig == null)
                {
                    return PaymentMethodResult.Fail(
                        "Nenhum adquirente configurado para o merchant.",
                        PaymentApiErrorCodes.NoAcquirerConfigured,
                        400);
                }

                if (!acquirerConfig.SupportsBoleto)
                {
                    return PaymentMethodResult.Fail(
                        "Adquirente configurado nao suporta boleto.",
                        PaymentApiErrorCodes.UnsupportedPaymentMethod,
                        400);
                }

                if (!acquirerConfig.Config.Credentials.Any())
                {
                    return PaymentMethodResult.Fail(
                        "Credenciais de adquirente nao configuradas.",
                        PaymentApiErrorCodes.InvalidCredentials,
                        400);
                }

                if (acquirerConfig.AcquirerType == AcquirerType.ActivePayments)
                {
                    var billetRequest = new ActivePaymentsCreateBilletRequest
                    {
                        Amount = input.Amount / 100m,
                        CustomerName = customer.Name,
                        CustomerCpf = new string(customerDocument.Where(char.IsDigit).ToArray()),
                        CustomerEmail = customer.Email,
                        DueDate = input.BoletoDueDate.Value.ToString("yyyy-MM-dd"),
                        Description = input.BoletoInstructions ?? input.Description,
                        Street = address.Street,
                        Number = address.Number,
                        Complement = address.Complement,
                        District = address.District,
                        City = address.City,
                        State = address.State,
                        ZipCode = address.ZipCode,
                        ExternalReference = input.ExternalId ?? payment.Id.ToString(),
                        PostbackUrl = BuildWebhookUrl(acquirerConfig.Config, acquirerConfig.AcquirerType)
                    };

                    var billetResponse = await activePaymentsClient.CreateBilletAsync(
                        acquirerConfig.Config.ApiBaseUrl,
                        acquirerConfig.Config.GetRequiredCredential("publicKey"),
                        acquirerConfig.Config.GetRequiredCredential("secretKey"),
                        billetRequest);

                    if (!billetResponse.Success || billetResponse.Data?.Billet == null || string.IsNullOrEmpty(billetResponse.Data.ChargeId))
                    {
                        await apiLogService.LogAsync(new swiftpay_api_core.Models.Inputs.ApiLogInput
                        {
                            Action = ApiLogAction.AcquirerRequestFailed,
                            Status = ApiLogStatus.Failed,
                            MerchantId = input.MerchantId,
                            HttpMethod = "POST",
                            Endpoint = $"{acquirerConfig.Config.ApiBaseUrl}/charges/billet",
                            StatusCode = billetResponse.StatusCode ?? 0,
                            Details = $"CreateBillet: {billetResponse.ErrorMessage ?? "Erro ao processar requisicao."}",
                            ErrorCode = billetResponse.ErrorCode,
                            ResponseBody = billetResponse.ResponseBody,
                            AcquirerId = acquirerConfig.Config.AcquirerId,
                            AcquirerType = acquirerConfig.AcquirerType.ToString(),
                            ResourceType = ApiLogResourceType.Payment
                        });

                        return PaymentMethodResult.Fail(
                            "Falha ao gerar boleto. Tente novamente.",
                            PaymentApiErrorCodes.InternalError,
                            500);
                    }

                    payment.AcquirerPaymentId = billetResponse.Data.ChargeId;
                    payment.AcquirerStatus = billetResponse.Data.Status;

                    boletoEntity = new swiftpay_api_core.Models.Database.PaymentBoleto
                    {
                        Id = Guid.CreateVersion7(),
                        PaymentId = payment.Id,
                        Barcode = billetResponse.Data.Billet.Barcode,
                        DigitableLine = billetResponse.Data.Billet.DigitableLine,
                        PdfUrl = billetResponse.Data.Billet.BilletUrl,
                        RecipientName = null,
                        RecipientDocument = null,
                        PixCopyAndPaste = null,
                        PixExpiresAt = null,
                        DueDate = EnsureUtc(billetResponse.Data.Billet.DueDate ?? input.BoletoDueDate)
                    };

                    boletoDto = MapBoletoDto(boletoEntity);
                }
                else if (acquirerConfig.AcquirerType == AcquirerType.Coldfy)
                {
                    var daysToExpire = ResolveBoletoExpirationDays(input.BoletoDueDate.Value);
                    var normalizedDocument = new string(customerDocument.Where(char.IsDigit).ToArray());

                    var coldfyRequest = new ColdfyCreatePaymentRequest
                    {
                        Customer = new ColdfyCustomer
                        {
                            Name = customer.Name,
                            Email = customer.Email,
                            Phone = ResolveCustomerPhone(customer.Phone, input.CustomerPhone),
                            Document = new ColdfyDocument
                            {
                                Number = normalizedDocument,
                                Type = ResolveDocumentType(normalizedDocument)
                            }
                        },
                        PaymentMethod = ColdfyPaymentMethod.Boleto,
                        Amount = input.Amount,
                        Items =
                        [
                            new ColdfyItem
                            {
                                Title = string.IsNullOrWhiteSpace(input.Description) ? "Boleto" : input.Description.Trim(),
                                UnitPrice = input.Amount,
                                Quantity = 1
                            }
                        ],
                        Boleto = new ColdfyBoletoConfig
                        {
                            ExpiresInDays = daysToExpire
                        },
                        PostbackUrl = BuildWebhookUrl(acquirerConfig.Config, acquirerConfig.AcquirerType),
                        Description = input.BoletoInstructions ?? input.Description,
                        Metadata = BuildMetadata(input.ExternalId)
                    };

                    var coldfyResponse = await coldfyClient.CreatePaymentAsync(
                        acquirerConfig.Config.ApiBaseUrl,
                        acquirerConfig.Config.GetRequiredCredential("secretKey"),
                        acquirerConfig.Config.GetRequiredCredential("companyId"),
                        coldfyRequest);

                    if (!coldfyResponse.Success || coldfyResponse.Data?.Boleto == null || string.IsNullOrWhiteSpace(coldfyResponse.Data.Id))
                    {
                        await apiLogService.LogAsync(new swiftpay_api_core.Models.Inputs.ApiLogInput
                        {
                            Action = ApiLogAction.AcquirerRequestFailed,
                            Status = ApiLogStatus.Failed,
                            MerchantId = input.MerchantId,
                            HttpMethod = "POST",
                            Endpoint = $"{acquirerConfig.Config.ApiBaseUrl}/transactions",
                            StatusCode = coldfyResponse.StatusCode ?? 0,
                            Details = $"CreatePayment: {coldfyResponse.ErrorMessage ?? "Erro ao processar requisicao."}",
                            ErrorCode = coldfyResponse.ErrorCode,
                            ResponseBody = coldfyResponse.ResponseBody,
                            AcquirerId = acquirerConfig.Config.AcquirerId,
                            AcquirerType = acquirerConfig.AcquirerType.ToString(),
                            ResourceType = ApiLogResourceType.Payment
                        });

                        return PaymentMethodResult.Fail(
                            "Falha ao gerar boleto. Tente novamente.",
                            PaymentApiErrorCodes.InternalError,
                            500);
                    }

                    payment.AcquirerPaymentId = coldfyResponse.Data.Id;
                    payment.AcquirerStatus = coldfyResponse.Data.Status?.ToString();

                    boletoEntity = new swiftpay_api_core.Models.Database.PaymentBoleto
                    {
                        Id = Guid.CreateVersion7(),
                        PaymentId = payment.Id,
                        Barcode = coldfyResponse.Data.Boleto.Barcode,
                        DigitableLine = coldfyResponse.Data.Boleto.DigitableLine,
                        PdfUrl = coldfyResponse.Data.Boleto.BankSlipUrl,
                        RecipientName = null,
                        RecipientDocument = null,
                        PixCopyAndPaste = null,
                        PixExpiresAt = null,
                        DueDate = EnsureUtc(coldfyResponse.Data.Boleto.ExpirationDate ?? input.BoletoDueDate)
                    };

                    boletoDto = MapBoletoDto(boletoEntity);
                }
                else if (acquirerConfig.AcquirerType == AcquirerType.HeartPay)
                {
                    var heartPayBaseUrl = ResolveHeartPayBaseUrl(acquirerConfig.Config.ApiBaseUrl);

                    var heartPayRequest = new HeartPayCreateBoletoRequest
                    {
                        Value = input.Amount,
                        CorrelationId = ResolveHeartPayCorrelationId(input.ExternalId, payment.Id),
                        Comment = input.BoletoInstructions ?? input.Description,
                        Customer = new HeartPayBoletoCustomerRequest
                        {
                            Name = customer.Name,
                            TaxId = new string(customerDocument.Where(char.IsDigit).ToArray()),
                            Email = customer.Email,
                            Phone = ResolveCustomerPhone(customer.Phone, input.CustomerPhone),
                            Address = new HeartPayBoletoCustomerAddressRequest
                            {
                                ZipCode = address.ZipCode,
                                Street = address.Street,
                                Number = address.Number,
                                Neighborhood = address.District,
                                City = address.City,
                                State = address.State,
                                Complement = address.Complement
                            }
                        },
                        AdditionalInfo = BuildHeartPayAdditionalInfo(input.ExternalId)
                    };

                    var heartPayResponse = await heartPayClient.CreateBoletoAsync(
                        heartPayBaseUrl,
                        acquirerConfig.Config.GetRequiredCredential("apiKey"),
                        heartPayRequest);

                    var heartPayPaymentId = heartPayResponse.Data?.CorrelationId ?? heartPayResponse.Data?.Id;

                    if (!heartPayResponse.Success || heartPayResponse.Data == null || string.IsNullOrWhiteSpace(heartPayPaymentId))
                    {
                        await apiLogService.LogAsync(new swiftpay_api_core.Models.Inputs.ApiLogInput
                        {
                            Action = ApiLogAction.AcquirerRequestFailed,
                            Status = ApiLogStatus.Failed,
                            MerchantId = input.MerchantId,
                            HttpMethod = "POST",
                            Endpoint = $"{heartPayBaseUrl}/v1/client/boletos",
                            StatusCode = heartPayResponse.StatusCode ?? 0,
                            Details = $"CreateBoleto: {heartPayResponse.ErrorMessage ?? "Erro ao processar requisicao."}",
                            ErrorCode = heartPayResponse.ErrorCode,
                            ResponseBody = heartPayResponse.ResponseBody,
                            AcquirerId = acquirerConfig.Config.AcquirerId,
                            AcquirerType = acquirerConfig.AcquirerType.ToString(),
                            ResourceType = ApiLogResourceType.Payment
                        });

                        return PaymentMethodResult.Fail(
                            BuildBoletoAcquirerFailureMessage(heartPayResponse.ErrorMessage),
                            PaymentApiErrorCodes.InternalError,
                            500);
                    }

                    payment.AcquirerPaymentId = heartPayPaymentId;
                    payment.AcquirerStatus = heartPayResponse.Data.Status;

                    boletoEntity = new swiftpay_api_core.Models.Database.PaymentBoleto
                    {
                        Id = Guid.CreateVersion7(),
                        PaymentId = payment.Id,
                        Barcode = heartPayResponse.Data.Barcode,
                        DigitableLine = heartPayResponse.Data.DigitableLine,
                        PdfUrl = heartPayResponse.Data.PdfUrl,
                        RecipientName = heartPayResponse.Data.RecipientName,
                        RecipientDocument = heartPayResponse.Data.RecipientDocument,
                        PixCopyAndPaste = heartPayResponse.Data.BrCode,
                        PixExpiresAt = EnsureUtc(heartPayResponse.Data.PixExpiresAt),
                        DueDate = EnsureUtc(heartPayResponse.Data.DueDate ?? input.BoletoDueDate)
                    };

                    boletoDto = MapBoletoDto(boletoEntity);
                }
                else if (acquirerConfig.AcquirerType == AcquirerType.MagicPay)
                {
                    var apiKey = acquirerConfig.Config.GetRequiredCredential("apiKey");
                    var normalizedDocument = new string(customerDocument.Where(char.IsDigit).ToArray());
                    var dueDateStr = input.BoletoDueDate.Value.ToString("yyyy-MM-dd");

                    var magicPayRequest = new MagicPayPaymentRequest
                    {
                        Amount = input.Amount,
                        Currency = "BRL",
                        Method = MagicPayPaymentMethod.BOLETO,
                        Description = input.BoletoInstructions ?? input.Description,
                        ExternalRef = input.ExternalId ?? payment.Id.ToString("N"),
                        NotificationUrl = BuildWebhookUrl(acquirerConfig.Config, acquirerConfig.AcquirerType),
                        Items =
                        [
                            new MagicPayItem
                            {
                                Name = input.Description ?? "Pagamento Boleto",
                                Quantity = 1,
                                Price = input.Amount,
                                Type = "DIGITAL"
                            }
                        ],
                        Payer = new MagicPayPayer
                        {
                            Name = customer.Name,
                            TaxId = normalizedDocument,
                            Email = customer.Email,
                            Phone = ResolveCustomerPhone(customer.Phone, input.CustomerPhone)
                        },
                        Boleto = new MagicPayBoleto
                        {
                            DueDate = dueDateStr,
                            Instructions = input.BoletoInstructions ?? input.Description,
                            Street = address.Street,
                            Number = address.Number,
                            Complement = address.Complement,
                            District = address.District,
                            City = address.City,
                            State = address.State,
                            ZipCode = address.ZipCode
                        }
                    };

                    var magicPayResponse = await magicPayClient.CreatePaymentAsync(
                        acquirerConfig.Config.ApiBaseUrl,
                        apiKey,
                        magicPayRequest);

                    if (!magicPayResponse.Success || magicPayResponse.Data == null || string.IsNullOrWhiteSpace(magicPayResponse.Data.Id))
                    {
                        await apiLogService.LogAsync(new swiftpay_api_core.Models.Inputs.ApiLogInput
                        {
                            Action = ApiLogAction.AcquirerRequestFailed,
                            Status = ApiLogStatus.Failed,
                            MerchantId = input.MerchantId,
                            HttpMethod = "POST",
                            Endpoint = $"{acquirerConfig.Config.ApiBaseUrl}/payment",
                            StatusCode = magicPayResponse.StatusCode ?? 0,
                            Details = $"CreateBoleto: {magicPayResponse.ErrorMessage ?? "Erro ao processar requisicao."}",
                            ErrorCode = magicPayResponse.ErrorCode,
                            ResponseBody = magicPayResponse.ResponseBody,
                            AcquirerId = acquirerConfig.Config.AcquirerId,
                            AcquirerType = acquirerConfig.AcquirerType.ToString(),
                            ResourceType = ApiLogResourceType.Payment
                        });

                        return PaymentMethodResult.Fail(
                            BuildBoletoAcquirerFailureMessage(magicPayResponse.ErrorMessage),
                            PaymentApiErrorCodes.InternalError,
                            500);
                    }

                    payment.AcquirerPaymentId = magicPayResponse.Data.Id;
                    payment.AcquirerStatus = magicPayResponse.Data.Status.ToString();

                    boletoEntity = new swiftpay_api_core.Models.Database.PaymentBoleto
                    {
                        Id = Guid.CreateVersion7(),
                        PaymentId = payment.Id,
                        Barcode = magicPayResponse.Data.Data?.Barcode,
                        DigitableLine = magicPayResponse.Data.Data?.DigitableLine,
                        PdfUrl = magicPayResponse.Data.Data?.PdfUrl,
                        RecipientName = null,
                        RecipientDocument = null,
                        PixCopyAndPaste = magicPayResponse.Data.Data?.Copypaste,
                        PixExpiresAt = null,
                        DueDate = EnsureUtc(input.BoletoDueDate)
                    };

                    boletoDto = MapBoletoDto(boletoEntity);
                }
                else
                {
                    return PaymentMethodResult.Fail(
                        "Adquirente configurado nao suporta boleto.",
                        PaymentApiErrorCodes.UnsupportedPaymentMethod,
                        400);
                }
            }

            payment.PaymentBoleto = boletoEntity;
            dbContext.PaymentsBoleto.Add(boletoEntity);

            try
            {
                await dbContext.SaveChangesAsync(ct);
            }
            catch (Exception dbEx)
            {
                logger.LogError(dbEx, "Database error saving boleto payment - PaymentId: {PaymentId}, BoletoId: {BoletoId}, Barcode: {Barcode}, DueDate: {DueDate}",
                    payment.Id, boletoEntity.Id, boletoEntity.Barcode, boletoEntity.DueDate);
                throw;
            }
            
            await PublishLedgerPendingAsync(payment);

            return new PaymentMethodResult
            {
                Success = true,
                Payment = payment,
                PaymentBoleto = boletoDto,
                StatusCode = 201
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating boleto transaction for merchant {MerchantId}", input.MerchantId);
            return PaymentMethodResult.Fail(
                "Erro interno ao criar transacao com boleto.",
                PaymentApiErrorCodes.InternalError,
                500);
        }
    }

    private async Task<bool> IsBoletoEnabledForMerchantAsync(Guid merchantId, CancellationToken ct)
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

        return merchantSettings?.BoletoEnabled ?? platformSettings.BoletoEnabled;
    }

    private static PaymentMethodResult? ValidateAcquirerBoletoLimits(long amount, Acquirer acquirer)
    {
        if (amount < acquirer.MinBoletoAmount)
        {
            return PaymentMethodResult.Fail(
                "O valor informado é inválido.",
                PaymentApiErrorCodes.InvalidAmount,
                400);
        }

        if (acquirer.MaxBoletoAmount > 0 && amount > acquirer.MaxBoletoAmount)
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
            .AnyAsync(p => p.MerchantId == input.MerchantId && p.ExternalId == input.ExternalId, ct);

        return !exists;
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
                                                    && v.Acquirer.SupportsBoleto
                                                    && v.IsBoletoEnabled()
                                                    && submerchantValidationService.IsReadyForRouting(v))
            ?? variants.FirstOrDefault(v => v.Id == secondaryId
                                            && v.Acquirer.IsActive
                                            && v.Acquirer.SupportsBoleto
                                            && v.IsBoletoEnabled()
                                            && submerchantValidationService.IsReadyForRouting(v))
            ?? variants.FirstOrDefault(v => v.Acquirer.IsActive
                                            && v.Acquirer.SupportsBoleto
                                            && v.IsBoletoEnabled()
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
        DateTime dueDate)
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
            Method = PaymentMethod.Boleto,
            Status = PaymentStatus.Pending,
            Description = input.Description,
            CallbackUrl = input.CallbackUrl,
            Environment = input.Environment,
            RequestOrigin = input.RequestOrigin,
            RequestSource = input.RequestSource,
            Metadata = input.Metadata,
            ExpiresAt = dueDate
        };
    }

    private static swiftpay_api_core.Models.Database.PaymentBoleto CreateSandboxBoletoEntity(Guid paymentId, DateTime dueDate)
    {
        return new swiftpay_api_core.Models.Database.PaymentBoleto
        {
            Id = Guid.CreateVersion7(),
            PaymentId = paymentId,
            Barcode = $"SANDBOX-{paymentId:N}"[..32],
            DigitableLine = $"SANDBOX-{paymentId:N}"[..32],
            PdfUrl = $"https://sandbox.swiftpay/payments/{paymentId:N}/boleto.pdf",
            RecipientName = "Sandbox",
            RecipientDocument = null,
            PixCopyAndPaste = null,
            PixExpiresAt = null,
            DueDate = dueDate
        };
    }

    private static PaymentBoletoDto MapBoletoDto(swiftpay_api_core.Models.Database.PaymentBoleto entity)
    {
        return new PaymentBoletoDto
        {
            Id = entity.Id,
            PaymentId = entity.PaymentId,
            Barcode = entity.Barcode,
            DigitableLine = entity.DigitableLine,
            PdfUrl = entity.PdfUrl,
            RecipientName = entity.RecipientName,
            RecipientDocument = entity.RecipientDocument,
            PixCopyAndPaste = entity.PixCopyAndPaste,
            PixExpiresAt = entity.PixExpiresAt,
            DueDate = entity.DueDate
        };
    }

    private static string ResolveCustomerDocument(Customer customer)
    {
        if (!string.IsNullOrWhiteSpace(customer.Document))
        {
            return customer.Document;
        }

        return DocumentUtils.GenerateValidCpf();
    }

    private static ColdfyDocumentType ResolveDocumentType(string document)
    {
        var digits = new string(document.Where(char.IsDigit).ToArray());
        return digits.Length == 14 ? ColdfyDocumentType.Cnpj : ColdfyDocumentType.Cpf;
    }

    private static string ResolveCustomerPhone(string? customerPhone, string? fallbackPhone)
    {
        var phone = string.IsNullOrWhiteSpace(customerPhone) ? fallbackPhone : customerPhone;
        if (string.IsNullOrWhiteSpace(phone))
        {
            return "11999999999";
        }

        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length > 11)
        {
            digits = digits[^11..];
        }

        return digits.Length < 10 ? "11999999999" : digits;
    }

    private static int ResolveBoletoExpirationDays(DateTime dueDate)
    {
        var days = (int)Math.Ceiling((dueDate.Date - DateTime.UtcNow.Date).TotalDays);
        return Math.Clamp(days, 1, 30);
    }

    private static Dictionary<string, string>? BuildMetadata(string? externalId)
    {
        if (string.IsNullOrWhiteSpace(externalId))
        {
            return null;
        }

        return new Dictionary<string, string>
        {
            { "externalId", externalId }
        };
    }

    private static string ResolveHeartPayCorrelationId(string? externalId, Guid paymentId)
    {
        if (!string.IsNullOrWhiteSpace(externalId))
            return externalId.Trim();

        return $"BOL_{paymentId:N}";
    }

    private static string ResolveHeartPayBaseUrl(string? baseUrl)
    {
        var normalizedBaseUrl = string.IsNullOrWhiteSpace(baseUrl)
            ? HeartPayCanonicalBaseUrl
            : baseUrl.TrimEnd('/');

        if (normalizedBaseUrl.Contains(HeartPayLegacyBaseHost, StringComparison.OrdinalIgnoreCase))
            return HeartPayCanonicalBaseUrl;

        if (normalizedBaseUrl.EndsWith("/v1/client", StringComparison.OrdinalIgnoreCase))
            return normalizedBaseUrl[..^"/v1/client".Length].TrimEnd('/');

        return normalizedBaseUrl;
    }

    private static string BuildBoletoAcquirerFailureMessage(string? acquirerErrorMessage)
    {
        var normalizedMessage = acquirerErrorMessage?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedMessage))
            return "Falha ao gerar boleto. Tente novamente.";

        return $"Falha ao gerar boleto: {normalizedMessage}";
    }

    private static List<HeartPayBoletoAdditionalInfoRequest>? BuildHeartPayAdditionalInfo(string? externalId)
    {
        if (string.IsNullOrWhiteSpace(externalId))
            return null;

        return
        [
            new HeartPayBoletoAdditionalInfoRequest
            {
                Key = "externalId",
                Value = externalId.Trim()
            }
        ];
    }

    private static BoletoAddress ResolveBoletoAddress(Customer customer)
    {
        var street = customer.AddressStreet;
        var number = customer.AddressNumber;
        var district = customer.AddressNeighborhood;
        var city = customer.AddressCity;
        var state = customer.AddressState;
        var zipCode = customer.AddressPostalCode;

        if (string.IsNullOrWhiteSpace(street) ||
            string.IsNullOrWhiteSpace(number) ||
            string.IsNullOrWhiteSpace(district) ||
            string.IsNullOrWhiteSpace(city) ||
            string.IsNullOrWhiteSpace(state) ||
            string.IsNullOrWhiteSpace(zipCode))
        {
            var generatedAddress = AddressUtils.GenerateValidAddress();
            return new BoletoAddress
            {
                Street = generatedAddress.Street,
                Number = generatedAddress.Number,
                Complement = generatedAddress.Complement,
                District = generatedAddress.District,
                City = generatedAddress.City,
                State = generatedAddress.State,
                ZipCode = generatedAddress.ZipCode
            };
        }

        return new BoletoAddress
        {
            Street = street,
            Number = number,
            Complement = customer.AddressComplement,
            District = district,
            City = city,
            State = state,
            ZipCode = zipCode
        };
    }

    private static string? BuildWebhookUrl(AcquirerConfig config, AcquirerType acquirerType)
    {
        return AcquirerWebhookUtils.BuildWebhookUrl(config.PlatformBaseUrl, acquirerType);
    }

    private static DateTime EnsureUtc(DateTime dt)
    {
        return dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);
    }

    private static DateTime? EnsureUtc(DateTime? dt)
    {
        return dt.HasValue ? EnsureUtc(dt.Value) : null;
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
                Description = $"Pagamento boleto pendente - {payment.Description}",
                Environment = payment.Environment
            });
    }

}
