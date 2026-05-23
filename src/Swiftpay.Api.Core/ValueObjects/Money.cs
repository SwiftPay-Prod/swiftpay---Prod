namespace Swiftpay.Domain.ValueObjects;

public readonly record struct Money(long AmountInCents)
{
    public decimal ToDecimal() => AmountInCents / 100m;

    public static Money FromDecimal(decimal value) => new((long)(value * 100));

    public static Money operator +(Money a, Money b) => new(a.AmountInCents + b.AmountInCents);

    public static Money operator -(Money a, Money b) => new(a.AmountInCents - b.AmountInCents);

    public static Money Zero => new(0);

    public override string ToString() => $"R$ {ToDecimal().ToString("N2", new System.Globalization.CultureInfo("pt-BR"))}";
}
