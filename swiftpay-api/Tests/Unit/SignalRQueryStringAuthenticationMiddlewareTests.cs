using Microsoft.AspNetCore.Http;
using swiftpay_api.Middlewares;
using Xunit;

namespace swiftpay_api.Tests.Unit;

public sealed class SignalRQueryStringAuthenticationMiddlewareTests
{
    [Fact]
    public void PromoteAccessToken_OnHubPath_AddsBearerHeader()
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/hubs/notifications";
        context.Request.QueryString = new QueryString("?access_token=valid-token");

        SignalRQueryStringAuthenticationMiddleware.PromoteAccessToken(context);

        Assert.Equal("Bearer valid-token", context.Request.Headers.Authorization.ToString());
    }

    [Fact]
    public void PromoteAccessToken_OutsideHubPath_DoesNothing()
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/v1/session";
        context.Request.QueryString = new QueryString("?access_token=valid-token");

        SignalRQueryStringAuthenticationMiddleware.PromoteAccessToken(context);

        Assert.False(context.Request.Headers.ContainsKey("Authorization"));
    }

    [Fact]
    public void PromoteAccessToken_WithExistingAuthorization_PreservesHeader()
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/hubs/notifications";
        context.Request.QueryString = new QueryString("?access_token=query-token");
        context.Request.Headers.Authorization = "Bearer header-token";

        SignalRQueryStringAuthenticationMiddleware.PromoteAccessToken(context);

        Assert.Equal("Bearer header-token", context.Request.Headers.Authorization.ToString());
    }
}
