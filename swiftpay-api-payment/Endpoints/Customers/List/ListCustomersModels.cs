using FluentValidation;
using FastEndpoints;
using swiftpay_api_payment.Endpoints.Customers.Create;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Validators;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api_payment.Endpoints.Customers.List;

/// <summary>
/// Request para listar clientes.
/// </summary>
public class ListCustomersRequest : IPaginatedRequest
{
    /// <summary>
    /// Número da página (padrão: 1).
    /// </summary>
    [QueryParam]
    public int Page { get; set; } = 1;

    /// <summary>
    /// Itens por página (padrão: 20, máx: 100).
    /// </summary>
    [QueryParam]
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// Filtrar por status: Active ou Inactive.
    /// </summary>
    [QueryParam]
    public CustomerStatus? Status { get; set; }

    /// <summary>
    /// Filtrar por tipo de documento: CPF ou CNPJ.
    /// </summary>
    [QueryParam]
    public CustomerDocumentType? DocumentType { get; set; }

    /// <summary>
    /// Buscar por nome, email ou documento.
    /// </summary>
    [QueryParam]
    public string? Search { get; set; }

    /// <summary>
    /// Filtrar por ID externo.
    /// </summary>
    [QueryParam]
    public string? ExternalId { get; set; }

    /// <summary>
    /// Data inicial de criação (formato ISO 8601).
    /// </summary>
    [QueryParam]
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Data final de criação (formato ISO 8601).
    /// </summary>
    [QueryParam]
    public DateTime? EndDate { get; set; }
}

/// <summary>
/// Validador do request de listagem de clientes.
/// </summary>
public sealed class ListCustomersRequestValidator : Validator<ListCustomersRequest>
{
    public ListCustomersRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();

        RuleFor(x => x.Status)
            .Must(BeValidStatus)
            .When(x => x.Status.HasValue)
            .WithMessage("Status inválido. Use: Active ou Inactive.");

        RuleFor(x => x.DocumentType)
            .Must(BeValidDocumentType)
            .When(x => x.DocumentType.HasValue)
            .WithMessage("Tipo de documento inválido. Use: CPF ou CNPJ.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("A data final deve ser maior ou igual à data inicial.");

        RuleFor(x => x.Search)
            .MaximumLength(255)
            .When(x => !string.IsNullOrEmpty(x.Search))
            .WithMessage("A busca deve ter no máximo 255 caracteres.");

        RuleFor(x => x.ExternalId)
            .MaximumLength(255)
            .When(x => !string.IsNullOrEmpty(x.ExternalId))
            .WithMessage("O external_id deve ter no máximo 255 caracteres.");
    }

    private static bool BeValidStatus(CustomerStatus? status)
    {
        return status.HasValue && Enum.IsDefined(status.Value);
    }

    private static bool BeValidDocumentType(CustomerDocumentType? documentType)
    {
        return documentType.HasValue && Enum.IsDefined(documentType.Value);
    }
}

public class ListCustomersResponse : BaseResponse<PaginatedResponse<CustomerData>> { }

