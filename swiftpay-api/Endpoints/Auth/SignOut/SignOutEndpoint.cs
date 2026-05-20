using FastEndpoints;
using safefy_api.EndpointsGroups;
using safefy_api.Interfaces;
using safefy_api.Middlewares;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;

namespace safefy_api.Endpoints.Auth.SignOut;

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
