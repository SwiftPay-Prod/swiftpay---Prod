using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Settings.WayneProtocol;

public sealed class UpdateWayneProtocolSettingsEndpoint(
    IWayneProtocolService wayneProtocolService,
    PrimaryDbContext dbContext
) : Endpoint<UpdateWayneProtocolSettingsRequest, UpdateWayneProtocolSettingsResponse>
{
    public override void Configure()
    {
        Patch("internal/wayne-protocol");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(UpdateWayneProtocolSettingsRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);

        if (adminId == null)
        {
            await Send.ResponseAsync(new UpdateWayneProtocolSettingsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var admin = await dbContext.Users.OrderBy(u => u.Id).FirstOrDefaultAsync(u => u.Id == adminId.Value, ct);

        if (admin == null || !admin.HasWayneProtocolAccess)
        {
            await Send.ResponseAsync(new UpdateWayneProtocolSettingsResponse
            {
                Error = new("Acesso não autorizado ao Protocolo Wayne.")
            }, 403, ct);
            return;
        }

        var environment = ParseEnvironment(req.Environment);

        try
        {
            var config = await wayneProtocolService.UpsertConfigAsync(
                environment,
                req.IsEnabled,
                req.CycleVolume,
                req.SamplingRatePercent,
                adminId.Value,
                ct);

            await Send.OkAsync(new UpdateWayneProtocolSettingsResponse
            {
                Data = new AdminWayneProtocolSettingsData
                {
                    Environment = environment.ToString(),
                    IsEnabled = config.IsEnabled,
                    CycleVolume = config.CycleVolume,
                    SamplingRatePercent = config.SamplingRatePercent
                },
                Message = "Configuração do Protocolo Wayne atualizada com sucesso."
            }, ct);
        }
        catch (ArgumentOutOfRangeException)
        {
            await Send.ResponseAsync(new UpdateWayneProtocolSettingsResponse
            {
                Error = new("Parâmetros inválidos para configuração do Protocolo Wayne.")
            }, 400, ct);
        }
    }

    private static ApiEnvironment ParseEnvironment(string value)
    {
        return Enum.TryParse<ApiEnvironment>(value, true, out var parsed)
            ? parsed
            : ApiEnvironment.Production;
    }
}
