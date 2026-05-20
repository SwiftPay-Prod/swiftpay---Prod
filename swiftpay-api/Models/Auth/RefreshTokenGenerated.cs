namespace safefy_api.Models.Auth;

public class RefreshTokenGenerated
{
    public string RefreshToken { get; set; } = null!;
    public DateTime ExpiredAt { get; set; }
    public DateTime CreatedOn { get; set; }
}
