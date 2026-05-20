using FastEndpoints;
using safefy_api.EndpointsGroups;
using safefy_api_core.Interfaces;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.PushTokens.UnregisterPushToken;

public sealed class UnregisterPushTokenEndpoint(
    IPushNotificationService pushService
) : Endpoint<UnregisterPushTokenRequest, UnregisterPushTokenResponse>
{
    public override void Configure()
    {
        Delete("push-tokens");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(UnregisterPushTokenRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UnregisterPushTokenResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var result = await pushService.UnregisterTokenAsync(userId.Value, req.Token);

        if (!result)
        {
            await Send.ResponseAsync(new UnregisterPushTokenResponse
            {
                Error = new("Token de notificação não encontrado.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new UnregisterPushTokenResponse
        {
            Message = "Token de notificação removido com sucesso."
        }, ct);
    }
}
