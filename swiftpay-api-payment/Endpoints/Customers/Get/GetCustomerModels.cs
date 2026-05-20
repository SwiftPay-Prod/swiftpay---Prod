using FastEndpoints;
using safefy_api_payment.Endpoints.Customers.Create;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Customers.Get;

public class GetCustomerRequest
{
    public Guid Id { get; set; }
}

public class GetCustomerResponse : BaseResponse<CustomerData> { }
