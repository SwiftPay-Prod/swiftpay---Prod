using FastEndpoints;

namespace safefy_api.EndpointsGroups;

public sealed class FileGroup : Group
{
    public FileGroup()
    {
        Configure("v1/files", ep =>
        {
            ep.Description(d => d.WithTags("Files"));
            ep.Options(x => x.RequireRateLimiting("files"));
        });
    }
}
