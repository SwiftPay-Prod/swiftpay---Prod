namespace Swiftpay.Domain.ValueObjects;

public readonly record struct Email(string Address)
{
    public static Email Create(string address)
    {
        if (string.IsNullOrWhiteSpace(address))
            throw new ArgumentException("Email address cannot be empty", nameof(address));

        if (!address.Contains('@'))
            throw new ArgumentException("Email address must contain @", nameof(address));

        return new Email(address.Trim().ToLowerInvariant());
    }

    public override string ToString() => Address;
}
