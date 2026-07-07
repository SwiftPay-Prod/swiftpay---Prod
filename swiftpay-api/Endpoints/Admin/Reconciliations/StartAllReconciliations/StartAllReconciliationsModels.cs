using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Reconciliations.StartAllReconciliations;

public sealed class StartAllReconciliationsRequest
{
    public bool SilentMode { get; set; } = false;
}

public sealed class StartAllReconciliationsRequestValidator : Validator<StartAllReconciliationsRequest>
{
    public StartAllReconciliationsRequestValidator()
    {
    }
}

public sealed class StartAllReconciliationsResponse : BaseResponse;
