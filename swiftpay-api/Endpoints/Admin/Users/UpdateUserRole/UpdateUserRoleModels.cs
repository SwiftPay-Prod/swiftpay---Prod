using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Users.UpdateUserRole;

public sealed class UpdateUserRoleRequest
{
    public Guid UserId { get; set; }
    public UserRole Role { get; set; }
}

public sealed class UpdateUserRoleRequestValidator : Validator<UpdateUserRoleRequest>
{
    public UpdateUserRoleRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O identificador do usuário é obrigatório.");

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("O cargo informado é inválido.");
    }
}

public sealed class UpdateUserRoleResponse : BaseResponse<UpdateUserRoleData>;

public sealed class UpdateUserRoleData
{
    public Guid UserId { get; set; }
    public UserRole Role { get; set; }
    public string RoleDisplayName { get; set; } = string.Empty;
}
