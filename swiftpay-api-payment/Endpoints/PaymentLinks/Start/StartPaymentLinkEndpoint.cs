using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Calculation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Endpoints.PaymentLinks.Get;
using swiftpay_api_payment.Endpoints.Transactions.Create;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Models.Transactions;

namespace swiftpay_api_payment.Endpoints.PaymentLinks.Start;

public sealed class StartPaymentLinkEndpoint(
    PrimaryDbContext dbContext,
    ITransactionService transactionService,
    IMerchantCalculationService calculationService
) : Endpoint<StartPaymentLinkRequest, StartPaymentLinkResponse>
{
    public override void Configure()
    {
        Post("{token}/start");
        Group<PaymentLinksGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(StartPaymentLinkRequest req, CancellationToken ct)
    {
        var paymentLink = await dbContext.PaymentLinks
            .IgnoreQueryFilters()
            .Include(pl => pl.Payment)
                .ThenInclude(p => p!.PaymentPix)
            .Include(pl => pl.Payment)
                .ThenInclude(p => p!.PaymentBoleto)
            .Include(pl => pl.Payment)
                .ThenInclude(p => p!.Customer)
            .FirstOrDefaultAsync(pl => pl.Token == req.Token, ct);

        if (paymentLink == null)
        {
            await Send.ResponseAsync(new StartPaymentLinkResponse
            {
                Error = new("Link de pagamento não encontrado.")
            }, 404, ct);
            return;
        }

        var isUnlimitedLink = !paymentLink.ExpiresAt.HasValue;

        if (paymentLink.ExpiresAt.HasValue && paymentLink.ExpiresAt.Value < DateTime.UtcNow)
        {
            await Send.ResponseAsync(new StartPaymentLinkResponse
            {
                Error = new("Este link de pagamento expirou.")
            }, 410, ct);
            return;
        }

        var enabledMethods = ParseEnabledMethods(paymentLink.EnabledMethods);
        if (!enabledMethods.Contains(req.Method))
        {
            await Send.ResponseAsync(new StartPaymentLinkResponse
            {
                Error = new("Método de pagamento não está habilitado para este link.")
            }, 400, ct);
            return;
        }

        var requiredFields = ParseRequiredBuyerFields(paymentLink.RequiredBuyerFields);
        var missingField = ValidateRequiredBuyerFields(requiredFields, req);
        if (missingField != null)
        {
            await Send.ResponseAsync(new StartPaymentLinkResponse
            {
                Error = new($"O campo {missingField} é obrigatório.")
            }, 400, ct);
            return;
        }

        if (!isUnlimitedLink && paymentLink.Payment != null)
        {
            var data = await BuildResponseDataAsync(paymentLink, enabledMethods, ct);
            await Send.OkAsync(new StartPaymentLinkResponse { Data = data }, ct);
            return;
        }

        var transactionAmount = paymentLink.Amount;
        if (paymentLink.PassFeeToCustomer)
        {
            var feeSettings = await calculationService.GetPaymentFeeSettingsAsync(
                paymentLink.MerchantId,
                req.Method,
                PaymentFeeContext.PaymentLink,
                ct);
            var fee = FeeCalculator.Calculate(
                paymentLink.Amount, feeSettings.FeeMode, feeSettings.FeeFixed, feeSettings.FeePercentage);
            transactionAmount = paymentLink.Amount + fee;
        }

        var input = new CreateTransactionInput
        {
            MerchantId = paymentLink.MerchantId,
            RequestOrigin = PaymentEndpointUtils.GetRequestOrigin(HttpContext),
            RequestSource = PaymentRequestSource.PaymentLink,
            Method = req.Method,
            Amount = transactionAmount,
            IsCheckoutPayment = false,
            IsPaymentLinkPayment = true,
            Currency = Enum.TryParse<CurrencyType>(paymentLink.Currency, true, out var currency)
                ? currency
                : CurrencyType.BRL,
            Description = paymentLink.Description,
            CustomerId = paymentLink.CustomerId,
            CallbackUrl = paymentLink.CallbackUrl,
            ExpirationMinutes = paymentLink.PixExpirationMinutes,
            BoletoDueDate = req.Method == PaymentMethod.Boleto ? paymentLink.BoletoDueDate : null,
            BoletoInstructions = req.Method == PaymentMethod.Boleto ? paymentLink.BoletoInstructions : null,
            CardNumber = req.Method == PaymentMethod.CreditCard ? req.CardNumber : null,
            CardHolderName = req.Method == PaymentMethod.CreditCard ? req.CardHolderName : null,
            CardExpirationMonth = req.Method == PaymentMethod.CreditCard ? req.CardExpirationMonth : null,
            CardExpirationYear = req.Method == PaymentMethod.CreditCard ? req.CardExpirationYear : null,
            Installments = req.Method == PaymentMethod.CreditCard ? req.Installments ?? 1 : 1,
            CardCvv = req.Method == PaymentMethod.CreditCard ? req.CardCvv : null,
            CustomerName = req.BuyerName,
            CustomerEmail = req.BuyerEmail,
            CustomerPhone = req.BuyerPhone
        };

        var result = await transactionService.CreateAsync(input);
        if (!result.Success || result.Payment == null)
        {
            await Send.ResponseAsync(new StartPaymentLinkResponse
            {
                Error = new(result.ErrorMessage ?? "Não foi possível iniciar o pagamento por este link.")
            }, result.StatusCode, ct);
            return;
        }

        paymentLink.PaymentId = result.Payment.Id;
        await dbContext.SaveChangesAsync(ct);

        var responseSource = await dbContext.PaymentLinks
            .IgnoreQueryFilters()
            .Include(pl => pl.Payment)
                .ThenInclude(p => p!.PaymentPix)
            .Include(pl => pl.Payment)
                .ThenInclude(p => p!.PaymentBoleto)
            .Include(pl => pl.Payment)
                .ThenInclude(p => p!.Customer)
            .FirstAsync(pl => pl.Id == paymentLink.Id, ct);

        var responseData = await BuildResponseDataAsync(responseSource, enabledMethods, ct);

        await Send.OkAsync(new StartPaymentLinkResponse
        {
            Data = responseData
        }, ct);
    }

    private static List<string> ParseRequiredBuyerFields(string? requiredBuyerFields)
    {
        if (string.IsNullOrWhiteSpace(requiredBuyerFields))
        {
            return [];
        }

        return requiredBuyerFields
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct()
            .ToList();
    }

    private static string? ValidateRequiredBuyerFields(List<string> requiredFields, StartPaymentLinkRequest req)
    {
        foreach (var field in requiredFields)
        {
            var isEmpty = field switch
            {
                "Name" => string.IsNullOrWhiteSpace(req.BuyerName),
                "Email" => string.IsNullOrWhiteSpace(req.BuyerEmail),
                "Phone" => string.IsNullOrWhiteSpace(req.BuyerPhone),
                _ => false
            };

            if (isEmpty)
            {
                return field switch
                {
                    "Name" => "Nome",
                    "Email" => "E-mail",
                    "Phone" => "Telefone",
                    _ => field
                };
            }
        }

        return null;
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

    private async Task<PaymentLinkData> BuildResponseDataAsync(PaymentLink paymentLink, List<PaymentMethod> enabledMethods, CancellationToken ct)
    {
        var payment = paymentLink.Payment;
        var platformDbSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct) ?? new PlatformSettings();

        var merchantSettings = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == paymentLink.MerchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        var resolvedBranding = PlatformLinkResolver.ResolvePaymentLinkBranding(
            platformDbSettings,
            merchantSettings,
            payment?.Method,
            enabledMethods);

        var feeAmounts = new Dictionary<string, long>();
        foreach (var method in enabledMethods)
        {
            var settings = await calculationService.GetPaymentFeeSettingsAsync(
                paymentLink.MerchantId,
                method,
                PaymentFeeContext.PaymentLink,
                ct);
            feeAmounts[method.ToString()] = FeeCalculator.Calculate(
                paymentLink.Amount, settings.FeeMode, settings.FeeFixed, settings.FeePercentage);
        }

        var data = new PaymentLinkData
        {
            Id = payment?.Id ?? paymentLink.Id,
            PaymentLinkId = paymentLink.Id,
            PaymentId = payment?.Id,
            EnabledMethods = enabledMethods,
            Method = payment?.Method,
            Amount = payment?.Amount ?? paymentLink.Amount,
            Currency = payment?.Currency.ToString() ?? paymentLink.Currency,
            Status = payment?.Status ?? PaymentStatus.Pending,
            Description = payment?.Description ?? paymentLink.Description,
            Environment = payment?.Environment ?? paymentLink.Environment,
            ExpiresAt = payment?.ExpiresAt ?? paymentLink.ExpiresAt,
            CreatedAt = payment?.CreatedAt ?? paymentLink.CreatedAt,
            CompletedAt = payment?.CompletedAt,
            IsPaymentStarted = payment != null,
            IsUnlimitedLink = !paymentLink.ExpiresAt.HasValue,
            RedirectUrl = paymentLink.RedirectUrl,
            RequiredBuyerFields = ParseRequiredBuyerFields(paymentLink.RequiredBuyerFields),
            ShowFees = paymentLink.ShowFees,
            FeeAmounts = feeAmounts,
            PassFeeToCustomer = paymentLink.PassFeeToCustomer,
            ShowSafefyBranding = resolvedBranding?.ShowSafefyBranding ?? true,
            ThemeMode = paymentLink.ThemeMode,
            LogoUrl = paymentLink.LogoUrl,
            ProductName = paymentLink.ProductName,
            ProductImageUrl = paymentLink.ProductImageUrl
        };

        if (payment?.PaymentPix != null)
        {
            data.Pix = ToPixData(payment.PaymentPix);
        }

        if (payment?.PaymentBoleto != null)
        {
            data.Boleto = ToBoletoData(payment, payment.PaymentBoleto);

            if (data.Pix == null && HasBoletoPixData(payment.PaymentBoleto))
            {
                data.Pix = ToPixData(payment.PaymentBoleto);
            }
        }

        return data;
    }

    private static bool HasBoletoPixData(swiftpay_api_core.Models.Database.PaymentBoleto paymentBoleto)
    {
        return !string.IsNullOrWhiteSpace(paymentBoleto.PixCopyAndPaste);
    }

    private static PixTransactionData ToPixData(swiftpay_api_core.Models.Database.PaymentPix paymentPix)
    {
        return new PixTransactionData
        {
            TxId = paymentPix.TxId,
            QrCode = paymentPix.QrCode,
            CopyAndPaste = paymentPix.CopyAndPaste,
            ExpiresAt = paymentPix.ExpiresAt
        };
    }

    private static PixTransactionData ToPixData(swiftpay_api_core.Models.Database.PaymentBoleto paymentBoleto)
    {
        return new PixTransactionData
        {
            TxId = null,
            QrCode = null,
            CopyAndPaste = paymentBoleto.PixCopyAndPaste,
            ExpiresAt = paymentBoleto.PixExpiresAt ?? paymentBoleto.DueDate
        };
    }

    private static BoletoTransactionData ToBoletoData(Payment payment, swiftpay_api_core.Models.Database.PaymentBoleto paymentBoleto)
    {
        return new BoletoTransactionData
        {
            Barcode = paymentBoleto.Barcode,
            DigitableLine = paymentBoleto.DigitableLine,
            PdfUrl = paymentBoleto.PdfUrl,
            RecipientName = paymentBoleto.RecipientName,
            RecipientDocument = MaskDocumentOrNull(paymentBoleto.RecipientDocument),
            PayerName = payment.Customer?.Name,
            PayerDocument = MaskDocumentOrNull(payment.Customer?.Document),
            PixCopyAndPaste = paymentBoleto.PixCopyAndPaste,
            PixExpiresAt = paymentBoleto.PixExpiresAt,
            DueDate = paymentBoleto.DueDate
        };
    }

    private static string? MaskDocumentOrNull(string? document)
    {
        var trimmed = document?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return null;
        }

        return MaskUtils.MaskDocument(trimmed);
    }
}
