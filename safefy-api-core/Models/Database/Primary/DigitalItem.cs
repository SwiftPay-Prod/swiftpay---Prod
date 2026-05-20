using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

/// <summary>
/// Item digital de um produto - representa uma key, link ou conteúdo entregável
/// Exemplos: chave de jogo, link de download, código de acesso, etc.
/// </summary>
public class DigitalItem : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Produto ao qual este item pertence (deve ser ProductType.Digital)
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// Variante do produto (opcional - para itens específicos de uma variante)
    /// </summary>
    public Guid? VariantId { get; set; }

    /// <summary>
    /// Tipo do item digital
    /// </summary>
    public DigitalItemType Type { get; set; }

    /// <summary>
    /// Conteúdo do item (chave, link, texto, etc.)
    /// </summary>
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Rótulo/Descrição opcional do item (ex: "Chave Steam", "Link de Download")
    /// </summary>
    [MaxLength(200)]
    public string? Label { get; set; }

    /// <summary>
    /// Status do item
    /// </summary>
    public DigitalItemStatus Status { get; set; } = DigitalItemStatus.Available;

    /// <summary>
    /// Data de entrega (quando o item foi enviado para um cliente)
    /// </summary>
    public DateTime? DeliveredAt { get; set; }

    /// <summary>
    /// ID do pedido onde este item foi entregue
    /// </summary>
    public Guid? DeliveredToOrderId { get; set; }

    /// <summary>
    /// ID do item do pedido onde este item foi entregue
    /// </summary>
    public Guid? DeliveredToOrderItemId { get; set; }

    /// <summary>
    /// Data de quando o item foi reservado
    /// </summary>
    public DateTime? ReservedAt { get; set; }

    /// <summary>
    /// ID do pedido para o qual este item está reservado
    /// </summary>
    public Guid? ReservedForOrderId { get; set; }

    /// <summary>
    /// ID do item do pedido para o qual este item está reservado
    /// </summary>
    public Guid? ReservedForOrderItemId { get; set; }

    // Navegações
    public virtual Product Product { get; set; } = null!;
    public virtual Variant? Variant { get; set; }
    public virtual Order? DeliveredToOrder { get; set; }
    public virtual OrderItem? DeliveredToOrderItem { get; set; }
    public virtual Order? ReservedForOrder { get; set; }
    public virtual OrderItem? ReservedForOrderItem { get; set; }
}

/// <summary>
/// Tipo de item digital
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DigitalItemType
{
    /// <summary>
    /// Chave de jogo ou software
    /// </summary>
    Key,

    /// <summary>
    /// Link de download
    /// </summary>
    DownloadLink,

    /// <summary>
    /// Código de acesso
    /// </summary>
    AccessCode,

    /// <summary>
    /// Conteúdo de texto livre
    /// </summary>
    Text,

    /// <summary>
    /// Link externo
    /// </summary>
    ExternalLink
}

/// <summary>
/// Status do item digital
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DigitalItemStatus
{
    /// <summary>
    /// Disponível para entrega
    /// </summary>
    Available,

    /// <summary>
    /// Reservado (em processo de checkout)
    /// </summary>
    Reserved,

    /// <summary>
    /// Entregue a um cliente
    /// </summary>
    Delivered,

    /// <summary>
    /// Desativado manualmente
    /// </summary>
    Disabled
}
