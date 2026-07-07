using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.Bulletins.MarkBulletinAsRead;

public sealed class MarkBulletinAsReadRequest
{
    public Guid BulletinId { get; set; }
}

public sealed class MarkBulletinAsReadResponse : BaseResponse;
