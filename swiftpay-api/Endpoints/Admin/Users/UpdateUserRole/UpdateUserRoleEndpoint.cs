using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Interfaces;

namespace safefy_api.Endpoints.Admin.Users.UpdateUserRole;

public sealed class UpdateUserRoleEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog
) : Endpoint<UpdateUserRoleRequest, UpdateUserRoleResponse>
{
    public override void Configure()
    {
        Patch("users/{userId:guid}/role");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(UpdateUserRoleRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateUserRoleResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var adminRoleString = EndpointUtils.GetUserRole(User);
        if (string.IsNullOrEmpty(adminRoleString) || !Enum.TryParse<UserRole>(adminRoleString, out var adminRole))
        {
            await Send.ResponseAsync(new UpdateUserRoleResponse
            {
                Error = new("Cargo do administrador não encontrado.")
            }, 401, ct);
            return;
        }

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new UpdateUserRoleResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        if (user.Id == userId)
        {
            await Send.ResponseAsync(new UpdateUserRoleResponse
            {
                Error = new("Você não pode alterar seu próprio cargo.")
            }, 400, ct);
            return;
        }

        // Validação hierárquica: verifica se o admin pode alterar o cargo do usuário
        if (!CanAlterUserRole(adminRole, user.Role))
        {
            await Send.ResponseAsync(new UpdateUserRoleResponse
            {
                Error = new("Você não tem permissão para alterar o cargo deste usuário.")
            }, 403, ct);
            return;
        }

        // Validação hierárquica: verifica se o admin pode definir o novo cargo
        if (!CanAssignRole(adminRole, req.Role))
        {
            await Send.ResponseAsync(new UpdateUserRoleResponse
            {
                Error = new("Você não tem permissão para atribuir este cargo.")
            }, 403, ct);
            return;
        }

        var previousRole = user.Role;

        if (previousRole.Equals(req.Role))
        {
            await Send.ResponseAsync(new UpdateUserRoleResponse
            {
                Error = new("O usuário já possui este cargo.")
            }, 400, ct);
            return;
        }

        user.Role = req.Role;
        user.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.ProfileUpdate,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = $"Cargo do usuário {user.Id} alterado de {GetRoleDisplayName(previousRole)} para {GetRoleDisplayName(req.Role)}."
        });

        await Send.OkAsync(new UpdateUserRoleResponse
        {
            Data = new UpdateUserRoleData
            {
                UserId = user.Id,
                Role = user.Role,
                RoleDisplayName = GetRoleDisplayName(user.Role)
            },
            Message = "Cargo do usuário alterado com sucesso!"
        }, ct);
    }

    private static string GetRoleDisplayName(UserRole role)
    {
        return role switch
        {
            UserRole.God => "Super Administrador",
            UserRole.Admin => "Administrador",
            UserRole.Merchant => "Merchant",
            UserRole.Support => "Suporte",
            _ => role.ToString()
        };
    }

    /// <summary>
    /// Verifica se um cargo pode alterar outro cargo baseado na hierarquia.
    /// Cargos com valores menores (mais altos na hierarquia) podem alterar cargos com valores maiores.
    /// </summary>
    /// <param name="adminRole">Cargo do administrador que está fazendo a alteração</param>
    /// <param name="targetRole">Cargo do usuário que será alterado</param>
    /// <returns>True se pode alterar, False caso contrário</returns>
    private static bool CanAlterUserRole(UserRole adminRole, UserRole targetRole)
    {
        // Converte para int para comparar numericamente
        // God = 0, Admin = 1, Merchant = 2, Support = 3
        var adminLevel = (int)adminRole;
        var targetLevel = (int)targetRole;

        // Só pode alterar usuários com cargo inferior (valor maior)
        return adminLevel < targetLevel;
    }

    /// <summary>
    /// Verifica se um cargo pode atribuir outro cargo baseado na hierarquia.
    /// Cargos com valores menores (mais altos na hierarquia) podem atribuir cargos com valores maiores ou iguais.
    /// </summary>
    /// <param name="adminRole">Cargo do administrador que está atribuindo</param>
    /// <param name="newRole">Novo cargo que será atribuído</param>
    /// <returns>True se pode atribuir, False caso contrário</returns>
    private static bool CanAssignRole(UserRole adminRole, UserRole newRole)
    {
        // Converte para int para comparar numericamente
        var adminLevel = (int)adminRole;
        var newRoleLevel = (int)newRole;

        // Só pode atribuir cargos iguais ou inferiores (valor maior ou igual)
        return adminLevel <= newRoleLevel;
    }
}
