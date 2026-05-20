using FastEndpoints;

namespace safefy_api.EndpointsGroups;

public class BoletoGroup : Group
{
    public BoletoGroup()
    {
        Configure("v1/boleto", ep =>
        {
            ep.AllowAnonymous();
            ep.Description(x => x.WithTags("Boleto"));
        });
    }
}
