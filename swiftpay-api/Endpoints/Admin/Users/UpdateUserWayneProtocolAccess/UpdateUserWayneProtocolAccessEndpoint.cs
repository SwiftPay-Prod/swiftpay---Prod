using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Users.UpdateUserWayneProtocolAccess;

public sealed class UpdateUserWayneProtocolAccessEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdateUserWayneProtocolAccessRequest, UpdateUserWayneProtocolAccessResponse>
{
    public override void Configure()
    {
        Patch("users/{userId:guid}/wayne-protocol-access");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(UpdateUserWayneProtocolAccessRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new UpdateUserWayneProtocolAccessResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var adminRoleString = EndpointUtils.GetUserRole(User);
        if (string.IsNullOrEmpty(adminRoleString) || !Enum.TryParse<UserRole>(adminRoleString, out var adminRole))
        {
            await Send.ResponseAsync(new UpdateUserWayneProtocolAccessResponse
            {
                Error = new("Cargo do administrador não encontrado.")
            }, 401, ct);
            return;
        }

        if (adminRole != UserRole.God)
        {
            await Send.ResponseAsync(new UpdateUserWayneProtocolAccessResponse
            {
                Error = new("Apenas usuários God podem gerenciar o acesso ao Protocolo Wayne.")
            }, 403, ct);
            return;
        }

        var user = await dbContext.Users.OrderBy(u => u.Id).FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new UpdateUserWayneProtocolAccessResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        user.HasWayneProtocolAccess = req.Enabled;
        await dbContext.SaveChangesAsync(ct);

        var status = req.Enabled ? "habilitado" : "desabilitado";
        await Send.OkAsync(new UpdateUserWayneProtocolAccessResponse
        {
            Message = $"Acesso ao Protocolo Wayne {status} com sucesso."
        }, ct);
    }
}
