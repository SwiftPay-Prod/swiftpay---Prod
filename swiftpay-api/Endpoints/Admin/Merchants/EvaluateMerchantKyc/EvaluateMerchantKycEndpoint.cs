using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Mappers;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Admin.Merchants.EvaluateMerchantKyc;

public sealed class EvaluateMerchantKycEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    INotificationService notificationService,
    IEmailService emailService
) : Endpoint<EvaluateMerchantKycRequest, EvaluateMerchantKycResponse>
{
    public override void Configure()
    {
        Post("merchant/{merchantId:guid}/evaluate");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(EvaluateMerchantKycRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new EvaluateMerchantKycResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantKyc)
            .Include(m => m.User)
            .Include(m => m.MerchantKycPendingItems)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new EvaluateMerchantKycResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.KycStatus != MerchantKycStatus.Pending && 
            merchant.KycStatus != MerchantKycStatus.UnderReview &&
            merchant.KycStatus != MerchantKycStatus.Complement)
        {
            await Send.ResponseAsync(new EvaluateMerchantKycResponse
            {
                Error = new("O KYC da organização não está pendente de avaliação.")
            }, 400, ct);
            return;
        }

        var hasUnevaluatedItems = merchant.MerchantKycPendingItems.Any(
            item => item.Status == MerchantKycPendingItemStatus.Responded
        );

        if (hasUnevaluatedItems)
        {
            await Send.ResponseAsync(new EvaluateMerchantKycResponse
            {
                Error = new("Existem itens de complemento aguardando avaliação. Avalie todos os itens antes de tomar a decisão final.")
            }, 400, ct);
            return;
        }

        switch (req.Status)
        {
            case MerchantKycEvaluationStatus.Approved:
                await HandleApprovalAsync(merchant, req, adminId.Value, ct);
                break;
            case MerchantKycEvaluationStatus.Rejected:
                await HandleRejectionAsync(merchant, req, adminId.Value, ct);
                break;
            case MerchantKycEvaluationStatus.Complement:
                await HandleComplementAsync(merchant, req, adminId.Value, ct);
                break;
        }

        await Send.ResponseAsync(new EvaluateMerchantKycResponse
        {
            Data = MerchantMapper.ToData(merchant)
        }, cancellation: ct);
    }

    private async Task HandleApprovalAsync(Merchant merchant, EvaluateMerchantKycRequest req, Guid adminId, CancellationToken ct)
    {
        merchant.KycStatus = MerchantKycStatus.Approved;
        merchant.Status = MerchantStatus.Active;
        merchant.KycApprovedAt = DateTime.UtcNow;
        merchant.UpdatedAt = DateTime.UtcNow;

        if (merchant.MerchantKyc != null)
        {
            merchant.MerchantKyc.RejectionReason = null;
            merchant.MerchantKyc.ApprovalReason = req.Reason;
            merchant.MerchantKyc.UpdatedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantKycApproved,
            Status = SecurityLogStatus.Success,
            UserId = adminId,
            Details = $"Merchant KYC approved: {merchant.Id}"
        });

        _ = notificationService.CreateSuccessNotificationAsync(
            merchant.Id,
            "KYC Aprovado! 🎉",
            "Parabéns! Sua organização foi aprovada e agora você pode começar a processar pagamentos.",
            "/dashboard",
            "Ir para o Dashboard",
            requiresMerchantRefresh: true
        );

        _ = emailService.SendAsync(
            merchant.User.Email,
            "Cadastro Aprovado - SwiftPay",
            EmailTemplate.KycApproved,
            new Dictionary<string, string>
            {
                { "NAME", merchant.User.Name },
                { "MERCHANT_NAME", merchant.Name ?? "" },
                { "DASHBOARD_URL", "https://app.swiftpay.com.br/dashboard" }
            },
            userId: merchant.UserId,
            merchantId: merchant.Id
        );
    }

    private async Task HandleRejectionAsync(Merchant merchant, EvaluateMerchantKycRequest req, Guid adminId, CancellationToken ct)
    {
        merchant.KycStatus = MerchantKycStatus.Rejected;
        merchant.Status = MerchantStatus.Draft;
        merchant.KycRejectedAt = DateTime.UtcNow;
        merchant.UpdatedAt = DateTime.UtcNow;

        if (merchant.MerchantKyc != null)
        {
            merchant.MerchantKyc.RejectionReason = req.Reason;
            merchant.MerchantKyc.UpdatedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantKycRejected,
            Status = SecurityLogStatus.Success,
            UserId = adminId,
            Details = $"Merchant KYC rejected: {merchant.Id}. Reason: {req.Reason}"
        });

        _ = notificationService.CreateWarningNotificationAsync(
            merchant.Id,
            "KYC Rejeitado",
            $"Sua solicitação de KYC foi rejeitada. Motivo: {req.Reason}. Por favor, corrija as informações e submeta novamente.",
            NotificationPriority.High,
            requiresMerchantRefresh: true
        );

        _ = emailService.SendAsync(
            merchant.User.Email,
            "Cadastro Rejeitado - SwiftPay",
            EmailTemplate.KycRejected,
            new Dictionary<string, string>
            {
                { "NAME", merchant.User.Name },
                { "MERCHANT_NAME", merchant.Name ?? "" },
                { "REASON", req.Reason ?? "" },
                { "ONBOARDING_URL", "https://app.swiftpay.com.br/onboarding" }
            },
            userId: merchant.UserId,
            merchantId: merchant.Id
        );
    }

    private async Task HandleComplementAsync(Merchant merchant, EvaluateMerchantKycRequest req, Guid adminId, CancellationToken ct)
    {
        merchant.KycStatus = MerchantKycStatus.Complement;
        merchant.UpdatedAt = DateTime.UtcNow;

        if (merchant.MerchantKyc != null)
        {
            merchant.MerchantKyc.AdminNotes = req.Reason;
            merchant.MerchantKyc.UpdatedAt = DateTime.UtcNow;
        }

        if (req.PendingItems != null)
        {
            foreach (var item in req.PendingItems)
            {
                var pendingItem = new MerchantKycPendingItem
                {
                    MerchantId = merchant.Id,
                    RequestedByUserId = adminId,
                    Type = item.Type,
                    FieldKey = item.FieldKey,
                    Title = item.Title,
                    Description = item.Description,
                    Status = MerchantKycPendingItemStatus.Pending,
                    AdminNotes = req.Reason
                };

                dbContext.MerchantKycPendingItems.Add(pendingItem);
            }
        }

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantKycComplement,
            Status = SecurityLogStatus.Success,
            UserId = adminId,
            Details = $"Merchant KYC complement requested: {merchant.Id}. Reason: {req.Reason}. Items: {req.PendingItems?.Count ?? 0}"
        });

        var itemCount = req.PendingItems?.Count ?? 0;
        var itemText = itemCount == 1 ? "1 item pendente" : $"{itemCount} itens pendentes";

        _ = notificationService.CreateInfoNotificationAsync(
            merchant.Id,
            "Complemento Solicitado",
            $"Precisamos de informações adicionais para completar a análise do seu KYC. Você tem {itemText} para responder.",
            NotificationPriority.High,
            "/merchants/review",
            "Ver Pendências",
            requiresMerchantRefresh: true
        );

        var pendingItemsHtml = BuildPendingItemsHtml(req.PendingItems);

        _ = emailService.SendAsync(
            merchant.User.Email,
            "Complemento Solicitado - SwiftPay",
            EmailTemplate.KycComplement,
            new Dictionary<string, string>
            {
                { "NAME", merchant.User.Name },
                { "MERCHANT_NAME", merchant.Name ?? "" },
                { "PENDING_ITEMS_HTML", pendingItemsHtml },
                { "COMPLEMENT_URL", "https://app.swiftpay.com.br/panel/merchants/review" }
            },
            userId: merchant.UserId,
            merchantId: merchant.Id
        );
    }

    private static string BuildPendingItemsHtml(List<EvaluatePendingItemRequest>? items)
    {
        if (items == null || items.Count == 0)
            return "<p style=\"font-size: 14px; color: #92400e; margin: 0;\">Por favor, verifique as pendências na plataforma.</p>";

        var html = new System.Text.StringBuilder();

        foreach (var item in items)
        {
            var typeLabel = item.Type switch
            {
                MerchantKycPendingItemType.Document => "📄 Documento",
                MerchantKycPendingItemType.Correction => "✏️ Correção",
                MerchantKycPendingItemType.Information => "ℹ️ Informação",
                MerchantKycPendingItemType.Clarification => "💬 Esclarecimento",
                _ => "📋 Solicitação"
            };

            html.Append($@"
                <div style=""background-color: #ffffff; border-radius: 6px; padding: 12px 16px; margin-bottom: 12px;"">
                    <p style=""font-size: 14px; font-weight: 600; color: #92400e; margin: 0 0 4px 0;"">
                        {typeLabel}: {System.Net.WebUtility.HtmlEncode(item.Title)}
                    </p>
                    <p style=""font-size: 13px; color: #78350f; margin: 0;"">
                        {System.Net.WebUtility.HtmlEncode(item.Description)}
                    </p>
                </div>");
        }

        return html.ToString();
    }
}
