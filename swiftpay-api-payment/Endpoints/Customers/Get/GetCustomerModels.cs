using FastEndpoints;
using swiftpay_api_payment.Endpoints.Customers.Create;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Endpoints.Customers.Get;

public class GetCustomerRequest
{
    public Guid Id { get; set; }
}

public class GetCustomerResponse : BaseResponse<CustomerData> { }
