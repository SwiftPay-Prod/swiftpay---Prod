using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Users.Bulletins.ReadBulletinContent;

public sealed class ReadBulletinContentRequest
{
    public Guid BulletinId { get; set; }
}

public sealed class ReadBulletinContentResponse : BaseResponse<BulletinContentData>;

public sealed class BulletinContentData
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }
    public required List<string> UserReactions { get; set; }
    public required Dictionary<string, int> ReactionCounts { get; set; }
}
