using Swiftpay.Domain.Entities;
using Swiftpay.Application.Features.PaymentLinks.DTOs;

namespace Swiftpay.Application.Common.Mappings;

public static class PaymentLinkMappings
{
    public static PaymentLinkResponse ToResponse(this PaymentLink link)
    {
        return new PaymentLinkResponse
        {
            Id = link.Id,
            Title = link.Title,
            Description = link.Description,
            Amount = link.Amount.AmountInCents,
            AmountMin = link.AmountMin?.AmountInCents,
            AmountMax = link.AmountMax?.AmountInCents,
            Slug = link.Slug,
            IsActive = link.IsActive,
            IsSandbox = link.IsSandbox,
            IsExpired = link.IsExpired,
            IsExhausted = link.IsExhausted,
            ExpiresAt = link.ExpiresAt,
            MaxUses = link.MaxUses,
            UsesCount = link.UsesCount,
            RequireDocument = link.RequireDocument,
            RequirePhone = link.RequirePhone,
            Theme = link.Theme,
            PrimaryColor = link.PrimaryColor,
            CtaText = link.CtaText,
            CreatedAt = link.CreatedAt,
        };
    }

    public static List<PaymentLinkResponse> ToResponseList(this List<PaymentLink> links)
        => links.Select(l => l.ToResponse()).ToList();
}
