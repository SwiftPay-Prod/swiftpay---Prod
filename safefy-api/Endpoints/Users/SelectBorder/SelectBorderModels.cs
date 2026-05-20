using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Users.SelectBorder;

public sealed class SelectBorderRequest
{
    public string? BorderLevel { get; set; }
}

public sealed class SelectBorderRequestValidator : Validator<SelectBorderRequest>
{
    private static readonly HashSet<string> ValidLevels = Enum.GetValues<MerchantLevel>()
        .Select(l => l.ToString())
        .ToHashSet();

    public SelectBorderRequestValidator()
    {
        RuleFor(x => x.BorderLevel)
            .Must(v => v == null || ValidLevels.Contains(v))
            .WithMessage("Nível de borda inválido.");
    }
}

public sealed class SelectBorderResponse : BaseResponse;
