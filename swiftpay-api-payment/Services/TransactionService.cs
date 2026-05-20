using Microsoft.EntityFrameworkCore;
using safefy_api_core.Constants;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Utils;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Interfaces.Transactions;
using safefy_api_payment.Models.Transactions;
using safefy_api_payment.Services.Sandbox;
using safefy_api_payment.Services.Transactions;

namespace safefy_api_payment.Services;

/// <summary>
/// Serviço de transações simples (gateway).
/// Para e-commerce com produtos, cupons e items, use OrderService.
/// </summary>
public class TransactionService(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider,
    IPixService pixService,
    ISandboxService sandboxService,
    IPaymentMethodServiceFactory paymentMethodServiceFactory,
    INotificationService notificationService,
    ILogger<TransactionService> logger
) : ITransactionService
{
    public async Task<TransactionResult> CreateAsync(CreateTransactionInput input)
    {
        try
        {
            var validationResult = ValidateByPaymentMethod(input);
            if (validationResult != null)
            {
                return validationResult;
            }

            if (input.CustomerId == null && !string.IsNullOrWhiteSpace(input.CustomerName))
            {
                input.CustomerId = await EnsureCustomerIdAsync(input);
            }
            else if (input.CustomerId != null)
            {
                await HydrateExistingCustomerDataAsync(input);
            }

            var paymentService = paymentMethodServiceFactory.GetService(input.Method);

            if (paymentService == null)
            {
                return new TransactionResult
                {
                    Success = false,
                    ErrorMessage = $"Método de pagamento '{input.Method}' não suportado.",
                    ErrorCode = PaymentApiErrorCodes.UnsupportedPaymentMethod,
                    StatusCode = 400
                };
            }

            var methodInput = CreatePaymentMethodInput(input);
            var result = await paymentService.CreateAsync(methodInput);

            if (result.Success && result.Payment != null)
            {
                _ = SendTransactionCreatedNotificationAsync(result.Payment, input);
            }

            return MapToTransactionResult(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating transaction for merchant {MerchantId}", input.MerchantId);
            return TransactionResult.Error("Erro interno ao criar transação.", PaymentApiErrorCodes.InternalError, 500);
        }
    }

    private async Task<Guid> EnsureCustomerIdAsync(CreateTransactionInput input)
    {
        var name = input.CustomerName?.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("CustomerName is required to create a customer.");
        }

        var normalizedEmail = NormalizeEmail(input.CustomerEmail);
        var normalizedDocument = NormalizeDocument(input.CustomerDocument);
        var normalizedPhone = NormalizePhone(input.CustomerPhone);
        var documentType = ResolveDocumentType(normalizedDocument);

        Customer? existingCustomer = null;

        if (!string.IsNullOrEmpty(normalizedDocument))
        {
            existingCustomer = await dbContext.Customers
                .FirstOrDefaultAsync(c => c.MerchantId == input.MerchantId && c.Document == normalizedDocument);
        }

        if (existingCustomer == null && !string.IsNullOrEmpty(normalizedEmail))
        {
            existingCustomer = await dbContext.Customers
                .FirstOrDefaultAsync(c => c.MerchantId == input.MerchantId && c.Email == normalizedEmail);
        }

        if (existingCustomer != null)
        {
            var updated = false;

            if (!string.IsNullOrEmpty(name) && string.IsNullOrEmpty(existingCustomer.Name))
            {
                existingCustomer.Name = name;
                updated = true;
            }

            if (!string.IsNullOrEmpty(normalizedEmail) && string.IsNullOrEmpty(existingCustomer.Email))
            {
                existingCustomer.Email = normalizedEmail;
                updated = true;
            }

            if (!string.IsNullOrEmpty(normalizedDocument) && string.IsNullOrEmpty(existingCustomer.Document))
            {
                existingCustomer.Document = normalizedDocument;
                existingCustomer.DocumentType = documentType;
                updated = true;
            }

            if (!string.IsNullOrEmpty(normalizedPhone) && string.IsNullOrEmpty(existingCustomer.Phone))
            {
                existingCustomer.Phone = normalizedPhone;
                updated = true;
            }

            if (updated)
            {
                await dbContext.SaveChangesAsync();
            }

            return existingCustomer.Id;
        }

        var customer = new Customer
        {
            Id = Guid.CreateVersion7(),
            MerchantId = input.MerchantId,
            Environment = environmentProvider.CurrentEnvironment,
            Name = name,
            Email = normalizedEmail ?? $"transaction-{Guid.NewGuid():N}@transactions.safefy.app",
            Document = normalizedDocument,
            DocumentType = documentType,
            Phone = normalizedPhone,
            Status = CustomerStatus.Active
        };

        dbContext.Customers.Add(customer);
        await dbContext.SaveChangesAsync();

        return customer.Id;
    }

    private static string? NormalizeEmail(string? email)
    {
        var trimmed = email?.Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;
        return trimmed.ToLowerInvariant();
    }

    private static string? NormalizeDocument(string? document)
    {
        if (string.IsNullOrWhiteSpace(document)) return null;
        var digits = new string(document.Where(char.IsDigit).ToArray());
        return string.IsNullOrEmpty(digits) ? null : digits;
    }

    private static string? NormalizePhone(string? phone)
    {
        return SanitizeUtils.SanitizePhone(phone);
    }

    private static CustomerDocumentType? ResolveDocumentType(string? normalizedDocument)
    {
        if (string.IsNullOrEmpty(normalizedDocument)) return null;

        return normalizedDocument.Length switch
        {
            11 => CustomerDocumentType.CPF,
            14 => CustomerDocumentType.CNPJ,
            _ => null
        };
    }

    private async Task HydrateExistingCustomerDataAsync(CreateTransactionInput input)
    {
        if (input.CustomerId == null)
        {
            return;
        }

        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(c => c.Id == input.CustomerId.Value && c.MerchantId == input.MerchantId);

        if (customer == null)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(input.CustomerName) && !string.IsNullOrWhiteSpace(customer.Name))
        {
            input.CustomerName = customer.Name.Trim();
        }

        if (string.IsNullOrWhiteSpace(input.CustomerDocument) && !string.IsNullOrWhiteSpace(customer.Document))
        {
            input.CustomerDocument = NormalizeDocument(customer.Document);
        }

        if (string.IsNullOrWhiteSpace(input.CustomerEmail) && !string.IsNullOrWhiteSpace(customer.Email))
        {
            input.CustomerEmail = NormalizeEmail(customer.Email);
        }

        var normalizedInputPhone = NormalizePhone(input.CustomerPhone);
        if (!string.IsNullOrEmpty(normalizedInputPhone))
        {
            input.CustomerPhone = normalizedInputPhone;

            if (customer.Phone == normalizedInputPhone)
            {
                return;
            }

            customer.Phone = normalizedInputPhone;
            await dbContext.SaveChangesAsync();
            return;
        }

        var normalizedCustomerPhone = NormalizePhone(customer.Phone);
        if (!string.IsNullOrEmpty(normalizedCustomerPhone))
        {
            input.CustomerPhone = normalizedCustomerPhone;
        }
    }

    public async Task<TransactionResult> SimulateAsync(Guid transactionId, Guid merchantId, SimulateAction action)
    {
        try
        {
            var payment = await GetPaymentWithPixAsync(transactionId, merchantId);

            if (payment == null)
            {
                return TransactionResult.Error("Transação não encontrada.", PaymentApiErrorCodes.PaymentNotFound, 404);
            }

            if (payment.Environment != ApiEnvironment.Sandbox)
            {
                return TransactionResult.Error("Simulação disponível apenas em ambiente Sandbox.", PaymentApiErrorCodes.SandboxOnly, 400);
            }

            var simulationResult = await sandboxService.SimulatePaymentAsync(payment, action);

            if (!simulationResult.Success)
            {
                return TransactionResult.Error(simulationResult.ErrorMessage!, simulationResult.ErrorCode, simulationResult.StatusCode);
            }

            await dbContext.SaveChangesAsync();

            return new TransactionResult
            {
                Success = true,
                Payment = payment,
                PaymentPix = payment.PaymentPix
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error simulating transaction {TransactionId}", transactionId);
            return TransactionResult.Error("Erro interno ao simular transação.", PaymentApiErrorCodes.InternalError, 500);
        }
    }

    public async Task<TransactionStatusResult> GetStatusAsync(Guid transactionId, Guid merchantId)
    {
        try
        {
            var payment = await dbContext.Payments
                .Include(p => p.PaymentPix)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == transactionId
                                       && p.MerchantId == merchantId
                                       && !p.SuppressMerchantVisibility);

            if (payment == null)
            {
                return new TransactionStatusResult
                {
                    Success = false,
                    ErrorMessage = "Transação não encontrada."
                };
            }

            if (payment.Environment == ApiEnvironment.Sandbox)
            {
                return MapPaymentToStatusResult(payment);
            }

            if (ShouldQueryAcquirerStatus(payment))
            {
                return await GetStatusFromAcquirerAsync(payment);
            }

            return MapPaymentToStatusResult(payment);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting transaction status {TransactionId}", transactionId);
            return new TransactionStatusResult
            {
                Success = false,
                ErrorMessage = "Erro interno ao consultar status."
            };
        }
    }

    private PaymentMethodInput CreatePaymentMethodInput(CreateTransactionInput input)
    {
        return new PaymentMethodInput
        {
            MerchantId = input.MerchantId,
            Amount = input.Amount,
            Currency = input.Currency,
            ExternalId = input.ExternalId,
            Description = input.Description,
            CustomerId = input.CustomerId,
            CallbackUrl = input.CallbackUrl,
            Metadata = input.Metadata,
            Environment = environmentProvider.CurrentEnvironment,
            RequestOrigin = input.RequestOrigin,
            RequestSource = input.RequestSource,
            ExpirationMinutes = input.ExpirationMinutes,
            CustomerName = input.CustomerName,
            CustomerDocument = input.CustomerDocument,
            CustomerEmail = input.CustomerEmail,
            CustomerPhone = input.CustomerPhone,
            IsCheckoutPayment = input.IsCheckoutPayment,
            IsPaymentLinkPayment = input.IsPaymentLinkPayment,
            CardNumber = input.CardNumber,
            CardHolderName = input.CardHolderName,
            CardExpirationMonth = input.CardExpirationMonth,
            CardExpirationYear = input.CardExpirationYear,
            Installments = input.Installments,
            CardCvv = input.CardCvv,
            BoletoDueDate = input.BoletoDueDate,
            BoletoInstructions = input.BoletoInstructions
        };
    }

    private static TransactionResult MapToTransactionResult(PaymentMethodResult result)
    {
        return new TransactionResult
        {
            Success = result.Success,
            Payment = result.Payment,
            PaymentPix = result.PaymentPix,
            PaymentCreditCard = result.PaymentCreditCard,
            PaymentBoleto = result.Payment?.PaymentBoleto,
            ErrorMessage = result.ErrorMessage,
            ErrorCode = result.ErrorCode,
            StatusCode = result.StatusCode
        };
    }

    private async Task<Payment?> GetPaymentWithPixAsync(Guid transactionId, Guid merchantId)
    {
        return await dbContext.Payments
            .Include(p => p.PaymentPix)
            .FirstOrDefaultAsync(p => p.Id == transactionId
                                   && p.MerchantId == merchantId
                                   && !p.SuppressMerchantVisibility);
    }

    private static bool ShouldQueryAcquirerStatus(Payment payment)
    {
        return payment.Method == PaymentMethod.Pix &&
               payment.Status == PaymentStatus.Pending &&
               payment.PaymentPix != null;
    }

    private async Task<TransactionStatusResult> GetStatusFromAcquirerAsync(Payment payment)
    {
        var pixStatus = await pixService.GetPixStatusAsync(
            payment.MerchantId,
            payment.PaymentPix!.TxId!,
            payment.Environment);

        if (pixStatus.Success)
        {
            return new TransactionStatusResult
            {
                Success = true,
                Status = pixStatus.Status,
                EndToEndId = pixStatus.EndToEndId,
                PayerName = pixStatus.PayerName,
                PayerDocument = pixStatus.PayerDocument,
                PayerBank = pixStatus.PayerBank,
                CompletedAt = pixStatus.CompletedAt
            };
        }

        return MapPaymentToStatusResult(payment);
    }

    private static TransactionStatusResult MapPaymentToStatusResult(Payment payment)
    {
        return new TransactionStatusResult
        {
            Success = true,
            Status = payment.Status,
            EndToEndId = payment.PaymentPix?.EndToEndId,
            PayerName = payment.PaymentPix?.PayerName,
            PayerDocument = payment.PaymentPix?.PayerDocument,
            PayerBank = payment.PaymentPix?.PayerBank,
            CompletedAt = payment.CompletedAt
        };
    }

    private async Task SendTransactionCreatedNotificationAsync(Payment payment, CreateTransactionInput input)
    {
        try
        {
            if (payment.SuppressWebhookAndNotification)
                return;

            var methodLabel = FormatUtils.FormatPaymentMethod(payment.Method.ToString());
            var netAmount = FeeCalculator.CalculateNetAmount(
                payment.Amount,
                payment.PlatformFee,
                payment.CheckoutTemplateFee);
            var message = NotificationTemplates.Payment.Pending.Message(netAmount, methodLabel);

            await notificationService.CreatePaymentNotificationAsync(
                payment.MerchantId,
                NotificationTemplates.Payment.Pending.Title,
                message,
                NotificationStatusType.PaymentPending,
                payment.Environment,
                NotificationTemplates.Routes.Transactions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending transaction created notification: PaymentId={PaymentId}", payment.Id);
        }
    }

    private static TransactionResult? ValidateByPaymentMethod(CreateTransactionInput input)
    {
        return input.Method switch
        {
            PaymentMethod.Pix => ValidatePixInput(input),
            PaymentMethod.CreditCard => ValidateCreditCardInput(input),
            PaymentMethod.Boleto => ValidateBoletoInput(input),
            _ => TransactionResult.Error(
                $"Método de pagamento '{input.Method}' não suportado.",
                PaymentApiErrorCodes.UnsupportedPaymentMethod,
                400)
        };
    }

    private static TransactionResult? ValidatePixInput(CreateTransactionInput input)
    {
        if (input.BoletoDueDate.HasValue)
        {
            return TransactionResult.Error(
                "A data de vencimento do boleto só pode ser informada para pagamentos com boleto.",
                PaymentApiErrorCodes.InvalidPaymentMethod,
                400);
        }

        return null;
    }

    private static TransactionResult? ValidateCreditCardInput(CreateTransactionInput input)
    {
        if (input.BoletoDueDate.HasValue)
        {
            return TransactionResult.Error(
                "A data de vencimento do boleto só pode ser informada para pagamentos com boleto.",
                PaymentApiErrorCodes.InvalidPaymentMethod,
                400);
        }

        return null;
    }

    private static TransactionResult? ValidateBoletoInput(CreateTransactionInput input)
    {
        if (!input.BoletoDueDate.HasValue)
        {
            return TransactionResult.Error(
                "A data de vencimento do boleto é obrigatória.",
                PaymentApiErrorCodes.InvalidBoletoDueDate,
                400);
        }

        if (input.BoletoDueDate.Value.Date < DateTime.UtcNow.Date.AddDays(2))
        {
            return TransactionResult.Error(
                "A data de vencimento do boleto deve ser no mínimo D+2.",
                PaymentApiErrorCodes.InvalidBoletoDueDate,
                400);
        }

        return null;
    }
}
