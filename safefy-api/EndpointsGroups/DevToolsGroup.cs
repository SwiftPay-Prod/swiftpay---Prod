using FastEndpoints;
using safefy_api_core.Models.Database;

namespace safefy_api.EndpointsGroups;

public class DevToolsGroup : Group
{
    public DevToolsGroup()
    {
        Configure("v1/dev-tools", ep =>
        {
            ep.Description(x => x.WithTags("DevTools"));
            ep.Roles(nameof(UserRole.God));
        });
    }
}
