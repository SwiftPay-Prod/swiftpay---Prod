using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Users.Profile.ReadProfile;

public sealed class ReadProfileResponse : BaseResponse<ProfileData>;

public sealed class ProfileData
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Bio { get; set; }
    public string? SocialLinks { get; set; }
    public string? ProfileImageUrl { get; set; }
    public Guid? ProfileImageId { get; set; }
}
