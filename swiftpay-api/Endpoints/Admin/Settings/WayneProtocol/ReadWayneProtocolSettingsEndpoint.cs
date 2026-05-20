using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.Settings.WayneProtocol;

public sealed class ReadWayneProtocolSettingsEndpoint(
    IWayneProtocolService wayneProtocolService,
    PrimaryDbContext dbContext
) : Endpoint<ReadWayneProtocolSettingsRequest, ReadWayneProtocolSettingsResponse>
{
    public override void Configure()
    {
        Get("internal/wayne-protocol");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadWayneProtocolSettingsRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);

        if (adminId == null)
        {
            await Send.ResponseAsync(new ReadWayneProtocolSettingsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var admin = await dbContext.Users.OrderBy(u => u.Id).FirstOrDefaultAsync(u => u.Id == adminId.Value, ct);

        if (admin == null || !admin.HasWayneProtocolAccess)
        {
            await Send.ResponseAsync(new ReadWayneProtocolSettingsResponse
            {
                Error = new("Acesso não autorizado ao Protocolo Wayne.")
            }, 403, ct);
            return;
        }

        var environment = ParseEnvironment(req.Environment);
        var config = await wayneProtocolService.GetConfigAsync(environment, ct);

        await Send.OkAsync(new ReadWayneProtocolSettingsResponse
        {
            Data = new AdminWayneProtocolSettingsData
            {
                Environment = environment.ToString(),
                IsEnabled = config.IsEnabled,
                CycleVolume = config.CycleVolume,
                SamplingRatePercent = config.SamplingRatePercent
            }
        }, ct);
    }

    private static ApiEnvironment ParseEnvironment(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return ApiEnvironment.Production;

        return Enum.TryParse<ApiEnvironment>(value, true, out var parsed)
            ? parsed
            : ApiEnvironment.Production;
    }
}
