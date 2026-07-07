using FastEndpoints;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.EndpointsGroups;

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
