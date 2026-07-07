using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.Bulletins.ReadUnreadBulletins;

public sealed class ReadUnreadBulletinsResponse : BaseResponse<List<UnreadBulletinData>>;

public sealed class UnreadBulletinData
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
