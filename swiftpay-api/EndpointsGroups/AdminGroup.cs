using FastEndpoints;
using safefy_api_core.Models.Database;

namespace safefy_api.EndpointsGroups;

public class AdminGroup : Group
{
    public AdminGroup()
    {
        Configure("v1/admin", ep =>
        {
            ep.Description(x => x.WithTags("Admin"));
            ep.Roles(nameof(UserRole.God), nameof(UserRole.Admin));
        });
    }
}
