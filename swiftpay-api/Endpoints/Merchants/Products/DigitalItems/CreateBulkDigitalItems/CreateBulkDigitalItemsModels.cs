using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.Products.DigitalItems.CreateBulkDigitalItems;

public sealed class CreateBulkDigitalItemsRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public DigitalItemType Type { get; set; }
    public string? Label { get; set; }
    public List<string> Contents { get; set; } = [];
}

public sealed class CreateBulkDigitalItemsValidator : Validator<CreateBulkDigitalItemsRequest>
{
    public CreateBulkDigitalItemsValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
        RuleFor(x => x.Contents).NotEmpty().WithMessage("A lista de conteúdos é obrigatória.")
            .Must(x => x.Count <= 1000).WithMessage("Máximo de 1000 itens por vez.");
        RuleFor(x => x.Label).MaximumLength(200).WithMessage("O rótulo deve ter no máximo 200 caracteres.");
    }
}

public sealed class CreateBulkDigitalItemsResponse : BaseResponse<CreateBulkDigitalItemsData>;

public sealed class CreateBulkDigitalItemsData
{
    public int CreatedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> SkippedItems { get; set; } = [];
}
