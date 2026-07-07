using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.DevTools.ReadUsersForDevTools;

public sealed class ReadUsersForDevToolsRequest
{
    public string? Search { get; set; }
}

public sealed class ReadUsersForDevToolsResponse : BaseResponse<List<DevToolsUserData>>;

public sealed class DevToolsUserData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool HasPushEnabled { get; set; }
}
