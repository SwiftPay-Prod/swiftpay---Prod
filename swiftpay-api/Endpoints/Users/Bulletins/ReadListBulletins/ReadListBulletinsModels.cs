using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.Bulletins.ReadListBulletins;

public sealed class ReadListBulletinsResponse : BaseResponse<List<BulletinListItem>>;

public sealed class BulletinListItem
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }
    public List<string> UserReactions { get; set; } = [];
    public Dictionary<string, int> ReactionCounts { get; set; } = [];
}
