using FastEndpoints;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api.Middlewares;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;

namespace swiftpay_api.Endpoints.Auth.SignOut;

public sealed class SignOutEndpoint(
    ISecurityLogService securityLog,
    ISessionService sessionService
) : EndpointWithoutRequest<SignOutResponse>
{
    public override void Configure()
    {
        Post("signout");
        Group<AuthGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var session = HttpContext.GetUserSession();
        var sessionId = HttpContext.GetSessionId();

        if (sessionId != null)
        {
            await sessionService.InvalidateSessionAsync(sessionId);
        }

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.SignOut,
            Status = SecurityLogStatus.Success,
            UserId = session?.UserId
        });

        await Send.OkAsync(new SignOutResponse
        {
            Message = "Logout realizado com sucesso."
        }, ct);
    }
}
