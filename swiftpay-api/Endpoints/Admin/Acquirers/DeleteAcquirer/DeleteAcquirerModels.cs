using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Acquirers.DeleteAcquirer;

public sealed class DeleteAcquirerRequest
{
    public Guid AcquirerId { get; set; }
}

public sealed class DeleteAcquirerResponse : BaseResponse;
