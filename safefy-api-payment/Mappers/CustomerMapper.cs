using safefy_api_core.Models.Database;
using safefy_api_payment.Endpoints.Customers.Create;

namespace safefy_api_payment.Mappers;

public static class CustomerMapper
{
    public static CustomerData ToData(Customer customer)
    {
        var hasAddress = !string.IsNullOrEmpty(customer.AddressStreet) ||
                         !string.IsNullOrEmpty(customer.AddressCity) ||
                         !string.IsNullOrEmpty(customer.AddressState);

        return new CustomerData
        {
            Id = customer.Id,
            ExternalId = customer.ExternalId,
            Name = customer.Name,
            Email = customer.Email,
            Document = customer.Document,
            DocumentType = customer.DocumentType,
            Phone = customer.Phone,
            Status = customer.Status,
            Metadata = customer.Metadata,
            Address = hasAddress ? new CustomerAddressData
            {
                Street = customer.AddressStreet,
                Number = customer.AddressNumber,
                Complement = customer.AddressComplement,
                Neighborhood = customer.AddressNeighborhood,
                City = customer.AddressCity,
                State = customer.AddressState,
                PostalCode = customer.AddressPostalCode,
                Country = customer.AddressCountry
            } : null,
            CreatedAt = customer.CreatedAt
        };
    }
}
