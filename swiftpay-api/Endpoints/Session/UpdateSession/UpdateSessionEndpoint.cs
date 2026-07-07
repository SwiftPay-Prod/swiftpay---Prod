using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api.Middlewares;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Session.UpdateSession;

public sealed class UpdateSessionEndpoint(
    ISessionService sessionService,
    PrimaryDbContext dbContext
) : Endpoint<UpdateSessionRequest, UpdateSessionResponse>
{
    public override void Configure()
    {
        Patch("");
        Group<SessionGroup>();
    }

    public override async Task HandleAsync(UpdateSessionRequest req, CancellationToken ct)
    {
        var session = HttpContext.GetUserSession();
        var sessionId = HttpContext.GetSessionId();

        if (session == null || sessionId == null)
        {
            await Send.ResponseAsync(new UpdateSessionResponse
            {
                Error = new("Sessão não encontrada.")
            }, 401, ct);
            return;
        }

        if (req.SelectedMerchantId.HasValue)
        {
            var merchant = await dbContext.Merchants
                .AsNoTracking()
                .OrderBy(m => m.Id)
                .FirstOrDefaultAsync(m => m.Id == req.SelectedMerchantId.Value && m.UserId == session.UserId, ct);

            if (merchant == null)
            {
                await Send.ResponseAsync(new UpdateSessionResponse
                {
                    Error = new("Organização não encontrada ou você não tem acesso.")
                }, 404, ct);
                return;
            }

            await sessionService.UpdateSelectedMerchantAsync(sessionId, req.SelectedMerchantId.Value);
        }

        if (req.Environment.HasValue)
        {
            await sessionService.UpdateEnvironmentAsync(sessionId, req.Environment.Value);
        }

        var updatedSession = await sessionService.GetSessionAsync(sessionId);

        await Send.OkAsync(new UpdateSessionResponse
        {
            Data = new UpdateSessionData
            {
                SelectedMerchantId = updatedSession?.SelectedMerchantId,
                Environment = updatedSession?.Environment ?? ApiEnvironment.Sandbox
            },
            Message = "Sessão atualizada com sucesso."
        }, ct);
    }
}

public sealed class UpdateSessionRequest
{
    public Guid? SelectedMerchantId { get; set; }
    public ApiEnvironment? Environment { get; set; }
}

public sealed class UpdateSessionRequestValidator : Validator<UpdateSessionRequest>
{
    public UpdateSessionRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => x.SelectedMerchantId.HasValue || x.Environment.HasValue)
            .WithMessage("Pelo menos um campo deve ser informado.");
    }
}

public sealed class UpdateSessionResponse : BaseResponse<UpdateSessionData>;

public sealed class UpdateSessionData
{
    public Guid? SelectedMerchantId { get; set; }
    public ApiEnvironment Environment { get; set; }
}
