namespace safefy_api.Models.Auth;

public class JWTGenerated
{
    public string AccessToken { get; set; } = null!;
    public string? SessionId { get; set; }
    public DateTime ExpiredAt { get; set; }
    public DateTime CreatedOn { get; set; }
}
