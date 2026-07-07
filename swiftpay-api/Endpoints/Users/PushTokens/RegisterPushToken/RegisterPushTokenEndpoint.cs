using FastEndpoints;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Users.PushTokens.RegisterPushToken;

public sealed class RegisterPushTokenEndpoint(
    IPushNotificationService pushService
) : Endpoint<RegisterPushTokenRequest, RegisterPushTokenResponse>
{
    public override void Configure()
    {
        Post("push-tokens");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(RegisterPushTokenRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RegisterPushTokenResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var platform = req.Platform.ToLowerInvariant() switch
        {
            "web" => PushTokenPlatform.Web,
            "ios" => PushTokenPlatform.Ios,
            "android" => PushTokenPlatform.Android,
            _ => PushTokenPlatform.Web
        };

        var deviceId = req.DeviceId ?? HttpContext.Request.Headers["X-Device-Id"].FirstOrDefault();
        
        var result = await pushService.RegisterTokenAsync(userId.Value, req.Token, platform, req.DeviceName, deviceId);

        if (result == null)
        {
            await Send.ResponseAsync(new RegisterPushTokenResponse
            {
                Error = new("Falha ao registrar token de notificação.")
            }, 500, ct);
            return;
        }

        await Send.OkAsync(new RegisterPushTokenResponse
        {
            Message = "Token de notificação registrado com sucesso."
        }, ct);
    }
}
