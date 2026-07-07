using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Users.ReadOnboarding;

public sealed class ReadOnboardingEndpoint(PrimaryDbContext dbContext) : EndpointWithoutRequest<ReadOnboardingResponse>
{
    public override void Configure()
    {
        Get("onboarding");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadOnboardingResponse { Error = new("Token inválido.") }, 401, ct);
            return;
        }

        var user = await dbContext.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new ReadOnboardingResponse { Error = new("Usuário não encontrado.") }, 404, ct);
            return;
        }

        var payload = DeserializePayload(user.UserOnboardingDataJson);

        await Send.OkAsync(new ReadOnboardingResponse
        {
            Data = new ReadOnboardingData
            {
                Completed = user.UserOnboardingCompleted,
                CompletedAt = user.UserOnboardingCompletedAt,
                Discovery = payload.Discovery,
                DiscoveryOther = payload.DiscoveryOther,
                Channels = payload.Channels,
                ChannelsOther = payload.ChannelsOther,
                Goals = payload.Goals,
                GoalsOther = payload.GoalsOther
            }
        }, ct);
    }

    private static UserOnboardingPayload DeserializePayload(string? payloadJson)
    {
        if (string.IsNullOrWhiteSpace(payloadJson))
            return new UserOnboardingPayload();

        try
        {
            var parsed = JsonSerializer.Deserialize<UserOnboardingPayload>(payloadJson);
            return parsed ?? new UserOnboardingPayload();
        }
        catch
        {
            return new UserOnboardingPayload();
        }
    }
}
