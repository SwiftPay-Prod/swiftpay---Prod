namespace safefy_api.Models.Auth;

public class JWTVerify
{
    public JWTDecode? Token { get; set; }
    public bool VerifyToken { get; set; }
    public string? ReasonNotVerify { get; set; }
}
