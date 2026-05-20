using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.Endpoints.Models;
using safefy_api.EndpointsGroups;
using safefy_api.Middlewares;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Session.ReadSession;

public sealed class ReadSessionEndpoint(PrimaryDbContext dbContext) : EndpointWithoutRequest<ReadSessionResponse>
{
    public override void Configure()
    {
        Get("");
        Group<SessionGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var session = HttpContext.GetUserSession();

        if (session == null)
        {
            await Send.ResponseAsync(new ReadSessionResponse
            {
                Error = new("Sessão não encontrada.")
            }, 401, ct);
            return;
        }

        var userProfile = await dbContext.Users
            .IgnoreQueryFilters()
            .Where(u => u.Id == session.UserId)
            .OrderBy(u => u.Id)
            .Select(u => new { u.ProfileImageUrl, u.SelectedBorderLevel, u.UserOnboardingCompleted })
            .FirstOrDefaultAsync(ct);

        string? selectedBorderImageUrl = null;
        if (userProfile?.SelectedBorderLevel != null)
        {
            selectedBorderImageUrl = await dbContext.LevelConfigs
                .Where(lc => lc.Level == userProfile.SelectedBorderLevel)
                .OrderBy(lc => lc.Id)
                .Select(lc => lc.BorderImageUrl)
                .FirstOrDefaultAsync(ct);
        }

        await Send.OkAsync(new ReadSessionResponse
        {
            Data = new SessionData
            {
                SessionId = session.SessionId,
                UserId = session.UserId,
                Email = session.Email,
                Name = session.Name,
                Role = session.Role,
                Status = session.Status,
                EmailVerified = session.EmailVerified,
                SelectedMerchantId = session.SelectedMerchantId,
                Environment = session.Environment,
                CreatedAt = session.CreatedAt,
                ExpiresAt = session.ExpiresAt,
                ProfileImageUrl = userProfile?.ProfileImageUrl,
                SelectedBorderImageUrl = selectedBorderImageUrl,
                UserOnboardingCompleted = userProfile?.UserOnboardingCompleted ?? false
            }
        }, ct);
    }
}

public sealed class ReadSessionResponse : BaseResponse<SessionData>;

public sealed class SessionData
{
    public required string SessionId { get; set; }
    public required Guid UserId { get; set; }
    public required string Email { get; set; }
    public string? Name { get; set; }
    public required UserRole Role { get; set; }
    public required UserStatus Status { get; set; }
    public required bool EmailVerified { get; set; }
    public Guid? SelectedMerchantId { get; set; }
    public ApiEnvironment Environment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? SelectedBorderImageUrl { get; set; }
    public bool UserOnboardingCompleted { get; set; }
}
