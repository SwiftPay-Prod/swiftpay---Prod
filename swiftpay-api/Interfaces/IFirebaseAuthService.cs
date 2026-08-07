namespace swiftpay_api.Interfaces;

/// <summary>
/// Claims extracted from a verified Firebase ID token.
/// </summary>
public sealed record FirebaseTokenClaims
{
    /// <summary>Firebase UID (claim <c>sub</c>/<c>user_id</c>).</summary>
    public required string Uid { get; init; }

    /// <summary>Email claim (lower-cased by the verifier).</summary>
    public required string Email { get; init; }

    /// <summary>Whether Firebase has verified the email (claim <c>email_verified</c>).</summary>
    public bool EmailVerified { get; init; }

    /// <summary>Sign-in provider: <c>password</c> or <c>google.com</c>.</summary>
    public required string SignInProvider { get; init; }
}

public interface IFirebaseAuthService
{
    /// <summary>
    /// Verifies a Firebase ID token (signature, issuer, audience, expiry) and returns its claims.
    /// Returns <c>null</c> when the token is invalid or expired.
    /// </summary>
    Task<FirebaseTokenClaims?> VerifyIdTokenAsync(string idToken, CancellationToken ct);
}
