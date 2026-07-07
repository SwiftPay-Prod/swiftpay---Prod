namespace swiftpay_api_core.Models.Acquirer;

public sealed class AcquirerRequiredFieldsConfig
{
    public AcquirerAuthConfig Auth { get; set; } = new();
    public AcquirerOperationConfig? Pix { get; set; }
    public AcquirerOperationConfig? Boleto { get; set; }
    public AcquirerOperationConfig? CreditCard { get; set; }
    public AcquirerOperationConfig? Withdrawal { get; set; }
}

public sealed class AcquirerAuthConfig
{
    public string Method { get; set; } = "";
    public string Description { get; set; } = "";
    public List<AcquirerFieldRequirement> Fields { get; set; } = [];
}

public sealed class AcquirerOperationConfig
{
    public bool Supported { get; set; }
    public string Description { get; set; } = "";
    public string Endpoint { get; set; } = "";
    public string AmountFormat { get; set; } = "centavos";
    public List<AcquirerFieldRequirement> Fields { get; set; } = [];
}

public sealed class AcquirerFieldRequirement
{
    public string Name { get; set; } = "";
    public string Label { get; set; } = "";
    public string Type { get; set; } = "string";
    public bool Required { get; set; }
    public string? Description { get; set; }
    public string? Source { get; set; }
    public string? Example { get; set; }
}
