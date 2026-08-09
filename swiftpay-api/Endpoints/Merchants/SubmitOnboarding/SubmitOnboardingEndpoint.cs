using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Endpoints.Merchants.Shared;
using swiftpay_api.Mappers;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Merchants.SubmitOnboarding;

public sealed class SubmitOnboardingEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    INotificationService notificationService,
    IEmailIntentWriter emailIntentWriter
) : Endpoint<SubmitOnboardingRequest, SubmitOnboardingResponse>
{
    public override void Configure()
    {
        Verbs(Http.POST);
        Routes("{id:guid}/submit", "{id:guid}/onboarding/submit");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(SubmitOnboardingRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new SubmitOnboardingResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantKyc)
            .Include(m => m.User)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.Id && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new SubmitOnboardingResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Draft || merchant.KycStatus != MerchantKycStatus.Draft)
        {
            await Send.ResponseAsync(new SubmitOnboardingResponse
            {
                Error = new("Apenas organizações em rascunho podem ser enviadas para análise.")
            }, 400, ct);
            return;
        }

        var validationErrors = MerchantValidator.ValidateOnboardingComplete(merchant);
        if (validationErrors.Count > 0)
        {
            await Send.ResponseAsync(new SubmitOnboardingResponse
            {
                Error = new(string.Join(" ", validationErrors))
            }, 400, ct);
            return;
        }

        merchant.Status = MerchantStatus.Active;
        merchant.KycStatus = MerchantKycStatus.Pending;
        merchant.OnboardingStep = MerchantOnboardingStep.Completed;
        merchant.OnboardingCompletedAt = DateTime.UtcNow;
        merchant.KycSubmittedAt = DateTime.UtcNow;
        merchant.UpdatedAt = DateTime.UtcNow;

        await emailIntentWriter.Add(new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.BusinessTransition(
                EmailMessageType.KycSubmitted,
                merchant.Id,
                merchant.Id),
            MessageType = EmailMessageType.KycSubmitted,
            RecipientAddress = merchant.User.Email,
            Owner = new(EmailIntentOwnerType.Merchant, merchant.Id),
            CorrelationId = HttpContext.TraceIdentifier,
            Inputs = new Dictionary<string, string>
            {
                ["NAME"] = merchant.User.Name,
                ["MERCHANT_NAME"] = merchant.Name ?? ""
            }
        }, ct);

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.MerchantOnboardingCompleted, Status = SecurityLogStatus.Success, UserId = userId, Details = $"Merchant onboarding completed: {merchant.Id}" });
        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.MerchantKycSubmitted, Status = SecurityLogStatus.Success, UserId = userId, Details = $"Merchant KYC submitted: {merchant.Id}" });

        // Create notification for merchant
        _ = notificationService.CreateAsync(
            merchant.Id,
            NotificationType.Info,
            "Cadastro enviado para análise",
            "Seu cadastro foi enviado para análise. Você receberá uma notificação quando a análise for concluída. O prazo médio é de 1 a 2 dias úteis.",
            NotificationPriority.Normal
        );


        await Send.ResponseAsync(new SubmitOnboardingResponse
        {
            Data = MerchantMapper.ToData(merchant)
        }, cancellation: ct);
    }
}
