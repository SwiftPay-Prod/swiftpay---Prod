using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.Customers;

public sealed class CustomerAddressData
{
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
}

public sealed class CustomerData
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Document { get; set; }
    public CustomerDocumentType? DocumentType { get; set; }
    public string? Phone { get; set; }
    public CustomerStatus Status { get; set; }
    public string? Metadata { get; set; }
    public CustomerAddressData? Address { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class MinimalCustomer
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Document { get; set; }
    public CustomerDocumentType? DocumentType { get; set; }
    public string? Phone { get; set; }
    public CustomerStatus Status { get; set; }
    public CustomerAddressData? Address { get; set; }
    public int PaymentsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
