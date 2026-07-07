using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Email;

/// <summary>
/// Bloco de conteúdo do template de email
/// </summary>
public class EmailBlock
{
    /// <summary>
    /// ID único do bloco (para ordenação e referência)
    /// </summary>
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Tipo do bloco
    /// </summary>
    public EmailBlockType Type { get; set; }

    /// <summary>
    /// Conteúdo principal do bloco (texto, URL, etc)
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// Ordem do bloco no template (0 = primeiro)
    /// </summary>
    public int Order { get; set; }

    /// <summary>
    /// Configurações específicas do bloco
    /// </summary>
    public EmailBlockSettings Settings { get; set; } = new();
}

/// <summary>
/// Coluna para blocos do tipo Columns
/// </summary>
public class EmailBlockColumn
{
    /// <summary>
    /// Blocos dentro desta coluna
    /// </summary>
    public List<EmailBlock> Blocks { get; set; } = [];

    /// <summary>
    /// Largura da coluna em porcentagem (opcional, padrão: dividido igualmente)
    /// </summary>
    public int? WidthPercent { get; set; }
}

/// <summary>
/// Tipos de blocos de email
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EmailBlockType
{
    /// <summary>
    /// Cabeçalho com logo e título
    /// </summary>
    Header,

    /// <summary>
    /// Bloco de texto
    /// </summary>
    Text,

    /// <summary>
    /// Botão com link
    /// </summary>
    Button,

    /// <summary>
    /// Imagem
    /// </summary>
    Image,

    /// <summary>
    /// Banner de imagem com largura total
    /// </summary>
    Banner,

    /// <summary>
    /// Lista de produtos do pedido
    /// </summary>
    ProductList,

    /// <summary>
    /// Lista de itens digitais entregues
    /// </summary>
    DigitalItemsList,

    /// <summary>
    /// Informações de rastreamento
    /// </summary>
    TrackingInfo,

    /// <summary>
    /// Linha divisória
    /// </summary>
    Divider,

    /// <summary>
    /// Espaçador vertical
    /// </summary>
    Spacer,

    /// <summary>
    /// Rodapé
    /// </summary>
    Footer,

    /// <summary>
    /// Bloco de colunas (2 ou 3 colunas)
    /// </summary>
    Columns,

    /// <summary>
    /// Resumo do pedido (total, subtotal, etc)
    /// </summary>
    OrderSummary
}

/// <summary>
/// Configurações de estilo e comportamento do bloco
/// </summary>
public class EmailBlockSettings
{
    // === Texto ===
    
    /// <summary>
    /// Tamanho da fonte (px)
    /// </summary>
    public int? FontSize { get; set; }

    /// <summary>
    /// Cor do texto (hex)
    /// </summary>
    public string? TextColor { get; set; }

    /// <summary>
    /// Alinhamento do texto
    /// </summary>
    public EmailTextAlignment? TextAlign { get; set; }

    /// <summary>
    /// Negrito
    /// </summary>
    public bool? Bold { get; set; }

    /// <summary>
    /// Itálico
    /// </summary>
    public bool? Italic { get; set; }

    // === Botão ===

    /// <summary>
    /// URL do link do botão
    /// </summary>
    public string? ButtonUrl { get; set; }

    /// <summary>
    /// Cor de fundo do botão (hex)
    /// </summary>
    public string? ButtonBackgroundColor { get; set; }

    /// <summary>
    /// Cor do texto do botão (hex)
    /// </summary>
    public string? ButtonTextColor { get; set; }

    /// <summary>
    /// Raio da borda do botão (px)
    /// </summary>
    public int? ButtonBorderRadius { get; set; }

    // === Imagem ===

    /// <summary>
    /// URL da imagem
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Texto alternativo da imagem
    /// </summary>
    public string? ImageAlt { get; set; }

    /// <summary>
    /// Largura da imagem (px ou %)
    /// </summary>
    public string? ImageWidth { get; set; }

    /// <summary>
    /// Link da imagem (quando clicável)
    /// </summary>
    public string? ImageLink { get; set; }

    // === ProductList / DigitalItemsList ===

    /// <summary>
    /// Mostrar imagens dos produtos
    /// </summary>
    public bool? ShowProductImages { get; set; }

    /// <summary>
    /// Mostrar preços
    /// </summary>
    public bool? ShowPrices { get; set; }

    /// <summary>
    /// Mostrar quantidade
    /// </summary>
    public bool? ShowQuantity { get; set; }

    // === Espaçador ===

    /// <summary>
    /// Altura do espaçador (px)
    /// </summary>
    public int? SpacerHeight { get; set; }

    // === Divisor ===

    /// <summary>
    /// Cor da linha divisória (hex)
    /// </summary>
    public string? DividerColor { get; set; }

    /// <summary>
    /// Espessura da linha divisória (px)
    /// </summary>
    public int? DividerThickness { get; set; }

    // === Geral ===

    /// <summary>
    /// Cor de fundo do bloco (hex)
    /// </summary>
    public string? BackgroundColor { get; set; }

    /// <summary>
    /// Padding interno (px)
    /// </summary>
    public int? Padding { get; set; }

    /// <summary>
    /// Margem superior (px)
    /// </summary>
    public int? MarginTop { get; set; }

    /// <summary>
    /// Margem inferior (px)
    /// </summary>
    public int? MarginBottom { get; set; }

    // === Colunas ===

    /// <summary>
    /// Colunas para blocos do tipo Columns
    /// </summary>
    public List<EmailBlockColumn>? Columns { get; set; }
}

/// <summary>
/// Alinhamento de texto
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EmailTextAlignment
{
    Left,
    Center,
    Right
}
