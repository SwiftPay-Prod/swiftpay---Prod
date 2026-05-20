using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Users.UpdateOnboarding;

public sealed class UpdateOnboardingRequest
{
    public List<string> Discovery { get; set; } = [];
    public string? DiscoveryOther { get; set; }
    public List<string> Channels { get; set; } = [];
    public string? ChannelsOther { get; set; }
    public List<string> Goals { get; set; } = [];
    public string? GoalsOther { get; set; }
}

public sealed class UpdateOnboardingRequestValidator : Validator<UpdateOnboardingRequest>
{
    public UpdateOnboardingRequestValidator()
    {
        RuleFor(x => x.Discovery)
            .NotNull().WithMessage("O campo discovery é obrigatório.")
            .Must(x => x.Count > 0).WithMessage("Selecione pelo menos uma opção em discovery.");

        RuleFor(x => x.Channels)
            .NotNull().WithMessage("O campo channels é obrigatório.")
            .Must(x => x.Count > 0).WithMessage("Selecione pelo menos uma opção em channels.");

        RuleFor(x => x.Goals)
            .NotNull().WithMessage("O campo goals é obrigatório.")
            .Must(x => x.Count > 0).WithMessage("Selecione pelo menos uma opção em goals.");

        RuleFor(x => x.DiscoveryOther)
            .MaximumLength(200)
            .When(x => x.DiscoveryOther != null)
            .WithMessage("O campo discoveryOther deve ter no máximo 200 caracteres.");

        RuleFor(x => x.ChannelsOther)
            .MaximumLength(200)
            .When(x => x.ChannelsOther != null)
            .WithMessage("O campo channelsOther deve ter no máximo 200 caracteres.");

        RuleFor(x => x.GoalsOther)
            .MaximumLength(200)
            .When(x => x.GoalsOther != null)
            .WithMessage("O campo goalsOther deve ter no máximo 200 caracteres.");
    }
}

public sealed class UpdateOnboardingResponse : BaseResponse<UpdateOnboardingData>;

public sealed class UpdateOnboardingData
{
    public bool Completed { get; set; }
    public DateTime CompletedAt { get; set; }
}

public sealed class UpdateOnboardingPayload
{
    public List<string> Discovery { get; set; } = [];
    public string? DiscoveryOther { get; set; }
    public List<string> Channels { get; set; } = [];
    public string? ChannelsOther { get; set; }
    public List<string> Goals { get; set; } = [];
    public string? GoalsOther { get; set; }
}
