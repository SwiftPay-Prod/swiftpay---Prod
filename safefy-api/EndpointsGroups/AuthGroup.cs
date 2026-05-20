using FastEndpoints;

namespace safefy_api.EndpointsGroups;

public class AuthGroup : Group
{
    public AuthGroup()
    {
        Configure("v1/auth", ep =>
        {
            ep.AllowAnonymous();
            ep.Description(x => x.WithTags("Auth"));
            ep.Options(x => x.RequireRateLimiting("auth"));
        });
    }
}
