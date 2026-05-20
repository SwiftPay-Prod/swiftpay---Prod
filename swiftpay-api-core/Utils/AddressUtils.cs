namespace safefy_api_core.Utils;

public static class AddressUtils
{
    private static readonly Random Random = new();

    private static readonly string[] Streets =
    [
        "Avenida Paulista",
        "Rua Augusta",
        "Avenida Brasil",
        "Rua das Flores",
        "Avenida Atlantica",
        "Rua Oscar Freire",
        "Avenida Faria Lima",
        "Rua Haddock Lobo",
        "Avenida Reboucas",
        "Rua Consolacao",
        "Avenida Brigadeiro Faria Lima",
        "Rua Pamplona",
        "Avenida Nove de Julho",
        "Rua da Liberdade",
        "Avenida Ipiranga"
    ];

    private static readonly string[] Districts =
    [
        "Centro",
        "Jardins",
        "Pinheiros",
        "Vila Mariana",
        "Moema",
        "Itaim Bibi",
        "Brooklin",
        "Morumbi",
        "Perdizes",
        "Higienopolis",
        "Bela Vista",
        "Consolacao",
        "Liberdade",
        "Paraiso",
        "Vila Olimpia"
    ];

    private static readonly (string City, string State, string[] ZipCodes)[] Cities =
    [
        ("Sao Paulo", "SP", ["01310100", "01310200", "04547000", "01419000", "04538132"]),
        ("Rio de Janeiro", "RJ", ["20040020", "22041080", "22021001", "22250040", "22410002"]),
        ("Belo Horizonte", "MG", ["30130000", "30140071", "30150100", "30170010", "30180000"]),
        ("Curitiba", "PR", ["80010000", "80020100", "80030200", "80040300", "80050400"]),
        ("Porto Alegre", "RS", ["90010000", "90020100", "90030200", "90040300", "90050400"]),
        ("Salvador", "BA", ["40010000", "40020100", "40030200", "40040300", "40050400"]),
        ("Brasilia", "DF", ["70040010", "70050020", "70060030", "70070040", "70080050"]),
        ("Fortaleza", "CE", ["60010000", "60020100", "60030200", "60040300", "60050400"]),
        ("Recife", "PE", ["50010000", "50020100", "50030200", "50040300", "50050400"]),
        ("Florianopolis", "SC", ["88010000", "88020100", "88030200", "88040300", "88050400"])
    ];

    public static BrazilianAddress GenerateValidAddress()
    {
        var street = Streets[Random.Next(Streets.Length)];
        var number = Random.Next(1, 9999).ToString();
        var district = Districts[Random.Next(Districts.Length)];
        var cityData = Cities[Random.Next(Cities.Length)];
        var zipCode = cityData.ZipCodes[Random.Next(cityData.ZipCodes.Length)];

        return new BrazilianAddress
        {
            Street = street,
            Number = number,
            Complement = null,
            District = district,
            City = cityData.City,
            State = cityData.State,
            ZipCode = zipCode
        };
    }
}

public sealed class BrazilianAddress
{
    public required string Street { get; init; }
    public required string Number { get; init; }
    public string? Complement { get; init; }
    public required string District { get; init; }
    public required string City { get; init; }
    public required string State { get; init; }
    public required string ZipCode { get; init; }
}
