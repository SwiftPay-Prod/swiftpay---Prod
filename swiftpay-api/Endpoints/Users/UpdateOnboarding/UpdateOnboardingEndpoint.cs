using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.UpdateOnboarding;

public sealed class UpdateOnboardingEndpoint(PrimaryDbContext dbContext)
    : Endpoint<UpdateOnboardingRequest, UpdateOnboardingResponse>
{
    public override void Configure()
    {
        Patch("onboarding");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(UpdateOnboardingRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateOnboardingResponse { Error = new("Token inválido.") }, 401, ct);
            return;
        }

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new UpdateOnboardingResponse { Error = new("Usuário não encontrado.") }, 404, ct);
            return;
        }

        var payload = BuildPayload(req);

        user.UserOnboardingDataJson = JsonSerializer.Serialize(payload);
        user.UserOnboardingCompleted = true;
        user.UserOnboardingCompletedAt ??= DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateOnboardingResponse
        {
            Data = new UpdateOnboardingData
            {
                Completed = user.UserOnboardingCompleted,
                CompletedAt = user.UserOnboardingCompletedAt ?? DateTime.UtcNow
            },
            Message = "Onboarding concluído com sucesso!"
        }, ct);
    }

    private static UpdateOnboardingPayload BuildPayload(UpdateOnboardingRequest req)
    {
        var discovery = Normalize(req.Discovery);
        var channels = Normalize(req.Channels);
        var goals = Normalize(req.Goals);

        return new UpdateOnboardingPayload()
        {
            Discovery = discovery,
            DiscoveryOther = discovery.Contains("outros") ? NormalizeText(req.DiscoveryOther) : null,
            Channels = channels,
            ChannelsOther = channels.Contains("outros") ? NormalizeText(req.ChannelsOther) : null,
            Goals = goals,
            GoalsOther = goals.Contains("outros") ? NormalizeText(req.GoalsOther) : null
        };
    }

    private static List<string> Normalize(List<string> source)
    {
        return source
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string? NormalizeText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
