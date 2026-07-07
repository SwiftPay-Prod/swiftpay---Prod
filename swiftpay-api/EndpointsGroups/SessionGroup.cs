using FastEndpoints;

namespace swiftpay_api.EndpointsGroups;

public class SessionGroup : Group
{
    public SessionGroup()
    {
        Configure("v1/session", ep =>
        {
            ep.Description(x => x.WithTags("Session"));
        });
    }
}
