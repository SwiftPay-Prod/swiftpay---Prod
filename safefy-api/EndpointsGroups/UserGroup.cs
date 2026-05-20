using FastEndpoints;

namespace safefy_api.EndpointsGroups;

public class UserGroup : Group
{
    public UserGroup()
    {
        Configure("v1/users", ep =>
        {
            ep.Description(x => x.WithTags("User"));
            ep.Options(x => x.RequireRateLimiting("users"));
        });
    }
}
