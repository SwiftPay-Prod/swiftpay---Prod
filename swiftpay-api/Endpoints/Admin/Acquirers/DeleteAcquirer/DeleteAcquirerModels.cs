using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Acquirers.DeleteAcquirer;

public sealed class DeleteAcquirerRequest
{
    public Guid AcquirerId { get; set; }
}

public sealed class DeleteAcquirerResponse : BaseResponse;
