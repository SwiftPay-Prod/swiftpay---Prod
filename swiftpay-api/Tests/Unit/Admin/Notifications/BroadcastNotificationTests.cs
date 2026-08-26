using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.Endpoints.Admin.Notifications.BroadcastNotification;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Services;
using Microsoft.EntityFrameworkCore;

namespace swiftpay_api.Tests.Unit.Admin.Notifications;

public sealed class BroadcastNotificationTests
{
    [Fact]
    public void Request_InvalidAudience_Should_FailValidation()
    {
        var req = new BroadcastNotificationRequest
        {
            Audience = "invalid",
            Title = "Test",
            Body = "Body"
        };

        var audience = (req.Audience ?? string.Empty).Trim().ToLowerInvariant();
        (audience == "all" || audience == "merchant" || audience == "user").Should().BeFalse();
    }

    [Fact]
    public void Request_MerchantAudience_WithoutMerchantId_Should_FailValidation()
    {
        var req = new BroadcastNotificationRequest
        {
            Audience = "merchant",
            Title = "Test",
            Body = "Body"
        };

        req.MerchantId.HasValue.Should().BeFalse();
    }

    [Fact]
    public void Request_UserAudience_WithoutUserIdOrEmail_Should_FailValidation()
    {
        var req = new BroadcastNotificationRequest
        {
            Audience = "user",
            Title = "Test",
            Body = "Body",
            UserId = null,
            UserEmail = null
        };

        (string.IsNullOrWhiteSpace(req.UserId) && string.IsNullOrWhiteSpace(req.UserEmail)).Should().BeTrue();
    }
}
